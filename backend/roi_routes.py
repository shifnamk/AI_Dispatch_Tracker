"""
ROI (Region of Interest) Management Routes
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from db_models import db, Camera
import json

roi_bp = Blueprint('roi', __name__)


@roi_bp.route('/api/roi/<int:camera_id>', methods=['GET'])
@login_required
def get_roi(camera_id):
    """Get ROI coordinates for a camera"""
    try:
        camera = Camera.query.filter_by(id=camera_id).first()
        
        if not camera:
            return jsonify({'error': 'Camera not found'}), 404
        
        # Check if user has access to this camera (admin can access all)
        if not current_user.is_admin() and camera.user_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        roi_coordinates = None
        if camera.roi_coordinates:
            roi_coordinates = json.loads(camera.roi_coordinates)
        
        return jsonify({
            'camera_id': camera.id,
            'camera_name': camera.name,
            'roi_coordinates': roi_coordinates
        }), 200
        
    except Exception as e:
        print(f"Error getting ROI: {e}")
        return jsonify({'error': str(e)}), 500


@roi_bp.route('/api/roi/<int:camera_id>', methods=['POST'])
@login_required
def save_roi(camera_id):
    """Save ROI coordinates for a camera"""
    try:
        # Only admin users can save ROI
        if not current_user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.json
        roi_coordinates = data.get('roi_coordinates')
        
        if not roi_coordinates or not isinstance(roi_coordinates, list):
            return jsonify({'error': 'Invalid ROI coordinates'}), 400
        
        camera = Camera.query.filter_by(id=camera_id).first()
        
        if not camera:
            return jsonify({'error': 'Camera not found'}), 404
        
        # Save ROI coordinates as JSON string
        camera.roi_coordinates = json.dumps(roi_coordinates)
        db.session.commit()
        
        return jsonify({
            'message': 'ROI saved successfully',
            'camera_id': camera.id,
            'roi_coordinates': roi_coordinates
        }), 200
        
    except Exception as e:
        print(f"Error saving ROI: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@roi_bp.route('/api/roi/<int:camera_id>', methods=['DELETE'])
@login_required
def delete_roi(camera_id):
    """Delete ROI coordinates for a camera"""
    try:
        # Only admin users can delete ROI
        if not current_user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        camera = Camera.query.filter_by(id=camera_id).first()
        
        if not camera:
            return jsonify({'error': 'Camera not found'}), 404
        
        camera.roi_coordinates = None
        db.session.commit()
        
        return jsonify({
            'message': 'ROI deleted successfully',
            'camera_id': camera.id
        }), 200
        
    except Exception as e:
        print(f"Error deleting ROI: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

