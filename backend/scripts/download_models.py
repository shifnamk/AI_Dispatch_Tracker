#!/usr/bin/env python3
"""
Model Download Script for ServeTrack
Downloads required AI models for food detection system.
"""

import os
import sys
import urllib.request
import hashlib
from pathlib import Path
import argparse

# Model configurations
MODELS = {
    'yolov8l-world': {
        'url': 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8l-world.pt',
        'filename': 'yolov8l-world.pt',
        'size_mb': 87.7,
        'sha256': None,  # Add checksum if available
        'description': 'YOLOv8 Large World model for object detection'
    },
    'yolov8m-world': {
        'url': 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m-world.pt',
        'filename': 'yolov8m-world.pt', 
        'size_mb': 52.4,
        'sha256': None,
        'description': 'YOLOv8 Medium World model (faster, smaller)'
    },
    'yolov8s-world': {
        'url': 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8s-world.pt',
        'filename': 'yolov8s-world.pt',
        'size_mb': 22.5,
        'sha256': None,
        'description': 'YOLOv8 Small World model (fastest, smallest)'
    }
}

def get_models_dir():
    """Get the models directory path."""
    script_dir = Path(__file__).parent
    models_dir = script_dir.parent / 'models'
    models_dir.mkdir(exist_ok=True)
    return models_dir

def download_file(url, filepath, expected_size_mb=None):
    """Download a file with progress bar."""
    print(f"Downloading {filepath.name}...")
    print(f"URL: {url}")
    
    try:
        def progress_hook(block_num, block_size, total_size):
            if total_size > 0:
                percent = min(100, (block_num * block_size * 100) // total_size)
                downloaded_mb = (block_num * block_size) / (1024 * 1024)
                total_mb = total_size / (1024 * 1024)
                print(f"\rProgress: {percent:3d}% ({downloaded_mb:.1f}/{total_mb:.1f} MB)", end='', flush=True)
        
        urllib.request.urlretrieve(url, filepath, progress_hook)
        print()  # New line after progress
        
        # Verify file size
        actual_size_mb = filepath.stat().st_size / (1024 * 1024)
        print(f"Downloaded: {actual_size_mb:.1f} MB")
        
        if expected_size_mb and abs(actual_size_mb - expected_size_mb) > 5:
            print(f"Warning: Expected ~{expected_size_mb} MB, got {actual_size_mb:.1f} MB")
            
        return True
        
    except Exception as e:
        print(f"\nError downloading {filepath.name}: {e}")
        if filepath.exists():
            filepath.unlink()  # Remove partial download
        return False

def verify_checksum(filepath, expected_sha256):
    """Verify file checksum."""
    if not expected_sha256:
        return True
        
    print(f"Verifying checksum for {filepath.name}...")
    sha256_hash = hashlib.sha256()
    
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
    
    actual_sha256 = sha256_hash.hexdigest()
    
    if actual_sha256.lower() == expected_sha256.lower():
        print("✓ Checksum verified")
        return True
    else:
        print(f"✗ Checksum mismatch!")
        print(f"  Expected: {expected_sha256}")
        print(f"  Actual:   {actual_sha256}")
        return False

def download_model(model_name, force=False):
    """Download a specific model."""
    if model_name not in MODELS:
        print(f"Error: Unknown model '{model_name}'")
        print(f"Available models: {', '.join(MODELS.keys())}")
        return False
    
    model_config = MODELS[model_name]
    models_dir = get_models_dir()
    filepath = models_dir / model_config['filename']
    
    # Check if file already exists
    if filepath.exists() and not force:
        file_size_mb = filepath.stat().st_size / (1024 * 1024)
        print(f"✓ {model_config['filename']} already exists ({file_size_mb:.1f} MB)")
        return True
    
    print(f"\n📥 Downloading {model_name}")
    print(f"Description: {model_config['description']}")
    print(f"Expected size: ~{model_config['size_mb']} MB")
    
    # Download the file
    success = download_file(
        model_config['url'], 
        filepath, 
        model_config['size_mb']
    )
    
    if not success:
        return False
    
    # Verify checksum if available
    if model_config['sha256']:
        if not verify_checksum(filepath, model_config['sha256']):
            filepath.unlink()  # Remove corrupted file
            return False
    
    print(f"✅ Successfully downloaded {model_config['filename']}")
    return True

def download_all_models(force=False):
    """Download all available models."""
    print("🚀 Downloading all ServeTrack AI models...")
    print("=" * 50)
    
    success_count = 0
    total_count = len(MODELS)
    
    for model_name in MODELS.keys():
        if download_model(model_name, force):
            success_count += 1
        print()  # Spacing between models
    
    print("=" * 50)
    print(f"📊 Download Summary: {success_count}/{total_count} models downloaded successfully")
    
    if success_count == total_count:
        print("🎉 All models downloaded successfully!")
        return True
    else:
        print("⚠️  Some models failed to download. Check the errors above.")
        return False

def list_models():
    """List available models."""
    print("📋 Available ServeTrack Models:")
    print("=" * 50)
    
    for name, config in MODELS.items():
        models_dir = get_models_dir()
        filepath = models_dir / config['filename']
        status = "✅ Downloaded" if filepath.exists() else "❌ Not downloaded"
        
        print(f"🔹 {name}")
        print(f"   Description: {config['description']}")
        print(f"   Size: ~{config['size_mb']} MB")
        print(f"   Status: {status}")
        print()

def main():
    parser = argparse.ArgumentParser(
        description="Download AI models for ServeTrack food detection system"
    )
    parser.add_argument(
        'action', 
        choices=['download', 'list', 'all'],
        help='Action to perform'
    )
    parser.add_argument(
        '--model', '-m',
        choices=list(MODELS.keys()),
        help='Specific model to download (for download action)'
    )
    parser.add_argument(
        '--force', '-f',
        action='store_true',
        help='Force re-download even if file exists'
    )
    
    args = parser.parse_args()
    
    if args.action == 'list':
        list_models()
    elif args.action == 'all':
        download_all_models(args.force)
    elif args.action == 'download':
        if not args.model:
            print("Error: --model is required for download action")
            parser.print_help()
            sys.exit(1)
        download_model(args.model, args.force)
    
    print("\n💡 Usage Tips:")
    print("- Use 'yolov8s-world' for fastest inference (development)")
    print("- Use 'yolov8m-world' for balanced speed/accuracy")
    print("- Use 'yolov8l-world' for best accuracy (production)")

if __name__ == '__main__':
    main()
