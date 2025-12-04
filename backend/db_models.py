"""
Database Models for ServeTrack
Shri Krishna Express - Food Detection System
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import bcrypt

db = SQLAlchemy()


class User(UserMixin, db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='client', nullable=False)  # 'admin' or 'client'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    cameras = db.relationship('Camera', backref='owner', lazy=True, cascade='all, delete-orphan')
    menu_items = db.relationship('MenuItem', backref='owner', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin'


class Camera(db.Model):
    """Camera model linked to users"""
    __tablename__ = 'cameras'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(255), nullable=False)  # Camera URL or index (0 for webcam)
    is_active = db.Column(db.Boolean, default=True)
    roi_coordinates = db.Column(db.Text, nullable=True)  # JSON string of polygon points
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    detection_sessions = db.relationship('DetectionSession', backref='camera', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert camera to dictionary"""
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'url': self.url,
            'is_active': self.is_active,
            'roi_coordinates': json.loads(self.roi_coordinates) if self.roi_coordinates else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class MenuItem(db.Model):
    """Menu items model linked to users"""
    __tablename__ = 'menu_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    image_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    item_counts = db.relationship('ItemCount', backref='menu_item', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert menu item to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'image': self.image_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DetectionSession(db.Model):
    """Detection session model linked to cameras"""
    __tablename__ = 'detection_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.Integer, db.ForeignKey('cameras.id'), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    item_counts = db.relationship('ItemCount', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert session to dictionary"""
        return {
            'id': self.id,
            'camera_id': self.camera_id,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'is_active': self.is_active
        }


class ItemCount(db.Model):
    """Item count model linking sessions and menu items"""
    __tablename__ = 'item_counts'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('detection_sessions.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    count = db.Column(db.Integer, default=0)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert item count to dictionary"""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'menu_item_id': self.menu_item_id,
            'count': self.count,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None
        }


class ScheduleSetting(db.Model):
    """Schedule settings for detection system"""
    __tablename__ = 'schedule_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    enabled = db.Column(db.Boolean, default=True)
    days_of_week = db.Column(db.String(50), default='Mon,Tue,Wed,Thu,Fri,Sat,Sun')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert schedule to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'enabled': self.enabled,
            'days_of_week': self.days_of_week.split(',') if self.days_of_week else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_active_now(self):
        """Check if detection should be active at current time"""
        if not self.enabled:
            return False
        
        from datetime import datetime, time
        
        now = datetime.now()
        current_time = now.time()
        current_day = now.strftime('%a')  # Mon, Tue, etc.
        
        # Check if today is in allowed days
        allowed_days = self.days_of_week.split(',') if self.days_of_week else []
        if current_day not in allowed_days:
            return False
        
        # Check if current time is within schedule
        if self.start_time <= self.end_time:
            # Normal case: 09:00 to 17:00
            return self.start_time <= current_time <= self.end_time
        else:
            # Overnight case: 22:00 to 02:00
            return current_time >= self.start_time or current_time <= self.end_time

