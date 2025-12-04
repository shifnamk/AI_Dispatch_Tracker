#!/usr/bin/env python3
"""
Standalone real-time counter (no fallbacks):
  - Stage 1: YOLO-World → detect containers → crops
  - Stage 2: MobileNetV3-Large embeddings → match to menu prototypes
  - Tracking: ByteTrack on containers; count once when label locks

Live overlay with per-item cumulative counts.
"""

import os
import time
from collections import defaultdict, deque
from typing import Dict

import cv2
import numpy as np
import torch
from torchvision import models, transforms

from ultralytics import YOLOWorld
import supervision as sv


# ------------------------- Config -------------------------
STREAM_URL = "http://100.106.21.91:8888/Dispatch/index.m3u8"

# Menu references (hardcoded)
MENU_REFS: Dict[str, str] = {
    "milk tea": r"D:\\Serve_Track\\menu\\WhatsApp Image 2025-08-28 at 17.10.21_606b8fcd.jpg",
    "black coffee": r"D:\\Serve_Track\\menu\\WhatsApp Image 2025-08-28 at 17.10.21_0450652a.jpg",
    "pasta": r"D:\Serve_Track\menu\WhatsApp Image 2025-09-02 at 10.16.47_713bceeb.jpg",
}

# YOLO-World settings
YOLOWORLD_WEIGHTS = "yolov8l-world.pt"
YOLO_PROMPTS = [
   'food containers', 'food', 'cups', 'plates', 'bowls', 'glasses',
                'bottles', 'dishes', 'coffee cups', 'tea cups', 'dinner plates',
                'serving bowls', 'food items', 'beverages', 'drinks', 'meals'
]
YOLO_CONF = 0.35
YOLO_IOU = 0.45  # lower NMS IoU to keep adjacent cups
YOLO_IMGSZ = 640

# Matching
SIM_THRESHOLD = 0.40
SIM_MARGIN = 0.05
LOCK_CONSEC_FRAMES = 3

DISPLAY_WIDTH = 1280

# Object association
IOU_ASSOC_THRESH = 0.60
OBJECT_TTL_FRAMES = 90


# ------------------------- Utils -------------------------
def letterbox_resize(image: np.ndarray, target_width: int) -> np.ndarray:
    h, w = image.shape[:2]
    if w <= 0:
        return image
    scale = target_width / float(w)
    new_size = (target_width, int(h * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_LINEAR)


def crop_with_bbox(image: np.ndarray, xyxy: np.ndarray) -> np.ndarray:
    x1, y1, x2, y2 = [int(v) for v in xyxy]
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(image.shape[1] - 1, x2)
    y2 = min(image.shape[0] - 1, y2)
    if x2 <= x1 or y2 <= y1:
        return None
    return image[y1:y2, x1:x2].copy()


def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    a_n = torch.nn.functional.normalize(a, dim=-1)
    b_n = torch.nn.functional.normalize(b, dim=-1)
    return float(torch.sum(a_n * b_n).item())


def bbox_iou(a: np.ndarray, b: np.ndarray) -> float:
    xa1, ya1, xa2, ya2 = [float(v) for v in a]
    xb1, yb1, xb2, yb2 = [float(v) for v in b]
    inter_w = max(0.0, min(xa2, xb2) - max(xa1, xb1))
    inter_h = max(0.0, min(ya2, yb2) - max(ya1, yb1))
    inter = inter_w * inter_h
    area_a = max(0.0, (xa2 - xa1)) * max(0.0, (ya2 - ya1))
    area_b = max(0.0, (xb2 - xb1)) * max(0.0, (yb2 - yb1))
    denom = max(area_a + area_b - inter, 1e-6)
    return inter / denom


# ------------------------- Models -------------------------
class MobileNetEmbedder:
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


def build_menu_prototypes(embedder: MobileNetEmbedder) -> dict:
    prototypes = {}
    for name, path in MENU_REFS.items():
        img = cv2.imread(path)
        if img is None:
            print(f"⚠️ Could not read menu image: {path}")
            continue
        prototypes[name] = embedder.embed(img).detach()
        print(f"✅ Prototype built: {name}")
    return prototypes


def match_to_menu(embedding: torch.Tensor, prototypes: dict) -> tuple:
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
    if best_sim >= SIM_THRESHOLD and margin >= SIM_MARGIN:
        return best_name, best_sim, margin
    return "UNKNOWN", best_sim, margin


# ------------------------- Main -------------------------
def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Ensure fresh start: remove any accidental persisted state files from prior experiments
    for fname in ["counts.json", "counts_state.json", "detection_history.json", "state.json"]:
        try:
            if os.path.exists(fname):
                os.remove(fname)
        except Exception:
            pass

    # YOLO-World
    print("🚀 Loading YOLO-World...")
    yolo = YOLOWorld(YOLOWORLD_WEIGHTS)
    yolo.set_classes(YOLO_PROMPTS)

    # Tracker
    tracker = sv.ByteTrack(
        track_activation_threshold=0.30,
        lost_track_buffer=60,
        minimum_matching_threshold=0.50,
        frame_rate=30,
    )

    # MobileNet embedder & prototypes
    print("🍳 Loading MobileNetV3-Large & building prototypes...")
    embedder = MobileNetEmbedder(device)
    prototypes = build_menu_prototypes(embedder)

    track_state = {}
    counts = defaultdict(int)
    # Initialize displayed items to zero so UI always starts from 0
    for name in MENU_REFS.keys():
        counts[name] = 0

    # Object registry decoupled from tracker_id
    # object_id -> {"label": str, "bbox": np.ndarray, "last_seen": int}
    objects = {}
    tracker_to_object = {}
    next_object_id = 1

    cap = cv2.VideoCapture(STREAM_URL)
    if not cap.isOpened():
        print(f"❌ Cannot open stream: {STREAM_URL}")
        return

    cv2.namedWindow("YOLOWorld+MobileNet", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("YOLOWorld+MobileNet", 1280, 720)

    frame_idx = 0
    last_time = time.time()
    while True:
        ok, frame = cap.read()
        if not ok:
            time.sleep(0.05)
            continue

        frame_disp = letterbox_resize(frame, DISPLAY_WIDTH)

        # YOLO-World inference
        yolo_res = yolo.predict(source=frame_disp, conf=YOLO_CONF, iou=YOLO_IOU, imgsz=YOLO_IMGSZ, verbose=False)[0]
        dets = yolo_res.boxes

        xyxy = dets.xyxy.cpu().numpy() if dets is not None and dets.xyxy is not None else np.empty((0, 4))
        confs = dets.conf.cpu().numpy() if dets is not None and dets.conf is not None else np.empty((0,))
        clss = dets.cls.cpu().numpy() if dets is not None and dets.cls is not None else np.empty((0,))
        # Filter low-confidence boxes to reduce id jitter
        if confs.size:
            keep = confs >= YOLO_CONF
            xyxy = xyxy[keep]
            confs = confs[keep]
            clss = clss[keep]
        # supervision palettes index by class_id → must be integer dtype
        class_ids_int = clss.astype(int) if clss.size else clss
        detections = sv.Detections(xyxy=xyxy, confidence=confs, class_id=class_ids_int)

        tracked = tracker.update_with_detections(detections)

        # GC stale objects
        stale_oids = [oid for oid, obj in list(objects.items()) if frame_idx - obj.get("last_seen", frame_idx) > OBJECT_TTL_FRAMES]
        for oid in stale_oids:
            del objects[oid]
            # remove any tracker mappings to this object
            tracker_to_object = {tid: o for tid, o in tracker_to_object.items() if o != oid}

        labels_for_draw = []
        for i, xyxy_box in enumerate(tracked.xyxy):
            track_id = int(tracked.tracker_id[i]) if tracked.tracker_id is not None else -1
            crop = crop_with_bbox(frame_disp, xyxy_box)
            if crop is None:
                continue

            state = track_state.get(track_id, {"locked": False, "label": "UNKNOWN", "sim": 0.0})

            # If this tracker is already associated to an object, reuse its label (skip embedding)
            associated_oid = tracker_to_object.get(track_id, None)
            if associated_oid is not None and associated_oid in objects:
                label = objects[associated_oid]["label"]
                sim = state.get("sim", 1.0)
                margin = 1.0
            else:
                emb = embedder.embed(crop)
                label, sim, margin = match_to_menu(emb, prototypes)

            # Temporal lock
            history = state.get("hist", deque(maxlen=3))
            history.append(label)
            state["hist"] = history
            if not state.get("locked", False):
                # Require at least three consecutive frame agreements before lock
                if len(history) >= LOCK_CONSEC_FRAMES and all(h == label and label != "UNKNOWN" for h in list(history)[-LOCK_CONSEC_FRAMES:]):
                    # Try to associate with an existing object of same label by IoU
                    best_oid, best_iou = None, 0.0
                    for oid, obj in objects.items():
                        if obj["label"] != label:
                            continue
                        iou = bbox_iou(xyxy_box, obj["bbox"])
                        if iou > best_iou:
                            best_iou = iou
                            best_oid = oid

                    if best_oid is not None and best_iou >= IOU_ASSOC_THRESH:
                        # Re-associate to existing object (no recount)
                        tracker_to_object[track_id] = best_oid
                        objects[best_oid]["bbox"] = np.array(xyxy_box)
                        objects[best_oid]["last_seen"] = frame_idx
                        state["locked"] = True
                        state["label"] = label
                        state["sim"] = sim
                    else:
                        # Create new object and count once
                        nonlocal_vars = locals()
                        # assign new object id
                        oid_new = next_object_id
                        next_object_id += 1
                        objects[oid_new] = {"label": label, "bbox": np.array(xyxy_box), "last_seen": frame_idx}
                        tracker_to_object[track_id] = oid_new
                        counts[label] += 1
                        state["locked"] = True
                        state["label"] = label
                        state["sim"] = sim
                else:
                    state["label"] = label
                    state["sim"] = sim
            else:
                # Maintain association/update object state
                oid = tracker_to_object.get(track_id, None)
                if oid is not None and oid in objects and objects[oid]["label"] == state.get("label", label):
                    # Update object bbox and last seen if IoU is reasonable
                    iou_current = bbox_iou(xyxy_box, objects[oid]["bbox"])
                    if iou_current >= IOU_ASSOC_THRESH:
                        objects[oid]["bbox"] = np.array(xyxy_box)
                        objects[oid]["last_seen"] = frame_idx
                    else:
                        # Try to find a better matching object of the same label
                        best_oid, best_iou = None, 0.0
                        for cand_oid, obj in objects.items():
                            if obj["label"] != state.get("label", label):
                                continue
                            iou = bbox_iou(xyxy_box, obj["bbox"])
                            if iou > best_iou:
                                best_iou = iou
                                best_oid = cand_oid
                        if best_oid is not None and best_iou >= IOU_ASSOC_THRESH:
                            tracker_to_object[track_id] = best_oid
                            objects[best_oid]["bbox"] = np.array(xyxy_box)
                            objects[best_oid]["last_seen"] = frame_idx
                        else:
                            # No good association; keep current mapping but update label/sim only
                            pass
                else:
                    # Not mapped yet; try to associate by IoU to an existing object of the same label
                    best_oid, best_iou = None, 0.0
                    for cand_oid, obj in objects.items():
                        if obj["label"] != state.get("label", label):
                            continue
                        iou = bbox_iou(xyxy_box, obj["bbox"])
                        if iou > best_iou:
                            best_iou = iou
                            best_oid = cand_oid
                    if best_oid is not None and best_iou >= IOU_ASSOC_THRESH:
                        tracker_to_object[track_id] = best_oid
                        objects[best_oid]["bbox"] = np.array(xyxy_box)
                        objects[best_oid]["last_seen"] = frame_idx

            track_state[track_id] = state
            # Prepare overlay label using stable object_id when available
            oid_for_draw = tracker_to_object.get(track_id, None)
            if oid_for_draw is not None:
                labels_for_draw.append(f"OID {oid_for_draw} | {state.get('label','UNKNOWN')} {state.get('sim',0):.2f}")
            else:
                labels_for_draw.append(f"ID {track_id} | {state.get('label','UNKNOWN')} {state.get('sim',0):.2f}")

        # Draw boxes
        box_annotator = sv.BoxAnnotator(thickness=2)
        frame_disp = box_annotator.annotate(scene=frame_disp, detections=tracked)

        # Draw labels manually for compatibility with older supervision versions
        for i, xyxy_box in enumerate(tracked.xyxy):
            x1, y1, x2, y2 = [int(v) for v in xyxy_box]
            label_txt = labels_for_draw[i] if i < len(labels_for_draw) else ""
            if label_txt:
                cv2.putText(
                    frame_disp,
                    label_txt,
                    (x1, max(0, y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2,
                    cv2.LINE_AA,
                )

        # HUD counts
        y0 = 24
        for name in ["milk tea", "black coffee"]:
            txt = f"{name}: {counts.get(name, 0)}"
            cv2.putText(frame_disp, txt, (10, y0), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (50, 220, 50), 2, cv2.LINE_AA)
            y0 += 26

        now = time.time()
        fps = 1.0 / max(1e-3, (now - last_time))
        last_time = now
        cv2.putText(frame_disp, f"FPS: {fps:.1f}", (frame_disp.shape[1]-140, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2, cv2.LINE_AA)

        cv2.imshow("YOLOWorld+MobileNet", frame_disp)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

        frame_idx += 1

    cap.release()
    try:
        cv2.destroyAllWindows()
    except Exception:
        pass


if __name__ == "__main__":
    main()


