# ServeTrack Backup Information

## 📦 Backup Contents

This backup contains the complete ServeTrack application source code and configurations, **excluding dependencies and build artifacts**.

### What's Included ✅

**Backend (574 MB):**
- ✅ All Python source files (.py)
- ✅ Configuration files (config.py, ecosystem.config.js)
- ✅ Database schema (database_setup.sql)
- ✅ Requirements files (requirements.txt)
- ✅ Environment templates (env.example)
- ✅ Static files and templates
- ✅ Menu item images and data files
- ✅ Utility scripts and models directory structure

**Frontend (432 KB):**
- ✅ Complete React source code (src/)
- ✅ Configuration files (vite.config.js, tailwind.config.js, etc.)
- ✅ Package definition (package.json, package-lock.json)
- ✅ Environment templates (env.example)
- ✅ HTML entry point and public assets

**Root Files:**
- ✅ Deployment scripts (deploy.sh, start-dev.sh)
- ✅ Comprehensive README.md
- ✅ .gitignore file
- ✅ This BACKUP_INFO.md

### What's Excluded ❌

**Dependencies (Need to be installed):**
- ❌ node_modules/ (Frontend dependencies - ~500MB)
- ❌ venv/ or env/ (Python virtual environment - ~2GB)
- ❌ ML model files (*.pt, *.pth - need to be downloaded)

**Build Artifacts:**
- ❌ dist/ (Frontend build output)
- ❌ __pycache__/ (Python bytecode)
- ❌ *.pyc files

**Runtime Files:**
- ❌ logs/ (Application logs)
- ❌ temp/ (Temporary files)
- ❌ detections/ (Detection output artifacts)
- ❌ .env files (Contains sensitive credentials)

**Other Excluded:**
- ❌ mediamtx/ (RTSP server binaries)
- ❌ Documentation markdown files (deployment summaries, etc.)

## 📊 Backup Statistics

- **Total Size:** 574 MB
- **Total Files:** 81 files
- **Backend Size:** 574 MB (includes menu images and data)
- **Frontend Size:** 432 KB (source only)
- **Compressed Size:** ~150 MB (estimated when archived)

## 🚀 Restoration Instructions

### Quick Start

1. **Extract the backup:**
   ```bash
   tar -xzf SERVETRACK_BACKUP.tar.gz
   cd SERVETRACK_BACKUP
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Download ML models:**
   ```bash
   cd backend/models
   wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8l-world.pt
   ```

4. **Configure environment:**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your settings
   
   # Frontend
   cp frontend/env.example frontend/.env
   # Edit frontend/.env if needed
   ```

5. **Setup database:**
   ```bash
   mysql -u root -p < backend/database_setup.sql
   ```

6. **Deploy:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

For detailed instructions, see the main **README.md** file.

## 🔐 Security Notes

- ❗ This backup does NOT contain .env files (they contain sensitive credentials)
- ❗ You MUST create new .env files from env.example templates
- ❗ Change all default passwords before deployment
- ❗ Generate new SECRET_KEY for Flask application

## 📝 Git Repository Setup

This backup is ready to be pushed to a Git repository:

1. **Initialize Git (if not already):**
   ```bash
   git init
   ```

2. **Add remote:**
   ```bash
   git remote add origin <your-git-repository-url>
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Initial commit: ServeTrack application"
   git push -u origin main
   ```

The `.gitignore` file is already configured to exclude:
- Dependencies (node_modules, venv)
- Build artifacts (dist, __pycache__)
- Environment files (.env)
- Logs and temporary files
- Large ML model files
- Runtime data

## 🔄 Post-Installation Checklist

After restoring from backup:

- [ ] Install backend dependencies (pip install -r requirements.txt)
- [ ] Install frontend dependencies (npm install)
- [ ] Download YOLO model files
- [ ] Create and configure .env files
- [ ] Setup MySQL database and user
- [ ] Run database schema script
- [ ] Change default passwords
- [ ] Test backend startup
- [ ] Build frontend (npm run build)
- [ ] Start application with PM2
- [ ] Verify all features work
- [ ] Configure camera settings
- [ ] Setup ROI and schedules
- [ ] Create admin user

## 📞 Support

For questions about this backup or restoration process, refer to the comprehensive README.md file or contact the development team.

---

**Backup Created:** December 2025  
**Application Version:** 1.0.0  
**Backup Type:** Source Code Only (No Dependencies)

