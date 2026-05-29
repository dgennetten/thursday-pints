-- Run once on the thursdaypints database to add name and birthday columns to the admins table.
-- first_name, last_name: optional display names used in birthday notices.
-- birth_month: 1-12, birth_day: 1-31, both nullable (set manually or via the UI add-user form).

ALTER TABLE admins
  ADD COLUMN first_name  VARCHAR(64)      NULL,
  ADD COLUMN last_name   VARCHAR(64)      NULL,
  ADD COLUMN birth_month TINYINT UNSIGNED NULL,
  ADD COLUMN birth_day   TINYINT UNSIGNED NULL;
