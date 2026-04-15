# Auth Service Deployment

These files belong at `auth.gennetten.org/api/` on Dreamhost.

## Steps

1. **Edit `config.php`** — fill in `DB_PASS` with your MySQL password.

2. **Run the DB schema** (once):
   See `../sql/gennetten_auth_schema.sql` — replace `YOUR_TP_SECRET_HERE` with your
   chosen secret, then run the SQL against mysql.gennetten.com.

3. **FTP the three files** to `auth.gennetten.org/api/`:
   - `config.php`
   - `send_code.php`
   - `verify_code.php`

4. **Smoke-test** (replace the secret):
   ```
   curl -X POST https://auth.gennetten.org/api/send_code.php \
     -H "Content-Type: application/json" \
     -d '{"app_id":"thursday-pints","app_secret":"YOUR_TP_SECRET_HERE","email":"douglas@gennetten.com"}'
   ```
   Should return `{"success":true}` and send you an email.

## To add a new app later

Run this SQL (replace values):
```sql
USE gennetten_auth;
INSERT IGNORE INTO apps (app_name, app_id, app_secret)
VALUES ('My New App', 'my-new-app', SHA2('MY_NEW_APP_SECRET', 256));
```
Then use `app_id: "my-new-app"` and `app_secret: "MY_NEW_APP_SECRET"` in that app's PHP config.
