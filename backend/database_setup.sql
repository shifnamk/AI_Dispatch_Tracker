-- MySQL Database Setup Script for ServeTrack

-- Create database
CREATE DATABASE IF NOT EXISTS servetrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user and grant privileges
CREATE USER IF NOT EXISTS 'servetrack'@'localhost' IDENTIFIED BY 'servetrack123';
GRANT ALL PRIVILEGES ON servetrack_db.* TO 'servetrack'@'localhost';
FLUSH PRIVILEGES;

USE servetrack_db;

-- Table for storing detection sessions
CREATE TABLE IF NOT EXISTS detection_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_url VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    total_detections INT DEFAULT 0,
    status ENUM('active', 'stopped', 'error') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing menu items
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    reference_image_path VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing detection counts
CREATE TABLE IF NOT EXISTS detection_counts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    count INT DEFAULT 0,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES detection_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_menu_item (menu_item_id),
    INDEX idx_detected_at (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing detection artifacts (images)
CREATE TABLE IF NOT EXISTS detection_artifacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    menu_item_name VARCHAR(100),
    object_id INT,
    similarity_score DECIMAL(5,4),
    crop_image_path VARCHAR(255),
    annotated_image_path VARCHAR(255),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES detection_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_detected_at (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for system analytics
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    menu_item_name VARCHAR(100),
    total_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date_item (date, menu_item_name),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

