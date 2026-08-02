-- Run once on the thursdaypints database to track when each user last signed in.
-- last_login_at is stamped in api/auth/verify-otp.php (and api/admin/verify-otp.php)
-- when a one-time code is successfully verified and a session is created.
-- NULL means the user has never completed a sign-in.

ALTER TABLE admins
  ADD COLUMN last_login_at DATETIME NULL;
