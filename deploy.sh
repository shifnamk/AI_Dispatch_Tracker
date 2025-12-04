#!/bin/bash

# ServeTrack Deployment Script
# This script deploys both backend and frontend

set -e

echo "========================================"
echo "  ServeTrack Deployment Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. This is not recommended for production."
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# =======================
# 1. Install System Dependencies
# =======================
print_info "Step 1: Installing system dependencies..."

if ! command -v python3 &> /dev/null; then
    print_error "Python3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    print_info "Installing PM2..."
    npm install -g pm2
fi

# Install MySQL client if not present
if ! command -v mysql &> /dev/null; then
    print_warning "MySQL client not found. Installing..."
    apt-get update
    apt-get install -y mysql-client
fi

# =======================
# 2. Setup MySQL Database
# =======================
print_info "Step 2: Setting up MySQL database..."

read -p "Do you want to setup MySQL database now? (y/n): " setup_db
if [ "$setup_db" = "y" ] || [ "$setup_db" = "Y" ]; then
    read -p "Enter MySQL root password: " -s mysql_root_pass
    echo ""
    
    if mysql -u root -p"$mysql_root_pass" < backend/database_setup.sql; then
        print_info "Database setup completed successfully!"
    else
        print_error "Failed to setup database. Please check your MySQL credentials."
        exit 1
    fi
else
    print_warning "Skipping database setup. Make sure to run backend/database_setup.sql manually."
fi

# =======================
# 3. Setup Backend
# =======================
print_info "Step 3: Setting up backend..."

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
print_info "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating .env file from example..."
    cp env.example .env
    print_warning "Please edit backend/.env with your configuration!"
fi

# Create necessary directories
mkdir -p logs static/uploads data detections

deactivate
cd ..

# =======================
# 4. Setup Frontend
# =======================
print_info "Step 4: Setting up frontend..."

cd frontend

# Install dependencies
print_info "Installing frontend dependencies..."
npm install

# Build frontend for production
print_info "Building frontend for production..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating frontend .env file..."
    cp env.example .env
    print_warning "Please edit frontend/.env with your configuration!"
fi

cd ..

# =======================
# 5. Setup Nginx (optional)
# =======================
read -p "Do you want to setup Nginx reverse proxy? (y/n): " setup_nginx
if [ "$setup_nginx" = "y" ] || [ "$setup_nginx" = "Y" ]; then
    if ! command -v nginx &> /dev/null; then
        print_info "Installing Nginx..."
        apt-get update
        apt-get install -y nginx
    fi
    
    print_info "Creating Nginx configuration..."
    cat > /etc/nginx/sites-available/servetrack << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /root/SERVETRACK/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for Socket.IO
    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files from backend
    location /static {
        alias /root/SERVETRACK/backend/static;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/servetrack /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    if nginx -t; then
        print_info "Nginx configuration is valid. Restarting Nginx..."
        systemctl restart nginx
        systemctl enable nginx
    else
        print_error "Nginx configuration test failed!"
        exit 1
    fi
fi

# =======================
# 6. Start Backend with PM2
# =======================
print_info "Step 5: Starting backend with PM2..."

cd backend
# Stop if already running
pm2 stop servetrack-backend 2>/dev/null || true
pm2 delete servetrack-backend 2>/dev/null || true

# Start backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup | tail -n 1 | bash

cd ..

# =======================
# 7. Final Instructions
# =======================
echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
print_info "Backend is running on: http://localhost:8000"
print_info "Frontend is built in: frontend/dist"

if [ "$setup_nginx" = "y" ] || [ "$setup_nginx" = "Y" ]; then
    print_info "Nginx is configured and running"
    print_info "Access the application at: http://YOUR_SERVER_IP"
else
    print_info "To serve the frontend in development mode:"
    echo "  cd frontend && npm run dev"
fi

echo ""
print_info "Useful PM2 commands:"
echo "  pm2 status          - Check backend status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart backend"
echo "  pm2 stop all        - Stop backend"
echo ""

print_warning "Important: Edit configuration files before starting:"
echo "  - backend/.env (MySQL credentials, etc.)"
echo "  - frontend/.env (API URL if needed)"
echo ""

print_info "To view backend logs:"
echo "  pm2 logs servetrack-backend"
echo ""

