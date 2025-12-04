import cv2
import numpy as np
from collections import deque
import time

class MotionDetector:
    """
    Enhanced motion detection for identifying moving food items
    Fixed at 1 frame per second processing for efficiency [[memory:4734245]]
    """
    
    def __init__(self, history_length=30, motion_threshold=25):
        self.background_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500, varThreshold=50, detectShadows=True
        )
        self.history_length = history_length
        self.motion_threshold = motion_threshold
        self.frame_history = deque(maxlen=history_length)
        self.last_process_time = 0
        self.process_interval = 1.0  # Fixed at 1 second intervals
        
    def detect_motion_areas(self, frame):
        """
        Detect areas with motion in the frame
        Process at exactly 1 FPS regardless of input frame rate
        """
        current_time = time.time()
        
        # Skip processing if not enough time has passed (1 second interval)
        if current_time - self.last_process_time < self.process_interval:
            return []
        
        self.last_process_time = current_time
        
        # Convert to grayscale for processing
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply background subtraction
        fg_mask = self.background_subtractor.apply(blurred)
        
        # Morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
        
        # Find contours of moving objects
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        motion_areas = []
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Filter out small noise and very large areas
            if 500 < area < 50000:  # Adjust based on expected food item sizes
                x, y, w, h = cv2.boundingRect(contour)
                
                # Filter based on aspect ratio (food items are usually not too elongated)
                aspect_ratio = w / h
                if 0.3 < aspect_ratio < 3.0:
                    motion_areas.append({
                        'bbox': (x, y, w, h),
                        'area': area,
                        'center': (x + w//2, y + h//2)
                    })
        
        return motion_areas
    
    def is_moving_towards_counter(self, motion_area, frame_shape):
        """
        Determine if motion is moving towards the counting area
        (typically the bottom portion of the frame for overhead cameras)
        """
        _, y, _, h = motion_area['bbox']
        frame_height = frame_shape[0]
        
        # Consider items moving into the lower 60% of the frame
        counter_area_start = frame_height * 0.4
        
        return y + h > counter_area_start
    
    def get_motion_direction(self, current_center, history_length=5):
        """
        Estimate motion direction based on frame history
        """
        if len(self.frame_history) < history_length:
            return 'unknown'
        
        # Calculate movement vector from recent history
        old_positions = [pos for pos in self.frame_history[-history_length:]]
        
        if len(old_positions) < 2:
            return 'unknown'
        
        # Calculate average movement
        dx = current_center[0] - old_positions[0][0]
        dy = current_center[1] - old_positions[0][1]
        
        # Classify direction
        if abs(dx) > abs(dy):
            return 'horizontal' if abs(dx) > 10 else 'stationary'
        else:
            return 'vertical' if abs(dy) > 10 else 'stationary'
    
    def filter_food_candidates(self, motion_areas, frame):
        """
        Filter motion areas to identify likely food items
        """
        food_candidates = []
        
        for area in motion_areas:
            x, y, w, h = area['bbox']
            
            # Extract region of interest
            roi = frame[y:y+h, x:x+w]
            
            if roi.size == 0:
                continue
            
            # Basic color analysis for food-like objects
            # Food items typically have varied colors (not uniform)
            hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            
            # Calculate color variance
            color_variance = np.var(hsv_roi[:, :, 1])  # Saturation variance
            
            # Food items usually have some color variation
            if color_variance > 100:  # Threshold for color variation
                area['confidence'] = min(color_variance / 1000, 1.0)
                food_candidates.append(area)
        
        return food_candidates
    
    def update_tracking_history(self, centers):
        """
        Update the tracking history with current centers
        """
        self.frame_history.append(centers)
    
    def reset(self):
        """
        Reset the motion detector state
        """
        self.background_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500, varThreshold=50, detectShadows=True
        )
        self.frame_history.clear()
        self.last_process_time = 0
