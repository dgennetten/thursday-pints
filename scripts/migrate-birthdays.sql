-- Run once on the thursdaypints database to add birthday columns to the admins table.
-- birth_month: 1–12, birth_day: 1–31, both nullable (set manually or via the UI add-user form).

ALTER TABLE admins
  ADD COLUMN birth_month TINYINT UNSIGNED NULL,
  ADD COLUMN birth_day   TINYINT UNSIGNED NULL;
