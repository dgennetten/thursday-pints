-- Visit photos table for Thursday Pints
-- Run this once against the thursdaypints MySQL database after running photos_schema.sql

CREATE TABLE IF NOT EXISTS visit_photos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visit_date   DATE         NOT NULL,
  brewery_name VARCHAR(255) NOT NULL,
  filename     VARCHAR(255) NOT NULL,
  uploaded_by  INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_date (visit_date),
  CONSTRAINT fk_photo_uploader FOREIGN KEY (uploaded_by)
    REFERENCES admins(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
