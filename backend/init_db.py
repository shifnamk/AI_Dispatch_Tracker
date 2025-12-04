"""
Database Initialization Script for ServeTrack
Creates all tables and optionally adds a default admin user
"""
from flask import Flask
from db_models import db, User, Camera, MenuItem, DetectionSession, ItemCount
from config import Config
import os

def init_database(create_admin=True):
    """Initialize database with tables"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✓ Tables created successfully!")
        
        # Create default users if needed
        if create_admin:
            # Create System Admin
            admin_user = User.query.filter_by(username='admin').first()
            if not admin_user:
                print("\n" + "="*50)
                print("Creating ADMIN user...")
                print("="*50)
                admin_user = User(
                    username='admin',
                    email='admin@servetrack.com',
                    role='admin'
                )
                admin_user.set_password('Admin@2024')
                
                db.session.add(admin_user)
                db.session.commit()
                
                print("✓ Admin user created!")
                print("  Username: admin")
                print("  Password: Admin@2024")
                print("  Role: admin")
                print("  Email: admin@servetrack.com")
                
                # Create a default camera for admin
                admin_camera = Camera(
                    user_id=admin_user.id,
                    name='Admin Camera',
                    url='0',
                    is_active=True
                )
                db.session.add(admin_camera)
                db.session.commit()
            else:
                # Update existing admin to have admin role
                if not hasattr(admin_user, 'role') or admin_user.role != 'admin':
                    admin_user.role = 'admin'
                    db.session.commit()
                print("✓ Admin user already exists")
            
            # Create Shri Krishna Express client user
            client_user = User.query.filter_by(username='shrikrishna').first()
            if not client_user:
                print("\n" + "="*50)
                print("Creating CLIENT user (Shri Krishna Express)...")
                print("="*50)
                client_user = User(
                    username='shrikrishna',
                    email='info@shrikrishnaexpress.com',
                    role='client'
                )
                client_user.set_password('Krishna@2024')
                
                db.session.add(client_user)
                db.session.commit()
                
                print("✓ Client user created!")
                print("  Username: shrikrishna")
                print("  Password: Krishna@2024")
                print("  Role: client")
                print("  Email: info@shrikrishnaexpress.com")
                
                # Create a default camera for client
                client_camera = Camera(
                    user_id=client_user.id,
                    name='Shri Krishna Express Camera',
                    url='rtsp://100.106.21.91:8554/Dispatch',
                    is_active=True
                )
                db.session.add(client_camera)
                db.session.commit()
                print("✓ Default camera created for client!")
            else:
                # Update existing user to have client role
                if not hasattr(client_user, 'role') or client_user.role != 'client':
                    client_user.role = 'client'
                    db.session.commit()
                print("✓ Client user already exists")
        
        # Show table information
        print("\n" + "="*50)
        print("Database Schema Created:")
        print("="*50)
        print("✓ users - User authentication")
        print("✓ cameras - Camera management")
        print("✓ menu_items - Food items to detect")
        print("✓ detection_sessions - Detection tracking")
        print("✓ item_counts - Detection results")
        print("="*50)

if __name__ == '__main__':
    init_database(create_admin=True)

