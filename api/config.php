<?php
define('DB_HOST',    'mysql.gennetten.com');
define('DB_NAME',    'thursdaypints');
define('DB_USER',    'dgennetten');
define('DB_PASS',    'td!stayAct1ve');  // Set the real password here before deploying
define('DB_CHARSET', 'utf8mb4');

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
