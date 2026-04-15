-- Centralized 2FA Auth Service — Database Schema
-- Database: gennetten_auth (on mysql.gennetten.com)
--
-- Run from MySQL command line:
--   mysql -h mysql.gennetten.com -u dgennetten -p
--   Then paste everything below.
--
-- IMPORTANT: Replace 'YOUR_TP_SECRET_HERE' with your chosen plaintext secret
-- before running. Use the same string in auth-service/api/config.php (DB_PASS)
-- and in thursday-pints/api/config.php (AUTH_APP_SECRET).

CREATE DATABASE IF NOT EXISTS gennetten_auth
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gennetten_auth;

CREATE TABLE IF NOT EXISTS apps (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  app_name    VARCHAR(100) NOT NULL,
  app_id      VARCHAR(64)  NOT NULL,
  app_secret  VARCHAR(128) NOT NULL,  -- SHA-256 hex hash of the plaintext secret
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_app_id (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS otp_codes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  app_id      INT UNSIGNED NOT NULL,
  email       VARCHAR(255) NOT NULL,
  code        CHAR(6)      NOT NULL,
  expires_at  DATETIME     NOT NULL,
  used        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lookup (app_id, email, code),
  CONSTRAINT fk_otp_app FOREIGN KEY (app_id)
    REFERENCES apps (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Register Thursday Pints as the first app.
-- Replace 'YOUR_TP_SECRET_HERE' with a strong secret string, e.g. "Th!sIsMySec2026#"
-- The SHA2() function stores the hash; you keep the plaintext in config.php.
INSERT IGNORE INTO apps (app_name, app_id, app_secret)
VALUES (
  'Thursday Pints',
  'thursday-pints',
  SHA2('YOUR_TP_SECRET_HERE', 256)
);

-- To register additional apps later:
-- INSERT IGNORE INTO apps (app_name, app_id, app_secret)
-- VALUES ('My Other App', 'my-other-app', SHA2('OTHER_APP_SECRET', 256));

-- Maintenance (run periodically, or set up a Dreamhost cron):
-- DELETE FROM otp_codes WHERE expires_at < NOW() OR used = 1;
