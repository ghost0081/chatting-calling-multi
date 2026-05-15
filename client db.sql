-- ============================================================
-- PRODUCTION CALLING ENGINE SCHEMA (Multi-Tenant Ready)
-- ============================================================

-- 1. Call Sessions: The primary source of truth for all calls
CREATE TABLE IF NOT EXISTS call_sessions (
    id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    caller_id           VARCHAR(100) NOT NULL,
    receiver_id         VARCHAR(100) NOT NULL,
    type                ENUM('audio', 'video') DEFAULT 'audio',
    status              ENUM('initiated', 'ringing', 'ongoing', 'completed', 'rejected', 'missed', 'canceled', 'failed') DEFAULT 'initiated',
    started_at          TIMESTAMP NULL,
    ended_at            TIMESTAMP NULL,
    duration_seconds    INT DEFAULT 0,
    metadata            JSON, -- Store device info, network type, etc.
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_caller (caller_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 2. Call Logs: For detailed event tracking (Debugging & Audit)
CREATE TABLE IF NOT EXISTS call_logs (
    id                  BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    call_session_id     BIGINT UNSIGNED NOT NULL,
    event_type          VARCHAR(50), -- 'offer_sent', 'answer_received', 'ice_exchanged', 'reconnected'
    details             TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (call_session_id) REFERENCES call_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Tenant Users: Ensure we track online status at the DB level too
ALTER TABLE tenant_users 
ADD COLUMN IF NOT EXISTS is_busy BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS current_call_id BIGINT DEFAULT NULL;
