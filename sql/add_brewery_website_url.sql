-- Run once against the thursdaypints MySQL database
ALTER TABLE breweries
  ADD COLUMN website_url VARCHAR(500) NULL AFTER status;
