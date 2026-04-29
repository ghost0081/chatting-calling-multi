-- MySQL Database Schema for Antigravity

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_users INT DEFAULT 0, -- 0 means unlimited
    max_messages INT DEFAULT 0,
    max_call_minutes INT DEFAULT 0,
    price_usd DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tenants (Clients / Apps) Table
CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    app_id VARCHAR(100) UNIQUE NOT NULL,
    public_key VARCHAR(255) UNIQUE NOT NULL,
    secret_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended
    plan_id INT NULL,
    db_config JSON NULL, -- Stores {host, port, user, password, database}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
    INDEX idx_tenants_app_id (app_id)
);

-- 4. Tenant Users Table (Users belonging to a specific client)
CREATE TABLE IF NOT EXISTS tenant_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    external_user_id VARCHAR(255) NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, external_user_id),
    INDEX idx_tenant_users_tenant_external (tenant_id, external_user_id)
);

-- 5. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    type VARCHAR(50) DEFAULT 'one-to-one', -- one-to-one, group
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_conversations_tenant (tenant_id)
);

-- 6. Participants Table
CREATE TABLE IF NOT EXISTS participants (
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tenant_users(id) ON DELETE CASCADE,
    INDEX idx_participants_user (user_id)
);

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    conversation_id INT NOT NULL,
    sender_id INT NULL,
    type VARCHAR(50) DEFAULT 'text', -- text, image, file
    text TEXT,
    media_url VARCHAR(1024),
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, seen
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES tenant_users(id) ON DELETE SET NULL,
    INDEX idx_messages_conversation_created (conversation_id, created_at),
    INDEX idx_messages_tenant_created (tenant_id, created_at)
);

-- 8. Call Sessions Table
CREATE TABLE IF NOT EXISTS call_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    caller_id INT NOT NULL,
    receiver_id INT NOT NULL,
    type VARCHAR(50) DEFAULT 'audio', -- audio, video
    status VARCHAR(50) DEFAULT 'initiated', -- initiated, ongoing, missed, rejected, completed
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (caller_id) REFERENCES tenant_users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES tenant_users(id) ON DELETE CASCADE,
    INDEX idx_call_sessions_tenant (tenant_id),
    INDEX idx_call_sessions_caller_receiver (caller_id, receiver_id)
);

-- 9. Usage Logs Table
CREATE TABLE IF NOT EXISTS usage_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    month_year VARCHAR(10) NOT NULL, -- e.g., '10-2023'
    messages_count INT DEFAULT 0,
    call_minutes INT DEFAULT 0,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, month_year)
);

-- 10. Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    url VARCHAR(1024) NOT NULL,
    secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id)
);
ALTER TABLE tenants ADD COLUMN db_config JSON DEFAULT NULL AFTER plan_id;

-- 11. System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT,
    event_type VARCHAR(50) NOT NULL,
    details TEXT,
    status ENUM('success', 'error', 'warning', 'info') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
