@echo off
REM ServeTrack Model Download Script for Windows
REM Downloads required AI models for the food detection system

setlocal enabledelayedexpansion

echo 🍽️  ServeTrack Model Download Script
echo ====================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 is required but not installed.
    echo Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Navigate to script directory
cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "backend\scripts\download_models.py" (
    echo ❌ Error: Cannot find backend\scripts\download_models.py
    echo Please run this script from the ServeTrack root directory.
    pause
    exit /b 1
)

REM Create models directory if it doesn't exist
if not exist "backend\models" mkdir "backend\models"

echo 📁 Models will be downloaded to: backend\models\
echo.

REM Parse command line arguments
set "ACTION=all"
set "MODEL="
set "FORCE="

:parse_args
if "%~1"=="" goto run_script
if "%~1"=="--model" (
    set "MODEL=%~2"
    set "ACTION=download"
    shift
    shift
    goto parse_args
)
if "%~1"=="-m" (
    set "MODEL=%~2"
    set "ACTION=download"
    shift
    shift
    goto parse_args
)
if "%~1"=="--force" (
    set "FORCE=--force"
    shift
    goto parse_args
)
if "%~1"=="-f" (
    set "FORCE=--force"
    shift
    goto parse_args
)
if "%~1"=="--list" (
    set "ACTION=list"
    shift
    goto parse_args
)
if "%~1"=="-l" (
    set "ACTION=list"
    shift
    goto parse_args
)
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help

echo ❌ Unknown option: %~1
echo Use --help for usage information.
pause
exit /b 1

:show_help
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   --model, -m MODEL    Download specific model (yolov8s-world, yolov8m-world, yolov8l-world)
echo   --force, -f          Force re-download even if file exists
echo   --list, -l           List available models
echo   --help, -h           Show this help message
echo.
echo Examples:
echo   %0                           # Download all models
echo   %0 --model yolov8s-world    # Download small model only
echo   %0 --list                   # List available models
echo   %0 --force                  # Re-download all models
pause
exit /b 0

:run_script
REM Run the Python download script
echo 🚀 Starting model download...
echo.

if "%ACTION%"=="download" if not "%MODEL%"=="" (
    python backend\scripts\download_models.py download --model "%MODEL%" %FORCE%
) else if "%ACTION%"=="list" (
    python backend\scripts\download_models.py list
) else (
    python backend\scripts\download_models.py all %FORCE%
)

echo.
echo ✅ Model download script completed!
echo.
echo 💡 Next steps:
echo 1. Configure your .env file in backend\
echo 2. Start the backend: cd backend ^&^& python app.py
echo 3. The system will automatically use the downloaded models

pause
