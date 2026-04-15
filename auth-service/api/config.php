<?php
/**
 * Centralized Auth Service — Database Config
 * Deploy this file to: auth.gennetten.org/api/config.php
 *
 * IMPORTANT: Replace DB_PASS with your actual MySQL password,
 * and keep this file out of public git (add to .gitignore if needed).
 */

define('DB_HOST',    'mysql.gennetten.com');
define('DB_NAME',    'gennetten_auth');
define('DB_USER',    'dgennetten');
define('DB_PASS',    'YOUR_DB_PASSWORD_HERE');  // same password as thursday-pints DB
define('DB_CHARSET', 'utf8mb4');

function getAuthDb(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

/**
 * Validate app_id + app_secret against the apps table.
 * Returns the app row (with 'id' and 'app_name') or null if invalid.
 */
function resolveApp(PDO $pdo, string $appId, string $appSecret): ?array {
    $stmt = $pdo->prepare(
        'SELECT id, app_name FROM apps
         WHERE app_id = ? AND app_secret = SHA2(?, 256) AND is_active = 1
         LIMIT 1'
    );
    $stmt->execute([$appId, $appSecret]);
    return $stmt->fetch() ?: null;
}
