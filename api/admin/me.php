<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

try {
    $pdo   = getDbConnection();
    $admin = requireAuth($pdo);

    echo json_encode([
        'id'    => (int)$admin['id'],
        'email' => $admin['email'],
        'role'  => $admin['role'],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints me endpoint error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
