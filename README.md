# 🍽️ ServeTrack - Real-time Food Detection System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-000000.svg)](https://flask.palletsprojects.com/)

A modern, AI-powered food detection and tracking system using YOLO-World and MobileNet for real-time object detection with a beautiful React frontend and robust Flask backend.

![ServeTrack Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=ServeTrack+Demo)

## 🌟 Overview

ServeTrack revolutionizes food service management by providing real-time detection and tracking of food items using cutting-edge computer vision technology. Perfect for restaurants, cafeterias, food courts, and any food service establishment looking to optimize operations and gain valuable insights.

## ✨ Key Features

### 🎯 Core Detection
- **Real-time Detection**: Lightning-fast YOLO-World object detection
- **Smart Classification**: MobileNet embeddings for precise item identification
- **Live Video Feed**: Real-time camera streams with annotated detections
- **ROI Configuration**: Define custom regions of interest for targeted detection

### 📊 Management & Analytics
- **Menu Management**: Intuitive interface for food item catalog management
- **Schedule Automation**: Configure detection schedules and automated workflows
- **Analytics Dashboard**: Comprehensive insights with charts and statistics
- **Detection Logs**: Detailed history and reporting capabilities

### 🔧 Technical Excellence
- **Modern Architecture**: React frontend + Flask backend + MySQL database
- **Real-time Updates**: WebSocket integration for live data synchronization
- **User Authentication**: Secure role-based access control
- **Responsive Design**: Beautiful UI built with Tailwind CSS
- **Production Ready**: PM2 process management and deployment scripts

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Python** | 3.8+ | Backend runtime |
| **Node.js** | 18+ | Frontend build tools |
| **MySQL** | 8.0+ | Database server |
| **PM2** | Latest | Process management |
| **Git** | Latest | Version control |

### Optional Requirements
- **Nginx** - For production deployment and reverse proxy
- **CUDA GPU** - For accelerated AI inference (recommended for production)

## 🏗️ Project Structure

```
SERVETRACK_BACKUP/
├── backend/                    # Flask API backend
│   ├── app.py                 # Main Flask application
│   ├── auth.py                # Authentication logic
│   ├── config.py              # Configuration settings
│   ├── db_models.py           # Database models
│   ├── models.py              # ML model logic
│   ├── roi_routes.py          # ROI management routes
│   ├── schedule_routes.py     # Schedule management routes
│   ├── requirements.txt       # Python dependencies
│   ├── ecosystem.config.js    # PM2 configuration
│   ├── database_setup.sql     # MySQL schema
│   ├── env.example            # Environment variables template
│   ├── init_db.py             # Database initialization script
│   ├── static/                # Static files and uploads
│   ├── templates/             # HTML templates
│   ├── data/                  # Menu items and settings data
│   ├── menu/                  # Menu item images
│   ├── models/                # ML models directory
│   ├── scripts/               # Utility scripts
│   └── utils/                 # Helper utilities
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Camera.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── CameraSettings.jsx
│   │   │   ├── ROISettings.jsx
│   │   │   ├── ScheduleSettings.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── Login.jsx
│   │   ├── context/          # React context providers
│   │   ├── config/           # API configuration
│   │   ├── utils/            # Utility functions
│   │   ├── data/             # Static data
│   │   ├── App.jsx           # Main App component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Public assets
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── postcss.config.js     # PostCSS config
│   ├── eslint.config.js      # ESLint config
│   ├── index.html            # HTML entry point
│   └── env.example           # Environment variables template
│
├── deploy.sh                 # Production deployment script
├── start-dev.sh             # Development start script
├── .gitignore               # Git ignore patterns
└── README.md                # This file
```

## 🔧 Installation & Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/servetrack.git
cd servetrack

# Or if you have the backup archive
tar -xzf SERVETRACK_BACKUP.tar.gz
cd SERVETRACK_BACKUP
```

### Step 2: Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run the database setup script
source backend/database_setup.sql

# Exit MySQL
exit
```

The script creates:
- Database: `servetrack_db`
- User: `servetrack` with password `servetrack123`
- Tables: users, menu_items, detection_counts, detection_logs, camera_settings, roi_settings, schedules

**Important**: Change the default password in production!

### Step 3: Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Backend `.env` Configuration:**

```bash
# Flask Configuration
SECRET_KEY=your-secret-key-here-change-this
FLASK_ENV=production

# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=servetrack
MYSQL_PASSWORD=servetrack123
MYSQL_DATABASE=servetrack_db

# Camera Settings
CAMERA_INDEX=0
CAMERA_WIDTH=1920
CAMERA_HEIGHT=1080
CAMERA_FPS=30

# Model Settings
MODEL_CONFIDENCE_THRESHOLD=0.8
USE_GPU=false
BATCH_SIZE=1

# Detection Settings
DETECTION_INTERVAL=5
ENABLE_ROI=true
```

**Create necessary directories:**

```bash
mkdir -p logs detections models
```

**Download Required Models:**

The application requires YOLO-World model. Download it manually:

```bash
# Download YOLOv8-World model
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8l-world.pt -O models/yolov8l-world.pt

# Or use a smaller model for faster inference
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m-world.pt -O models/yolov8m-world.pt
```

### Step 4: Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file from template
cp env.example .env

# Edit .env if needed
nano .env
```

**Frontend `.env` Configuration:**

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

**Build for production:**

```bash
npm run build
```

### Step 5: Start the Application

#### Option A: Using Deployment Script (Recommended)

```bash
cd ..
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Check and install system dependencies
2. Setup MySQL database
3. Create Python virtual environment
4. Install backend dependencies
5. Install and build frontend
6. Configure Nginx (optional)
7. Start backend with PM2 [[memory:3312555]]

#### Option B: Manual Start

**Start Backend with PM2:**

```bash
cd backend

# Install PM2 globally if not installed
npm install -g pm2

# Start backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Start Frontend (Development):**

```bash
cd frontend
npm run dev
```

This starts the frontend at `http://localhost:3000`

#### Development Mode Script

For development, use the convenient start script:

```bash
chmod +x start-dev.sh
./start-dev.sh
```

This starts:
- Backend on PM2 at `http://localhost:8000`
- Frontend dev server at `http://localhost:3000` (NOT on PM2) [[memory:3312555]]

## 🏃 Accessing the Application

### Development Mode
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Status**: http://localhost:8000/api/status

### Production Mode (with Nginx)
- **Application**: http://YOUR_SERVER_IP
- **Backend API**: http://YOUR_SERVER_IP:8000

### Default Login Credentials
- **Username**: admin
- **Password**: admin123

**⚠️ Change the admin password immediately after first login!**

## ⚙️ Configuration

### Camera Configuration

1. Navigate to **Camera Settings** in the UI
2. Select camera source:
   - **Webcam**: Enter index (0, 1, 2...)
   - **RTSP Stream**: Enter URL (rtsp://192.168.1.100:554/stream)
   - **HTTP Stream**: Enter URL (http://192.168.1.100:8080/video)
3. Configure resolution and FPS
4. Save settings

### ROI (Region of Interest) Configuration

1. Navigate to **ROI Settings**
2. Start camera preview
3. Draw regions on the video feed
4. Name and save each ROI
5. Enable/disable ROIs as needed

### Schedule Configuration

1. Navigate to **Schedule Settings**
2. Create detection schedules:
   - Set start and end times
   - Select days of the week
   - Choose ROI zones
   - Set detection parameters
3. Enable/disable schedules

## 📱 Application Usage

### 1. Menu Management

**Add Menu Items:**
1. Go to **Menu** page
2. Click **Add Menu Item**
3. Fill in:
   - Item name
   - Description
   - Category
   - Price (optional)
4. Upload reference image
5. Click **Add Item**

**Manage Items:**
- Edit: Click edit icon on item card
- Delete: Click delete icon on item card
- View: Click on item to see details

### 2. Live Detection

**Start Detection:**
1. Go to **Camera** page
2. Camera will start automatically if configured
3. View live feed with real-time detections
4. Monitor detection counts

**Stop Detection:**
- Click **Stop Detection** button
- Or navigate away from Camera page

### 3. Dashboard Monitoring

1. Navigate to **Dashboard**
2. View:
   - Real-time detection counts
   - Active camera status
   - Recent detections
   - System metrics
3. Reset counts if needed

### 4. Analytics & Reports

1. Navigate to **Analytics**
2. Select date range
3. View:
   - Detection trends over time
   - Item distribution charts
   - Peak detection times
   - ROI performance
4. Export data (CSV/PDF)

### 5. User Management

**Add Users:**
1. Go to **User Management** (admin only)
2. Click **Add User**
3. Fill in user details
4. Assign role (Admin/User)
5. Save

**Manage Users:**
- Edit user permissions
- Reset passwords
- Deactivate users

## 🔍 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/check_auth` - Check authentication status

### System
- `GET /` - API status
- `GET /api/status` - System status

### Menu Management
- `GET /api/menu_items` - Get all menu items
- `POST /api/add_menu_item` - Add new menu item
- `PUT /api/menu_items/<id>` - Update menu item
- `DELETE /api/delete_menu_item/<id>` - Delete menu item

### Detection
- `POST /api/start_detection` - Start detection
- `POST /api/stop_detection` - Stop detection
- `POST /api/reset_counts` - Reset counts
- `GET /api/counts` - Get current counts
- `GET /api/detection_logs` - Get detection history

### Camera Management
- `GET /api/camera_settings` - Get camera settings
- `POST /api/camera_settings` - Update camera settings
- `GET /api/video_feed` - Raw camera feed
- `GET /api/video_feed_processed` - Annotated feed

### ROI Management
- `GET /api/roi_settings` - Get ROI settings
- `POST /api/roi_settings` - Save ROI settings
- `DELETE /api/roi_settings/<id>` - Delete ROI

### Schedule Management
- `GET /api/schedules` - Get all schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/<id>` - Update schedule
- `DELETE /api/schedules/<id>` - Delete schedule

### User Management
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user (admin only)

## 🐛 Troubleshooting

### Backend Issues

**Backend not starting:**
```bash
# Check PM2 logs
pm2 logs servetrack-backend

# Check virtual environment
source backend/venv/bin/activate
python -c "import flask; print('Flask OK')"

# Check port availability
netstat -tuln | grep 8000

# Restart backend
pm2 restart servetrack-backend
```

**Database connection errors:**
```bash
# Test MySQL connection
mysql -u servetrack -p servetrack_db

# Verify credentials in .env
cat backend/.env | grep MYSQL

# Check MySQL service
sudo systemctl status mysql
```

**Model loading errors:**
```bash
# Verify model file exists
ls -lh backend/models/yolov8l-world.pt

# Check model permissions
chmod 644 backend/models/*.pt

# Test model loading
cd backend
source venv/bin/activate
python -c "from ultralytics import YOLO; model = YOLO('models/yolov8l-world.pt')"
```

### Frontend Issues

**Frontend not connecting to backend:**
```bash
# Verify backend is running
curl http://localhost:8000/api/status

# Check frontend .env
cat frontend/.env

# Clear build cache and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Build errors:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### Camera Issues

**Camera not connecting:**
- Verify camera URL is correct
- Check camera permissions
- Try different camera backend (OpenCV, GStreamer)
- For webcam, ensure no other app is using it
- Check camera power and network connection

**Low FPS or lag:**
- Reduce camera resolution in settings
- Lower detection FPS (MODEL_FPS in config)
- Enable GPU if available (USE_GPU=true)
- Check CPU/memory usage
- Use smaller YOLO model (yolov8m-world.pt)

**Detection not accurate:**
- Adjust confidence threshold
- Add more menu item reference images
- Configure ROI properly
- Improve lighting conditions
- Clean camera lens

### Performance Optimization

**Backend optimization:**
```bash
# Enable GPU acceleration (if CUDA available)
# In backend/.env
USE_GPU=true

# Use smaller model
# Download yolov8m-world.pt instead of yolov8l-world.pt

# Reduce frame rate
DETECTION_FPS=5  # Instead of 10

# Limit batch size
BATCH_SIZE=1
```

**Database optimization:**
```bash
# Regular cleanup of old logs
mysql -u servetrack -p servetrack_db -e "DELETE FROM detection_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);"

# Optimize tables
mysql -u servetrack -p servetrack_db -e "OPTIMIZE TABLE detection_logs, detection_counts;"
```

## 🔒 Security Best Practices

### Production Deployment Checklist

1. **Change Default Credentials:**
   - Update admin password in User Management
   - Change MySQL password
   - Generate strong SECRET_KEY in backend/.env

2. **Environment Variables:**
   - Never commit .env files
   - Use strong, unique passwords
   - Keep API keys secure

3. **Database Security:**
   ```sql
   -- Create restricted MySQL user
   CREATE USER 'servetrack_prod'@'localhost' IDENTIFIED BY 'strong_password_here';
   GRANT SELECT, INSERT, UPDATE, DELETE ON servetrack_db.* TO 'servetrack_prod'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Network Security:**
   - Use HTTPS in production
   - Configure firewall rules
   - Limit exposed ports
   - Use VPN for remote access

5. **Application Security:**
   - Keep dependencies updated
   - Enable CORS only for trusted domains
   - Implement rate limiting
   - Use authentication tokens with expiration
   - Regular security audits

6. **Nginx Configuration (Production):**
   ```nginx
   # Enable SSL
   ssl_certificate /path/to/cert.pem;
   ssl_certificate_key /path/to/key.pem;
   
   # Security headers
   add_header X-Frame-Options "SAMEORIGIN";
   add_header X-Content-Type-Options "nosniff";
   add_header X-XSS-Protection "1; mode=block";
   ```

## 📊 Monitoring & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check PM2 status: `pm2 status`
- Monitor logs: `pm2 logs servetrack-backend --lines 50`
- Verify detection accuracy

**Weekly:**
- Review detection logs in Analytics
- Check disk space usage
- Backup database
- Update menu items if needed

**Monthly:**
- Update dependencies
- Clean up old detection artifacts
- Review and optimize ROI settings
- Performance analysis

### Backup Procedures

**Database Backup:**
```bash
# Full backup
mysqldump -u servetrack -p servetrack_db > backup_$(date +%Y%m%d).sql

# Automated daily backup (add to crontab)
0 2 * * * mysqldump -u servetrack -pservetrack123 servetrack_db > /backups/servetrack_$(date +\%Y\%m\%d).sql
```

**Application Backup:**
```bash
# Backup menu items and configurations
tar -czf backup_data_$(date +%Y%m%d).tar.gz backend/data backend/menu backend/static/uploads

# Restore
tar -xzf backup_data_YYYYMMDD.tar.gz -C /path/to/SERVETRACK/
```

### Log Management

**View Logs:**
```bash
# PM2 logs
pm2 logs servetrack-backend

# Application logs
tail -f backend/logs/app.log

# Error logs only
pm2 logs servetrack-backend --err
```

**Clear Logs:**
```bash
# Clear PM2 logs
pm2 flush

# Clear application logs
rm -f backend/logs/*.log

# Rotate logs (automated)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 📦 Updating the Application

### Backend Updates

```bash
cd backend
source venv/bin/activate

# Update Python packages
pip install --upgrade -r requirements.txt

# Restart backend
pm2 restart servetrack-backend
```

### Frontend Updates

```bash
cd frontend

# Update npm packages
npm update

# Rebuild
npm run build

# If frontend is served by Nginx, no restart needed
# If using dev server, restart it
```

### Database Migrations

When schema changes are needed:

```bash
# Backup first!
mysqldump -u servetrack -p servetrack_db > backup_before_migration.sql

# Run migration script
mysql -u servetrack -p servetrack_db < migrations/migration_v2.sql
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript/React
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=YOUR_USERNAME/servetrack&type=Date)](https://star-history.com/#YOUR_USERNAME/servetrack&Date)

## 👥 Support & Contact

### 🐛 Issues & Bug Reports
- [Create an Issue](https://github.com/YOUR_USERNAME/servetrack/issues/new)
- Check [existing issues](https://github.com/YOUR_USERNAME/servetrack/issues) first
- Include error logs and system information

### 💬 Community & Support
- [Discussions](https://github.com/YOUR_USERNAME/servetrack/discussions) - General questions and ideas
- [Wiki](https://github.com/YOUR_USERNAME/servetrack/wiki) - Additional documentation
- Email: support@servetrack.com (if applicable)

### 📚 Documentation
- [Installation Guide](https://github.com/YOUR_USERNAME/servetrack/wiki/Installation)
- [API Documentation](https://github.com/YOUR_USERNAME/servetrack/wiki/API)
- [Troubleshooting](https://github.com/YOUR_USERNAME/servetrack/wiki/Troubleshooting)

## 🎯 Roadmap & Future Features

- [ ] Multi-camera simultaneous support
- [ ] Advanced analytics with ML insights
- [ ] Mobile application (iOS/Android)
- [ ] Cloud deployment options (AWS/Azure/GCP)
- [ ] Real-time alerts and notifications (SMS/Email)
- [ ] Integration with POS systems
- [ ] Advanced reporting with PDF/Excel export
- [ ] Video recording and playback
- [ ] AI-powered anomaly detection
- [ ] Multi-language support
- [ ] Dark mode UI theme
- [ ] REST API documentation (Swagger/OpenAPI)
- [ ] Docker containerization
- [ ] Kubernetes deployment support

## 🏆 Acknowledgments

- [YOLO-World](https://github.com/AILab-CVC/YOLO-World) - Real-time object detection
- [Ultralytics](https://github.com/ultralytics/ultralytics) - YOLO implementation
- [React](https://reactjs.org/) - Frontend framework
- [Flask](https://flask.palletsprojects.com/) - Backend framework
- [Tailwind CSS](https://tailwindcss.com/) - UI styling

## 📈 Project Stats

![GitHub repo size](https://img.shields.io/github/repo-size/YOUR_USERNAME/servetrack)
![GitHub last commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/servetrack)
![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/servetrack)
![GitHub pull requests](https://img.shields.io/github/issues-pr/YOUR_USERNAME/servetrack)

---

<div align="center">

**Built with ❤️ using Flask, React, YOLO-World, and MobileNet**

**Version:** 1.0.0 | **Last Updated:** December 2025

[⬆ Back to Top](#-servetrack---real-time-food-detection-system)

</div>

