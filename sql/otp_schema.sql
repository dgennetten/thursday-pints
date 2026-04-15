-- OTP codes for local authentication (replaces centralized auth service)
-- Run this once against the thursdaypints MySQL database.
-- Requires admin_schema.sql to have been run first.

CREATE TABLE IF NOT EXISTS otp_codes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(64)  NOT NULL,
  code       CHAR(6)      NOT NULL,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lookup (email, code),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ensure the initial admin exists (idempotent)
INSERT IGNORE INTO admins (email, role) VALUES ('douglas@gennetten.com', 'superadmin');

-- Maintenance (run manually or via cron):
-- DELETE FROM otp_codes WHERE expires_at < NOW() OR used = 1;
-- DELETE FROM auth_sessions WHERE expires_at < NOW();
