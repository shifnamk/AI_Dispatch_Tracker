"""
Authentication Routes for ServeTrack
Handles login, logout, register, and session management
"""
from flask import Blueprint, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from db_models import db, User, Camera
from datetime import datetime
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# Initialize Flask-Login
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID"""
    return User.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
    """Handle unauthorized access"""
    return jsonify({'error': 'Authentication required', 'authenticated': False}), 401

def init_auth(app):
    """Initialize authentication"""
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

# Authentication decorator for API routes
def auth_required(f):
    """Decorator to require authentication for API routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required', 'authenticated': False}), 401
        return f(*args, **kwargs)
    return decorated_function


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        remember = data.get('remember', False)
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Find user
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Login user
            login_user(user, remember=remember)
            
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict(),
                'authenticated': True
            }), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500


@auth_bp.route('/api/auth/users', methods=['GET'])
@login_required
def get_users():
    """Get all users (admin only)"""
    if not current_user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    users = User.query.all()
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200


@auth_bp.route('/api/auth/users', methods=['POST'])
@login_required
def create_user():
    """Create new user (admin only)"""
    if not current_user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'client')
        
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password required'}), 400
        
        if role not in ['admin', 'client']:
            return jsonify({'error': 'Role must be admin or client'}), 400
        
        # Check if user exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        user = User(username=username, email=email, role=role)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Create default camera for the user
        default_camera = Camera(
            user_id=user.id,
            name='Default Camera',
            url='0',
            is_active=True
        )
        db.session.add(default_camera)
        db.session.commit()
        
        return jsonify({
            'message': f'User "{username}" created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"User creation error: {e}")
        return jsonify({'error': 'User creation failed'}), 500


@auth_bp.route('/api/auth/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    """Delete user (admin only)"""
    if not current_user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent deleting yourself
        if user.id == current_user.id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        username = user.username
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': f'User "{username}" deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"User deletion error: {e}")
        return jsonify({'error': 'User deletion failed'}), 500


@auth_bp.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    """Logout endpoint"""
    logout_user()
    return jsonify({'message': 'Logout successful', 'authenticated': False}), 200


@auth_bp.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Check authentication status"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        }), 200
    else:
        return jsonify({
            'authenticated': False
        }), 200


@auth_bp.route('/api/auth/user', methods=['GET'])
@login_required
def get_user():
    """Get current user information"""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

