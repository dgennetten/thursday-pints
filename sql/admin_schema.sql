-- Admin authentication tables for Thursday Pints
-- Run this once against the thursdaypints MySQL database
--
-- OTP codes are now managed by the centralized auth service (gennetten_auth DB).
-- If you previously ran this schema and have an otp_codes table, you can drop it:
--   DROP TABLE IF EXISTS otp_codes;

CREATE TABLE IF NOT EXISTS admins (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255)             NOT NULL,
  role        ENUM('admin','superadmin') NOT NULL DEFAULT 'admin',
  is_active   TINYINT(1)               NOT NULL DEFAULT 1,
  created_by  INT UNSIGNED             NULL,
  created_at  TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id    INT UNSIGNED NOT NULL,
  token       CHAR(64)     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token (token),
  CONSTRAINT fk_session_admin FOREIGN KEY (admin_id)
    REFERENCES admins (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the initial superadmin (idempotent — safe to re-run)
INSERT IGNORE INTO admins (email, role) VALUES ('douglas@gennetten.com', 'superadmin');

-- Migration: add member role (run once)
-- ALTER TABLE admins MODIFY COLUMN role ENUM('admin','superadmin','member') NOT NULL DEFAULT 'admin';

-- Maintenance (run manually or via cron):
-- DELETE FROM auth_sessions WHERE expires_at < NOW();
