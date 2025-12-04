#!/bin/bash

# ServeTrack Model Download Script
# Downloads required AI models for the food detection system

set -e  # Exit on any error

echo "🍽️  ServeTrack Model Download Script"
echo "===================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -f "backend/scripts/download_models.py" ]; then
    echo "❌ Error: Cannot find backend/scripts/download_models.py"
    echo "Please run this script from the ServeTrack root directory."
    exit 1
fi

# Create models directory if it doesn't exist
mkdir -p backend/models

echo "📁 Models will be downloaded to: backend/models/"
echo ""

# Parse command line arguments
ACTION="all"
MODEL=""
FORCE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --model|-m)
            MODEL="$2"
            ACTION="download"
            shift 2
            ;;
        --force|-f)
            FORCE="--force"
            shift
            ;;
        --list|-l)
            ACTION="list"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --model, -m MODEL    Download specific model (yolov8s-world, yolov8m-world, yolov8l-world)"
            echo "  --force, -f          Force re-download even if file exists"
            echo "  --list, -l           List available models"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Download all models"
            echo "  $0 --model yolov8s-world    # Download small model only"
            echo "  $0 --list                   # List available models"
            echo "  $0 --force                  # Re-download all models"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Run the Python download script
echo "🚀 Starting model download..."
echo ""

if [ "$ACTION" = "download" ] && [ -n "$MODEL" ]; then
    python3 backend/scripts/download_models.py download --model "$MODEL" $FORCE
elif [ "$ACTION" = "list" ]; then
    python3 backend/scripts/download_models.py list
else
    python3 backend/scripts/download_models.py all $FORCE
fi

echo ""
echo "✅ Model download script completed!"
echo ""
echo "💡 Next steps:"
echo "1. Configure your .env file in backend/"
echo "2. Start the backend: cd backend && python app.py"
echo "3. The system will automatically use the downloaded models"
