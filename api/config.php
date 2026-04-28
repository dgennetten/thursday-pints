<?php
define('DB_HOST',    'mysql.gennetten.com');
define('DB_NAME',    'thursdaypints');
define('DB_USER',    'dgennetten');
define('DB_PASS',    'td!S1ngular1ty');  // Set the real password here before deploying
define('DB_CHARSET', 'utf8mb4');

define('MAIL_FROM',       'noreply@gennetten.org');
define('MAIL_FROM_NAME',  'Thursday Pints');
define('MAIL_BCC',        'douglas@gennetten.com');
define('OTP_TTL_MINUTES', 10);

function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}

function jsonOut(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
