-- Run once on the thursdaypints database to track when each user last signed in.
-- last_login_at is stamped in api/auth/verify-otp.php (and api/admin/verify-otp.php)
-- when a one-time code is successfully verified and a session is created, and in
-- api/auth/session.php when a remembered device restores an existing session.
-- NULL means the user has never completed a sign-in.

ALTER TABLE admins
  ADD COLUMN last_login_at DATETIME NULL;
