#!/usr/bin/env python3
"""
Production Flask app using EXACT logic from test_yoloworld_mobilenet_live.py
Only differences: camera URL from UI, menu items from UI
Everything else identical to test system
"""

import os
import time
import json
import threading
from collections import defaultdict, deque
from typing import Dict
from datetime import datetime

os.environ['OPENCV_FFMPEG_CAPTURE_OPTIONS'] = (
    'rtsp_transport;tcp|'
    'fflags;nobuffer+discardcorrupt|'
    'flags;low_delay|'
    'max_delay;0|'
    'stimeout;5000000|'
    'timeout;5000000|'
    'reorder_queue_size;0|'
    'buffer_size;102400'
)
os.environ['OPENCV_VIDEOIO_PRIORITY_FFMPEG'] = '1'

import cv2
import numpy as np
import torch
from torchvision import models, transforms
from ultralytics import YOLOWorld
import supervision as sv

from flask import Flask, request, jsonify, Response, send_from_directory
from flask_socketio import SocketIO
from flask_cors import CORS
from werkzeug.utils import secure_filename
from flask_login import current_user

# Import database models and authentication
from db_models import db, User, Camera, MenuItem, DetectionSession, ItemCount, ScheduleSetting
from auth import auth_bp, init_auth, auth_required
from schedule_routes import schedule_bp
from roi_routes import roi_bp
from config import Config

# ========================= EXACT TEST SYSTEM LOGIC =========================
# All parameters and logic copied exactly from test_yoloworld_mobilenet_live.py

# YOLO-World settings (EXACT from test)
YOLOWORLD_WEIGHTS = "yolov8l-world.pt"
YOLO_PROMPTS = [
    # Tea cup synonyms
    'tea cup',
    'tea cups',
    'cup',
    'cups',
    'coffee cup',
    'coffee cups',
    'paper cup',
    'paper cups',
    'plastic cup',
    'plastic cups',
    'disposable cup',
    'disposable cups',
    'takeaway cup',
    'takeaway cups',
    'hot beverage cup',
    'tea mug',
    'mug',
    'drink cup',
    'beverage cup',
    'to-go cup',
    'takeout coffee cup',
    'clear plastic cup',
    'juice cup',
    # Water bottle (single anchor)
    'water bottle',
    'water bottles',
    'plastic water bottle',
    'sealed water bottle',
    'clear water bottle',
]
YOLO_CONF = 0.25
YOLO_IOU = 0.45  # lower NMS IoU to keep adjacent cups
YOLO_IMGSZ = 640

BOTTLE_FALLBACK_SIM_MIN = 0.20  # legacy constant (unused without fallback)

# Matching (EXACT from test)
SIM_THRESHOLD = 0.28
SIM_MARGIN = 0.04
LOCK_CONSEC_FRAMES = 2

DISPLAY_WIDTH = 1280

# Object association (EXACT from test)
IOU_ASSOC_THRESH = 0.45
OBJECT_TTL_FRAMES = 60

# Similarity scaling for small objects (helps far-away tea cups)
SIZE_SCALING_CONFIG = {
    "Tea": {
        "min_box_scale": 0.02,
        "reduction_cap": 0.25,
        "floor": 0.14,
    },
    "Water Bottle": {
        "min_box_scale": 0.03,
        "reduction_cap": 0.08,
        "floor": 0.28,
    },
}

MIN_SIM_BY_LABEL = {
    "Tea": 0.28,
    "Water Bottle": 0.34,
}

DETECTIONS_DIR = 'detections'

# ========================= EXACT UTILITY FUNCTIONS =========================
def letterbox_resize(image: np.ndarray, target_width: int) -> np.ndarray:
    """EXACT copy from test system"""
    h, w = image.shape[:2]
    if w <= 0:
        return image
    scale = target_width / float(w)
    new_size = (target_width, int(h * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_LINEAR)


def crop_with_bbox(image: np.ndarray, xyxy: np.ndarray) -> np.ndarray:
    """EXACT copy from test system"""
    x1, y1, x2, y2 = [int(v) for v in xyxy]
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(image.shape[1] - 1, x2)
    y2 = min(image.shape[0] - 1, y2)
    if x2 <= x1 or y2 <= y1:
        return None
    return image[y1:y2, x1:x2].copy()


def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    """EXACT copy from test system"""
    a_n = torch.nn.functional.normalize(a, dim=-1)
    b_n = torch.nn.functional.normalize(b, dim=-1)
    return float(torch.sum(a_n * b_n).item())


def bbox_iou(a: np.ndarray, b: np.ndarray) -> float:
    """EXACT copy from test system"""
    xa1, ya1, xa2, ya2 = [float(v) for v in a]
    xb1, yb1, xb2, yb2 = [float(v) for v in b]
    inter_w = max(0.0, min(xa2, xb2) - max(xa1, xb1))
    inter_h = max(0.0, min(ya2, yb2) - max(ya1, yb1))
    inter = inter_w * inter_h
    area_a = max(0.0, (xa2 - xa1)) * max(0.0, (ya2 - ya1))
    area_b = max(0.0, (xb2 - xb1)) * max(0.0, (yb2 - yb1))
    denom = max(area_a + area_b - inter, 1e-6)
    return inter / denom


def compute_box_scale(xyxy: np.ndarray, image_shape: tuple) -> float:
    """Return area ratio of bbox to full frame."""
    if xyxy is None or image_shape is None or len(image_shape) < 2:
        return None
    x1, y1, x2, y2 = xyxy
    w = max(0.0, float(x2) - float(x1))
    h = max(0.0, float(y2) - float(y1))
    frame_area = float(image_shape[0]) * float(image_shape[1])
    if frame_area <= 0.0:
        return None
    return (w * h) / frame_area


def scale_similarity_threshold(label: str, base_threshold: float, box_scale: float) -> float:
    """Adjust similarity threshold for small detections."""
    if box_scale is None:
        return base_threshold
    config = SIZE_SCALING_CONFIG.get(label)
    if not config:
        return base_threshold

    min_scale = float(config.get("min_box_scale", 0.05))
    reduction_cap = float(config.get("reduction_cap", 0.1))
    floor = float(config.get("floor", 0.25))

    if box_scale >= min_scale:
        return base_threshold

    denom = max(min_scale, 1e-6)
    scale_factor = min(1.0, (min_scale - box_scale) / denom)
    adjusted = base_threshold - (reduction_cap * scale_factor)
    return max(adjusted, min(base_threshold, floor))


def save_detection_artifacts(frame: np.ndarray, label: str, oid: int, bbox: np.ndarray, sim: float):
    try:
        if frame is None or bbox is None or getattr(bbox, "size", 0) != 4:
            return
        x1, y1, x2, y2 = [int(v) for v in bbox]
        h, w = frame.shape[:2]
        x1 = max(0, min(w - 1, x1))
        x2 = max(0, min(w, x2))
        y1 = max(0, min(h - 1, y1))
        y2 = max(0, min(h, y2))
        if x2 <= x1 or y2 <= y1:
            return
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        safe_label = label.replace(' ', '_') if label else 'unknown'
        base_name = f"{timestamp}_{safe_label}_id{oid}_sim{sim:.2f}"
        crop = frame[y1:y2, x1:x2]
        crop_path = os.path.join(DETECTIONS_DIR, f"{base_name}_crop.jpg")
        annotated_path = os.path.join(DETECTIONS_DIR, f"{base_name}_annotated.jpg")
        if crop.size > 0:
            cv2.imwrite(crop_path, crop)
        cv2.imwrite(annotated_path, frame)
    except Exception as exc:
        print(f"⚠️ Failed to save detection artifacts: {exc}")


# ========================= EXACT MODEL CLASSES =========================
class MobileNetEmbedder:
    """EXACT copy from test system"""
    def __init__(self, device: torch.device):
        self.device = device
        self.model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.IMAGENET1K_V2)
        # Use penultimate embedding
        self.model.classifier = torch.nn.Identity()
        self.model.eval().to(self.device)
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    @torch.inference_mode()
    def embed(self, bgr: np.ndarray) -> torch.Tensor:
        """EXACT copy from test system"""
        if bgr is None or bgr.size == 0:
            return torch.zeros(1280, device=self.device)  # MobileNetV3-Large feature size
        # Inset 10% to reduce rim bias
        h, w = bgr.shape[:2]
        inset = int(0.1 * min(h, w))
        if h > 2 * inset and w > 2 * inset:
            bgr = bgr[inset:h - inset, inset:w - inset]
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        tensor = self.transform(rgb).unsqueeze(0).to(self.device)
        feats = self.model(tensor)
        return feats.squeeze(0)


def build_menu_prototypes(embedder: MobileNetEmbedder, menu_refs: Dict[str, str]) -> dict:
    """EXACT copy from test system but uses dynamic menu_refs"""
    prototypes = {}
    for name, path in menu_refs.items():
        img = cv2.imread(path)
        if img is None:
            print(f"⚠️ Could not read menu image: {path}")
            continue
        prototypes[name] = embedder.embed(img).detach()
        print(f"✅ Prototype built: {name}")
    return prototypes


def match_to_menu(embedding: torch.Tensor, prototypes: dict, box_scale: float = None) -> tuple:
    """EXACT copy from test system"""
    if not prototypes:
        return "UNKNOWN", 0.0, 0.0
    best_name, best_sim, second_sim = "UNKNOWN", -1.0, -1.0
    for name, proto in prototypes.items():
        sim = cosine_similarity(embedding, proto)
        if sim > best_sim:
            second_sim = best_sim
            best_sim = sim
            best_name = name
        else:
            if sim > second_sim:
                second_sim = sim
    margin = best_sim - (second_sim if second_sim > -1 else 0.0)
    base_threshold = MIN_SIM_BY_LABEL.get(best_name, SIM_THRESHOLD)
    effective_threshold = scale_similarity_threshold(best_name, base_threshold, box_scale)
    if best_sim >= effective_threshold and margin >= SIM_MARGIN:
        return best_name, best_sim, margin
    return "UNKNOWN", best_sim, margin


# ========================= FLASK APP SETUP =========================
# Configure Flask to serve React frontend
app = Flask(__name__, 
            static_folder='../frontend/dist/assets',
            static_url_path='/assets')

# Load configuration
app.config.from_object(Config)
app.config['MENU_DATA_FILE'] = 'data/menu_items.json'  # Legacy fallback

# Initialize database
db.init_app(app)

# Initialize authentication
init_auth(app)

# Register authentication blueprint
app.register_blueprint(auth_bp)

# Register schedule blueprint
app.register_blueprint(schedule_bp)

# Register ROI blueprint
app.register_blueprint(roi_bp)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# Create directories
os.makedirs('static/uploads', exist_ok=True)
os.makedirs('data', exist_ok=True)
os.makedirs(DETECTIONS_DIR, exist_ok=True)

# ========================= GLOBAL VARIABLES =========================
# Detection system components (EXACT from test)
device = None
yolo = None
tracker = None
embedder = None
prototypes = {}

# State variables (EXACT from test)
track_state = {}
counts = defaultdict(int)
objects = {}
tracker_to_object = {}
next_object_id = 1

# Camera and processing
camera = None
camera_url = os.environ.get('DEFAULT_CAMERA_URL', 'rtsp://100.106.21.91:8554/Dispatch')
detection_enabled = False
annotated_frame = None
processing_thread = None
camera_backend = None

BACKENDS_TO_TRY = [
    cv2.CAP_FFMPEG,
    cv2.CAP_GSTREAMER,
    cv2.CAP_ANY
]

# ========================= MENU MANAGEMENT =========================
def load_menu_items():
    """Load menu items from database (with JSON fallback for backward compatibility)"""
    try:
        # Try loading from database first
        if current_user.is_authenticated:
            with app.app_context():
                db_items = MenuItem.query.filter_by(user_id=current_user.id).all()
                items = []
                for item in db_items:
                    item_dict = item.to_dict()
                    # Convert format for backward compatibility
                    items.append({
                        'id': item_dict['id'],
                        'name': item_dict['name'],
                        'description': '',
                        'reference_images': [item_dict['image']] if item_dict.get('image') else [],
                        'created_at': item_dict.get('created_at')
                    })
                return items
        
        # Fallback to JSON file if not authenticated
        if os.path.exists(app.config['MENU_DATA_FILE']):
            with open(app.config['MENU_DATA_FILE'], 'r') as f:
                menu_data = json.load(f)
            return menu_data.get('items', [])
        return []
    except Exception as e:
        print(f"Error loading menu items: {e}")
        return []


def save_menu_items(items):
    """Save menu items to database (with JSON fallback for backward compatibility)"""
    try:
        # Also save to JSON for backward compatibility
        menu_data = {'items': items}
        with open(app.config['MENU_DATA_FILE'], 'w') as f:
            json.dump(menu_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving menu items: {e}")
        return False


def get_menu_refs():
    """Convert menu items to the format expected by test system logic"""
    menu_refs = {}
    items = load_menu_items()
    
    for item in items:
        if 'name' in item and 'reference_images' in item and item['reference_images']:
            name = item['name']
            relative_path = item['reference_images'][0]
            full_path = os.path.join(app.config['UPLOAD_FOLDER'], relative_path)
            if os.path.exists(full_path):
                menu_refs[name] = full_path
                print(f"📋 Menu item loaded: {name} -> {full_path}")
    
    return menu_refs


def rebuild_prototypes():
    """Rebuild prototypes when menu items change"""
    global prototypes, counts
    
    if embedder is None:
        return False
    
    menu_refs = get_menu_refs()
    prototypes = build_menu_prototypes(embedder, menu_refs)
    
    # Initialize counts to zero for all menu items
    counts.clear()
    for name in menu_refs.keys():
        counts[name] = 0
    
    print(f"🔄 Prototypes rebuilt: {list(prototypes.keys())}")
    return True


# ========================= CAMERA HELPERS =========================
def camera_source_from_url(url: str):
    """Return OpenCV-compatible source from a URL/index string."""
    if isinstance(url, str):
        stripped = url.strip()
        if stripped.isdigit():
            try:
                return int(stripped)
            except ValueError:
                pass
        return stripped
    return url


def configure_camera_capture(cap: cv2.VideoCapture):
    """Apply consistent tuning to an opened VideoCapture."""
    if cap is None:
        return
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FPS, 15)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    try:
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))
    except Exception:
        pass


def try_open_camera(source, backends=None, log_attempts=True):
    """Attempt to open a camera source using a list of backends."""
    backends = backends or BACKENDS_TO_TRY
    for backend in backends:
        cap = None
        try:
            if log_attempts:
                print(f"🔄 Trying backend: {backend}")
            cap = cv2.VideoCapture(source, backend)
            if cap.isOpened():
                if log_attempts:
                    print(f"✅ Camera opened successfully with backend: {backend}")
                return cap, backend
            cap.release()
        except Exception as e:
            if log_attempts:
                print(f"❌ Backend {backend} failed: {e}")
            try:
                if cap is not None:
                    cap.release()
            except Exception:
                pass
    return None, None


def reset_tracking_state():
    """Reset in-flight tracking buffers while keeping counts."""
    global track_state, objects, tracker_to_object, next_object_id
    track_state.clear()
    objects.clear()
    tracker_to_object.clear()
    next_object_id = 1
    try:
        tracker.reset()
    except AttributeError:
        pass


def reconnect_camera(reason: str, *, log_attempts=True) -> bool:
    """Release and reopen the active camera."""
    global camera, camera_backend
    if not camera_url:
        print(f"❌ Cannot reconnect camera ({reason}) - camera_url empty")
        return False
    source = camera_source_from_url(camera_url)
    preferred_backends = []
    if camera_backend is not None:
        preferred_backends.append(camera_backend)
    preferred_backends.extend([b for b in BACKENDS_TO_TRY if b not in preferred_backends])
    print(f"♻️ Attempting camera reconnect ({reason})")
    if camera is not None:
        try:
            camera.release()
        except Exception:
            pass
        camera = None
    cap, backend = try_open_camera(source, backends=preferred_backends, log_attempts=log_attempts)
    if cap is None:
        print("🛑 Camera reconnection failed")
        return False
    camera = cap
    camera_backend = backend
    configure_camera_capture(camera)
    reset_tracking_state()
    print(f"✅ Camera reconnected with backend: {backend}")
    return True


def color_for_oid(oid: int) -> tuple:
    """Deterministic BGR color for stable object visualization."""
    base = int(oid) if isinstance(oid, int) else hash(oid)
    return (
        50 + (base * 67) % 205,
        50 + (base * 137) % 205,
        50 + (base * 97) % 205,
    )


def handle_camera_error(reason: str, error=None):
    """Log a camera error and trigger recovery."""
    global detection_enabled
    if error is not None:
        print(f"❌ Camera error during {reason}: {error}")
    else:
        print(f"❌ Camera error during {reason}")
    if not reconnect_camera(reason):
        detection_enabled = False
        print("🛑 Detection stopped - unable to recover camera")


# ========================= DETECTION SYSTEM INITIALIZATION =========================
def initialize_detection_system():
    """Initialize detection system with CPU-only processing"""
    global device, yolo, tracker, embedder, prototypes
    
    # Force CPU usage for better compatibility and stability
    device = torch.device("cpu")
    print(f"🧠 Using device: {device} (CPU-only mode for stability)")
    
    # YOLO-World (EXACT from test)
    print("🚀 Loading YOLO-World...")
    yolo = YOLOWorld(YOLOWORLD_WEIGHTS)
    yolo.set_classes(YOLO_PROMPTS)
    
    # Tracker (EXACT from test)
    tracker = sv.ByteTrack(
        track_activation_threshold=0.30,
        lost_track_buffer=60,
        minimum_matching_threshold=0.50,
        frame_rate=30,
    )
    
    # MobileNet embedder & prototypes (EXACT from test)
    print("🍳 Loading MobileNetV3-Large & building prototypes...")
    embedder = MobileNetEmbedder(device)
    
    # Build initial prototypes
    rebuild_prototypes()
    
    print("✅ Detection system initialized!")


def reset_detection_state():
    """Reset all detection state for fresh start (EXACT from test)"""
    global track_state, counts, objects, tracker_to_object, next_object_id
    
    track_state.clear()
    objects.clear()
    tracker_to_object.clear()
    next_object_id = 1
    
    # Reset counts to zero but keep all menu items
    menu_refs = get_menu_refs()
    counts.clear()
    for name in menu_refs.keys():
        counts[name] = 0
    
    print("🔄 Detection state reset")


# ========================= MAIN PROCESSING LOOP =========================
def detection_processing_loop():
    """Optimized detection loop with frame synchronization and schedule checking"""
    global detection_enabled, camera, annotated_frame, track_state, counts, objects, tracker_to_object, next_object_id
    
    frame_idx = 0
    last_time = time.time()
    last_schedule_check = time.time()
    frame_skip_counter = 0
    target_fps = 10  # Process at 10 FPS to reduce load
    frame_interval = 1.0 / target_fps
    schedule_check_interval = 60  # Check schedule every 60 seconds
    
    while True:
        try:
            # Periodic schedule check (every 60 seconds)
            current_time = time.time()
            if current_time - last_schedule_check >= schedule_check_interval:
                last_schedule_check = current_time
                if not is_detection_allowed():
                    if detection_enabled:
                        print("⏰ Outside scheduled hours - pausing detection")
                        detection_enabled = False
                else:
                    if not detection_enabled and camera and camera.isOpened():
                        print("⏰ Within scheduled hours - resuming detection")
                        detection_enabled = True
            
            if not detection_enabled:
                time.sleep(0.1)
                continue
            
            if camera is None or not camera.isOpened():
                if reconnect_camera("camera unavailable in processing loop", log_attempts=False):
                    time.sleep(0.05)
                    continue
                time.sleep(0.5)
                continue
            
            try:
                for _ in range(3):  # Clear up to 3 buffered frames
                    ret = camera.grab()
                    if not ret:
                        break
            except cv2.error as e:
                handle_camera_error("camera.grab()", e)
                time.sleep(0.2)
                continue
            
            try:
                ok, frame = camera.retrieve()
            except cv2.error as e:
                handle_camera_error("camera.retrieve()", e)
                time.sleep(0.2)
                continue
            
            if not ok or frame is None:
                handle_camera_error("camera.retrieve()", "empty frame")
                time.sleep(0.2)
                continue
            
            # Frame rate control - only process every nth frame
            current_time = time.time()
            if current_time - last_time < frame_interval:
                time.sleep(0.01)  # Small sleep to prevent CPU spinning
                continue
            
            last_time = current_time
            
            frame_disp = letterbox_resize(frame, DISPLAY_WIDTH)
            
            # YOLO-World inference (EXACT from test)
            yolo_res = yolo.predict(source=frame_disp, conf=YOLO_CONF, iou=YOLO_IOU, imgsz=YOLO_IMGSZ, verbose=False)[0]
            dets = yolo_res.boxes
            
            xyxy = dets.xyxy.cpu().numpy() if dets is not None and dets.xyxy is not None else np.empty((0, 4))
            confs = dets.conf.cpu().numpy() if dets is not None and dets.conf is not None else np.empty((0,))
            clss = dets.cls.cpu().numpy() if dets is not None and dets.cls is not None else np.empty((0,))
            
            # Filter low-confidence boxes to reduce id jitter (EXACT from test)
            if confs.size:
                keep = confs >= YOLO_CONF
                xyxy = xyxy[keep]
                confs = confs[keep]
                clss = clss[keep]
            
            # supervision palettes index by class_id → must be integer dtype (EXACT from test)
            class_ids_int = clss.astype(int) if clss.size else clss
            detections = sv.Detections(xyxy=xyxy, confidence=confs, class_id=class_ids_int)
            
            tracked = tracker.update_with_detections(detections)
            
            # GC stale objects (EXACT from test)
            stale_oids = [oid for oid, obj in list(objects.items()) if frame_idx - obj.get("last_seen", frame_idx) > OBJECT_TTL_FRAMES]
            for oid in stale_oids:
                del objects[oid]
                # remove any tracker mappings to this object
                tracker_to_object = {tid: o for tid, o in tracker_to_object.items() if o != oid}
            
            annotations = []
            pending_saves = []
            for i, xyxy_box in enumerate(tracked.xyxy):
                track_id = int(tracked.tracker_id[i]) if tracked.tracker_id is not None else -1
                crop = crop_with_bbox(frame_disp, xyxy_box)
                if crop is None:
                    continue
                box_scale = compute_box_scale(xyxy_box, frame_disp.shape)
                class_id = None
                if hasattr(tracked, "class_id") and tracked.class_id is not None:
                    try:
                        class_id = int(tracked.class_id[i])
                    except (TypeError, ValueError, IndexError):
                        class_id = None
                prompt_name = None
                if class_id is not None and 0 <= class_id < len(YOLO_PROMPTS):
                    prompt_name = YOLO_PROMPTS[class_id]
                
                state = track_state.get(track_id, {"locked": False, "label": "UNKNOWN", "sim": 0.0})
                
                # If this tracker is already associated to an object, reuse its label (skip embedding) (EXACT from test)
                associated_oid = tracker_to_object.get(track_id, None)
                if associated_oid is not None and associated_oid in objects:
                    label = objects[associated_oid]["label"]
                    sim = state.get("sim", 1.0)
                    margin = 1.0
                    objects[associated_oid]["box_scale"] = box_scale
                else:
                    emb = embedder.embed(crop)
                    label, sim, margin = match_to_menu(emb, prototypes, box_scale=box_scale)
                
                # Temporal lock (EXACT from test)
                history = state.get("hist", deque(maxlen=3))
                history.append(label)
                state["hist"] = history
                state["box_scale"] = box_scale
                
                if not state.get("locked", False):
                    if len(history) >= LOCK_CONSEC_FRAMES and all(h == label and label != "UNKNOWN" for h in list(history)[-LOCK_CONSEC_FRAMES:]):
                        target_oid = None
                        best_iou = 0.0
                        for oid, obj in objects.items():
                            if obj["label"] != label:
                                continue
                            iou = bbox_iou(xyxy_box, obj["bbox"])
                            if iou > best_iou:
                                best_iou = iou
                                target_oid = oid

                        if target_oid is not None and best_iou >= IOU_ASSOC_THRESH:
                            tracker_to_object[track_id] = target_oid
                        else:
                            target_oid = next_object_id
                            next_object_id += 1
                            tracker_to_object[track_id] = target_oid
                            if label in counts:
                                counts[label] += 1
                                try:
                                    print(f"✅ Count incremented: {label} -> {counts[label]} (oid {target_oid}, sim {sim:.2f}, scale {box_scale if box_scale else 0:.4f})")
                                except Exception:
                                    pass
                            pending_saves.append({"label": label, "oid": target_oid, "sim": sim})

                        objects[target_oid] = {
                            "label": label,
                            "bbox": np.array(xyxy_box),
                            "last_seen": frame_idx,
                            "sim": sim,
                            "box_scale": box_scale,
                        }

                        state["locked"] = True
                        state["label"] = label
                        state["sim"] = sim
                    else:
                        state["label"] = label
                        state["sim"] = sim
                else:
                    oid = tracker_to_object.get(track_id)
                    if oid is not None and oid in objects:
                        obj_ref = objects[oid]
                        obj_ref["bbox"] = np.array(xyxy_box)
                        obj_ref["last_seen"] = frame_idx
                        obj_ref["label"] = state.get("label", label)
                        obj_ref["sim"] = state.get("sim", sim)
                        if box_scale is not None:
                            obj_ref["box_scale"] = box_scale
                    else:
                        # Lost association; require relock
                        state["locked"] = False
                
                track_state[track_id] = state
                ann_color = (255, 0, 255)
                ann_text = prompt_name or "UNKNOWN"
                ann_bbox = np.array(xyxy_box)
                if state.get("locked") and state.get("label") in counts:
                    oid = tracker_to_object.get(track_id)
                    if oid is not None and oid in objects:
                        obj = objects[oid]
                        ann_bbox = obj.get("bbox", ann_bbox)
                        ann_text = f"{obj.get('label', 'Item')} #{oid} {obj.get('sim', 0):.2f}"
                        ann_color = (0, 255, 0)
                else:
                    if prompt_name:
                        ann_text = f"{prompt_name} {sim:.2f}"
                    else:
                        ann_text = f"UNKNOWN {sim:.2f}"
                annotations.append({
                    "bbox": ann_bbox,
                    "text": ann_text,
                    "color": ann_color,
                })
            
            for save_item in pending_saves:
                oid = save_item.get("oid")
                obj = objects.get(oid)
                if not obj:
                    continue
                save_detection_artifacts(frame_disp, obj.get("label"), oid, obj.get("bbox"), save_item.get("sim", 0.0))

            # Draw annotations (matched items in green, others in magenta)
            h, w = frame_disp.shape[:2]
            for ann in annotations:
                bbox_arr = ann.get("bbox")
                if bbox_arr is None or getattr(bbox_arr, "size", 0) != 4:
                    continue
                x1, y1, x2, y2 = [int(v) for v in bbox_arr]
                x1 = max(0, min(w - 1, x1))
                x2 = max(0, min(w - 1, x2))
                y1 = max(0, min(h - 1, y1))
                y2 = max(0, min(h - 1, y2))
                if x2 <= x1 or y2 <= y1:
                    continue
                color = ann.get("color", (255, 0, 255))
                cv2.rectangle(frame_disp, (x1, y1), (x2, y2), color, 2)
                label_txt = ann.get("text", "")
                if label_txt:
                    cv2.putText(
                        frame_disp,
                        label_txt,
                        (x1, max(0, y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        color,
                        2,
                        cv2.LINE_AA,
                    )

            # HUD counts (EXACT from test)
            y0 = 24
            for name, count in counts.items():
                txt = f"{name}: {count}"
                cv2.putText(frame_disp, txt, (10, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (50, 220, 50), 2, cv2.LINE_AA)
                y0 += 26
            
            # FPS display (EXACT from test)
            now = time.time()
            fps = 1.0 / max(1e-3, (now - last_time))
            last_time = now
            cv2.putText(frame_disp, f"FPS: {fps:.1f}", (frame_disp.shape[1]-140, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2, cv2.LINE_AA)
            
            # Store annotated frame for web streaming
            annotated_frame = frame_disp
            
            # Emit counts to frontend
            try:
                socketio.emit('counts_update', {
                    'counts': dict(counts),
                    'timestamp': datetime.now().isoformat()
                }, broadcast=True)
            except Exception:
                pass
            
            frame_idx += 1
            
        except Exception as e:
            print(f"❌ Error in processing loop: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(0.1)


# ========================= FLASK ROUTES =========================
@app.route('/')
def index():
    """Serve React frontend"""
    response = send_from_directory('../frontend/dist', 'index.html')
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (images, uploads, etc.)"""
    return send_from_directory('static', filename)


@app.route('/<path:path>')
def serve_react(path):
    """Serve React frontend routes (catch-all for React Router)"""
    # Check if it's an API route
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Check if it's a static file (shouldn't reach here, but just in case)
    if path.startswith('static/'):
        return send_from_directory('.', path)
    
    # Check if file exists in dist folder
    file_path = os.path.join('../frontend/dist', path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        response = send_from_directory('../frontend/dist', path)
        # Add no-cache headers for HTML files
        if path.endswith('.html'):
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response
    
    # For all other routes, serve index.html (React Router handles it)
    response = send_from_directory('../frontend/dist', 'index.html')
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/api/menu_items', methods=['GET'])
def get_menu_items():
    """Get all menu items"""
    items = load_menu_items()
    return jsonify({'success': True, 'items': items})


@app.route('/api/cameras', methods=['GET'])
@auth_required
def get_cameras():
    """Get all cameras (admin sees all, users see only their cameras)"""
    try:
        if current_user.is_admin():
            # Admin can see all cameras
            cameras = Camera.query.all()
        else:
            # Regular users see only their cameras
            cameras = Camera.query.filter_by(user_id=current_user.id).all()
        
        return jsonify({
            'success': True,
            'cameras': [camera.to_dict() for camera in cameras]
        }), 200
    except Exception as e:
        print(f"Error fetching cameras: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/video_feed')
def video_feed():
    """Stream RAW camera frames without detection overlays"""
    def generate_raw_frames():
        raw_camera = None
        last_frame = None
        
        while True:
            try:
                # Initialize raw camera if needed
                if raw_camera is None and camera_url and camera_url != "":
                    try:
                        camera_source = camera_source_from_url(camera_url)
                        preferred_backends = []
                        if camera_backend is not None:
                            preferred_backends.append(camera_backend)
                        preferred_backends.extend([b for b in BACKENDS_TO_TRY if b not in preferred_backends])
                        for backend in preferred_backends:
                            try:
                                raw_camera = cv2.VideoCapture(camera_source, backend)
                                if raw_camera.isOpened():
                                    raw_camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                                    raw_camera.set(cv2.CAP_PROP_FPS, 20)
                                    print(f"📹 Raw camera stream initialized: {camera_url} (backend: {backend})")
                                    break
                                else:
                                    raw_camera.release()
                                    raw_camera = None
                            except Exception as e:
                                print(f"Raw camera backend {backend} failed: {e}")
                                if raw_camera:
                                    raw_camera.release()
                                    raw_camera = None
                        
                        if raw_camera is None:
                            print(f"❌ Failed to initialize raw camera: {camera_url}")
                            
                    except Exception as e:
                        print(f"Raw camera init error: {e}")
                        raw_camera = None
                
                # Get raw frame
                if raw_camera and raw_camera.isOpened():
                    # Clear buffer for latest frame
                    for _ in range(2):
                        ret = raw_camera.grab()
                        if not ret:
                            break
                    
                    ret, frame = raw_camera.retrieve()
                    if ret and frame is not None:
                        last_frame = frame.copy()
                    else:
                        # Camera disconnected, try to reconnect
                        if raw_camera:
                            raw_camera.release()
                            raw_camera = None
                        time.sleep(0.1)
                        continue
                else:
                    # Create placeholder frame
                    if last_frame is None:
                        last_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                        cv2.putText(last_frame, 'Waiting for camera...', (50, 240), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                
                # Encode and stream frame
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, 90]
                ret, buffer = cv2.imencode('.jpg', last_frame, encode_params)
                
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                # 20 FPS for smooth raw streaming
                time.sleep(0.05)
                
            except Exception as e:
                print(f"Raw video feed error: {e}")
                if raw_camera:
                    raw_camera.release()
                    raw_camera = None
                time.sleep(0.1)
    
    return Response(generate_raw_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/video_feed_processed')
def video_feed_processed():
    """Stream annotated frames with detection overlays (for debugging)"""
    def generate():
        last_frame = None
        
        while True:
            try:
                if annotated_frame is not None:
                    current_frame = annotated_frame.copy()
                    if last_frame is None or not np.array_equal(current_frame, last_frame):
                        last_frame = current_frame
                else:
                    if last_frame is None:
                        last_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                        cv2.putText(last_frame, 'Processing...', (50, 240), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, 85]
                ret, buffer = cv2.imencode('.jpg', last_frame, encode_params)
                
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                time.sleep(0.067)  # ~15 FPS
                
            except Exception as e:
                print(f"Processed video feed error: {e}")
                time.sleep(0.1)
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/counts', methods=['GET'])
def get_counts():
    """Get current counts"""
    return jsonify({
        'counts': dict(counts),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/counts_sse')
def counts_sse():
    """Server-Sent Events for live count updates"""
    def generate():
        last_counts = {}
        while True:
            current = dict(counts)
            if current != last_counts:
                data = json.dumps({
                    'counts': current,
                    'timestamp': datetime.now().isoformat()
                })
                yield f"data: {data}\n\n"
                last_counts = current.copy()
            time.sleep(0.5)
    
    return Response(generate(), mimetype='text/event-stream')


@app.route('/api/reset_counts', methods=['POST'])
def reset_counts():
    """Reset all counts"""
    reset_detection_state()
    
    try:
        socketio.emit('counts_update', {
            'counts': dict(counts),
            'timestamp': datetime.now().isoformat()
        }, broadcast=True)
    except Exception:
        pass
    
    return jsonify({'success': True, 'message': 'Counts reset successfully'})


@app.route('/api/start_detection', methods=['POST'])
def start_detection():
    """Start detection with camera URL"""
    global detection_enabled, camera, camera_url, processing_thread, camera_backend
    
    try:
        data = request.get_json()
        camera_url = data.get('camera_url', '')
        
        if not camera_url:
            return jsonify({'error': 'Camera URL is required'}), 400
        
        # Initialize camera
        if camera is not None:
            camera.release()
        
        camera_source = camera_source_from_url(camera_url)
        if isinstance(camera_source, int):
            print(f"🎥 Using webcam index: {camera_source}")
        else:
            print(f"🎥 Using camera URL: {camera_source}")
        
        cap, backend = try_open_camera(camera_source, log_attempts=True)
        if cap is None:
            return jsonify({'error': f'Failed to open camera: {camera_url}. Please check the URL and ensure the camera is accessible.'}), 500
        
        camera = cap
        camera_backend = backend
        configure_camera_capture(camera)
        reset_tracking_state()
        
        detection_enabled = True
        
        # Start processing thread if not already running
        if processing_thread is None or not processing_thread.is_alive():
            processing_thread = threading.Thread(target=detection_processing_loop, daemon=True)
            processing_thread.start()
        
        print(f"🎥 Detection started with camera: {camera_url}")
        return jsonify({'success': True, 'message': f'Detection started with camera: {camera_url}'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stop_detection', methods=['POST'])
def stop_detection():
    """Stop detection"""
    global detection_enabled, camera, camera_backend
    
    try:
        detection_enabled = False
        
        if camera is not None:
            camera.release()
            camera = None
        camera_backend = None
        reset_tracking_state()
        
        print("🛑 Detection stopped")
        return jsonify({'success': True, 'message': 'Detection stopped'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/add_menu_item', methods=['POST'])
@auth_required
def add_menu_item():
    """Add new menu item"""
    try:
        name = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        
        if not name:
            return jsonify({'error': 'Menu item name is required'}), 400
        
        # Handle file upload
        file = None
        for field_name in ['reference_images', 'file', 'image', 'images']:
            if field_name in request.files:
                file = request.files[field_name]
                break
        
        if file is None or file.filename == '':
            return jsonify({'error': 'Reference image is required'}), 400
        
        # Save file
        timestamp = str(int(time.time() * 1000))
        upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], timestamp)
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = secure_filename(file.filename)
        safe_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(upload_dir, safe_filename)
        file.save(file_path)
        
        relative_path = f"{timestamp}/{safe_filename}"
        
        # Save to database
        menu_item = MenuItem(
            user_id=current_user.id,
            name=name,
            image_path=relative_path
        )
        db.session.add(menu_item)
        db.session.commit()
        
        # Also save to JSON for backward compatibility
        items = load_menu_items()
        new_item = {
            'id': menu_item.id,
            'name': name,
            'description': description,
            'reference_images': [relative_path],
            'created_at': datetime.now().isoformat()
        }
        items.append(new_item)
        save_menu_items(items)
        
        # Rebuild prototypes
        rebuild_prototypes()
        
        return jsonify({
            'success': True,
            'message': f'Menu item "{name}" added successfully',
            'item': menu_item.to_dict()
        })
            
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error adding menu item: {e}")
        return jsonify({'error': f'Failed to add menu item: {str(e)}'}), 500


@app.route('/api/delete_menu_item/<int:item_id>', methods=['POST'])
@auth_required
def delete_menu_item(item_id):
    """Delete menu item"""
    try:
        # Delete from database
        menu_item = MenuItem.query.filter_by(id=item_id, user_id=current_user.id).first()
        
        if not menu_item:
            return jsonify({'error': f'Menu item with ID {item_id} not found'}), 404
        
        item_name = menu_item.name
        db.session.delete(menu_item)
        db.session.commit()
        
        # Also remove from JSON for backward compatibility
        items = load_menu_items()
        item_to_delete = None
        for i, item in enumerate(items):
            if item.get('id') == item_id:
                item_to_delete = items.pop(i)
                break
        
        if item_to_delete:
            save_menu_items(items)
        
        # Rebuild prototypes
        rebuild_prototypes()
        
        return jsonify({
            'success': True,
            'message': f'Menu item "{item_name}" deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting menu item: {e}")
        return jsonify({'error': f'Failed to delete menu item: {str(e)}'}), 500


@app.route('/api/status')
def get_status():
    """Get system status"""
    return jsonify({
        'success': True,
        'detection_enabled': detection_enabled,
        'camera_url': camera_url if camera_url else None,
        'camera_connected': camera is not None and camera.isOpened() if camera else False
    })


def is_detection_allowed(user_id=None):
    """Check if detection is allowed based on schedule settings"""
    try:
        if user_id is None:
            # If no user_id provided, check for shrikrishna user (user_id=2)
            # In production, this should be passed properly
            user_id = 2
        
        # Get schedule settings from database
        with app.app_context():
            schedule = ScheduleSetting.query.filter_by(user_id=user_id).first()
            
            # If no schedule or schedule is disabled, allow 24/7
            if not schedule or not schedule.enabled:
                return True
            
            # Check if current time is within schedule
            return schedule.is_active_now()
            
    except Exception as e:
        print(f"Schedule check error: {e}")
        return True  # Default to allowing detection on error


def auto_start_detection():
    """Automatically start detection on server startup"""
    global detection_enabled, camera, processing_thread, camera_backend
    
    print("\n🎥 AUTO-STARTING DETECTION SYSTEM...")
    
    # Check schedule before starting
    if not is_detection_allowed():
        print("⏰ Detection is outside scheduled hours")
        print("⚠️  Detection will start automatically during scheduled hours")
        return
    
    try:
        # Get camera URL from environment or use default
        default_url = os.environ.get('DEFAULT_CAMERA_URL', 'rtsp://100.106.21.91:8554/Dispatch')
        
        camera_source = camera_source_from_url(default_url)
        if isinstance(camera_source, int):
            print(f"🎥 Using webcam index: {camera_source}")
        else:
            print(f"🎥 Using camera URL: {camera_source}")
        
        cap, backend = try_open_camera(camera_source, log_attempts=True)
        if cap is None:
            print(f"⚠️  Failed to open camera: {default_url}")
            print("⚠️  Detection will remain disabled until camera is available")
            return
        
        camera = cap
        camera_backend = backend
        configure_camera_capture(camera)
        reset_tracking_state()
        
        detection_enabled = True
        
        # Start processing thread
        processing_thread = threading.Thread(target=detection_processing_loop, daemon=True)
        processing_thread.start()
        
        print(f"✅ Detection auto-started with camera: {default_url}")
        
    except Exception as e:
        print(f"⚠️  Failed to auto-start detection: {e}")
        print("⚠️  Detection will remain disabled")


if __name__ == '__main__':
    print("\n🚀 INITIALIZING SERVE TRACK SYSTEM...")
    print("=" * 60)
    
    # Initialize detection system
    initialize_detection_system()
    
    # Auto-start detection
    auto_start_detection()
    
    print("=" * 60)
    print("🌐 Starting Flask Server...")
    
    # Run with SocketIO
    socketio.run(app, host='0.0.0.0', port=8000, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
