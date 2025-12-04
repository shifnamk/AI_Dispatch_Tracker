#!/bin/bash

# ServeTrack Development Start Script

set -e

echo "========================================"
echo "  ServeTrack Development Mode"
echo "========================================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Install backend dependencies if needed
if [ ! -d "backend/venv" ]; then
    print_info "Setting up backend virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    print_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Start backend with PM2
print_info "Starting backend with PM2..."
cd backend
pm2 stop servetrack-backend 2>/dev/null || true
pm2 delete servetrack-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
cd ..

# Start frontend (in current terminal - not on PM2 as per user preference)
print_info "Frontend will start in development mode..."
print_warning "Press Ctrl+C to stop the frontend"
echo ""
print_info "Backend is running on: http://localhost:8000"
print_info "Frontend will run on: http://localhost:3000"
echo ""
sleep 2

cd frontend
npm run dev

