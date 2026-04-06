CREATE TABLE IF NOT EXISTS visits (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visit_date   DATE         NOT NULL,
  brewery_name VARCHAR(255) NOT NULL,
  is_closed    TINYINT(1)   NOT NULL DEFAULT 0,
  notes        TEXT         NULL,
  next_brewery TEXT         NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS breweries (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  brewery_name     VARCHAR(255)          NOT NULL,
  brewery_address  VARCHAR(500)          NOT NULL,
  latitude         DECIMAL(10,7)         NOT NULL,
  longitude        DECIMAL(10,7)         NOT NULL,
  status           ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  created_at       TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_brewery_name (brewery_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
