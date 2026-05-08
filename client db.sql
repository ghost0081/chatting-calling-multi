-- This runs automatically inside the CLIENT'S database
CREATE TABLE IF NOT EXISTS tenant_users (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255),
    avatar_url TEXT,
    user_type ENUM('user', 'astrologer') DEFAULT 'user',
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('direct', 'group') DEFAULT 'direct',
    name VARCHAR(255),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
    conversation_id INT,
    user_id VARCHAR(255),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    sender_id VARCHAR(255),
    content TEXT,
    type ENUM('text', 'image', 'file', 'voice') DEFAULT 'text',
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS call_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caller_id VARCHAR(255),
    receiver_id VARCHAR(255),
    type ENUM('audio', 'video') DEFAULT 'audio',
    status ENUM('initiated', 'ringing', 'ongoing', 'completed', 'rejected', 'missed', 'busy', 'cancelled') DEFAULT 'initiated',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0
);
