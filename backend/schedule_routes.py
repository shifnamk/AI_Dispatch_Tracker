"""
Schedule Settings Routes for ServeTrack
Handles detection scheduling and operating hours
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from db_models import db, ScheduleSetting
from datetime import datetime, time

schedule_bp = Blueprint('schedule', __name__)


@schedule_bp.route('/api/schedule', methods=['GET'])
@login_required
def get_schedule():
    """Get schedule settings for current user"""
    schedule = ScheduleSetting.query.filter_by(user_id=current_user.id).first()
    
    if not schedule:
        # Return default schedule (24/7)
        return jsonify({
            'schedule': {
                'id': None,
                'start_time': '00:00',
                'end_time': '23:59',
                'enabled': False,
                'days_of_week': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            }
        }), 200
    
    return jsonify({'schedule': schedule.to_dict()}), 200


@schedule_bp.route('/api/schedule', methods=['POST'])
@login_required
def save_schedule():
    """Save or update schedule settings"""
    try:
        data = request.get_json()
        start_time_str = data.get('start_time')
        end_time_str = data.get('end_time')
        enabled = data.get('enabled', True)
        days_of_week = data.get('days_of_week', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
        
        if not start_time_str or not end_time_str:
            return jsonify({'error': 'Start time and end time required'}), 400
        
        # Parse time strings
        try:
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid time format. Use HH:MM'}), 400
        
        # Check if schedule exists
        schedule = ScheduleSetting.query.filter_by(user_id=current_user.id).first()
        
        if schedule:
            # Update existing
            schedule.start_time = start_time
            schedule.end_time = end_time
            schedule.enabled = enabled
            schedule.days_of_week = ','.join(days_of_week)
        else:
            # Create new
            schedule = ScheduleSetting(
                user_id=current_user.id,
                start_time=start_time,
                end_time=end_time,
                enabled=enabled,
                days_of_week=','.join(days_of_week)
            )
            db.session.add(schedule)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Schedule saved successfully',
            'schedule': schedule.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Schedule save error: {e}")
        return jsonify({'error': 'Failed to save schedule'}), 500


@schedule_bp.route('/api/schedule/status', methods=['GET'])
@login_required
def check_schedule_status():
    """Check if detection should be active now"""
    schedule = ScheduleSetting.query.filter_by(user_id=current_user.id).first()
    
    if not schedule or not schedule.enabled:
        return jsonify({
            'active': True,  # No schedule = always active
            'message': 'No schedule configured, detection runs 24/7'
        }), 200
    
    is_active = schedule.is_active_now()
    
    return jsonify({
        'active': is_active,
        'schedule': schedule.to_dict(),
        'message': 'Detection is active' if is_active else 'Detection is outside scheduled hours'
    }), 200

