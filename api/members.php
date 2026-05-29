<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/admin/auth.php';

try {
    $pdo = getDbConnection();
    requireAuth($pdo, ['member', 'admin', 'superadmin']);

    $stmt = $pdo->query(
        'SELECT first_name, last_name, birth_month, birth_day
         FROM admins
         WHERE is_active = 1
         ORDER BY last_name ASC, first_name ASC'
    );
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['birth_month'] = $r['birth_month'] !== null ? (int)$r['birth_month'] : null;
        $r['birth_day']   = $r['birth_day']   !== null ? (int)$r['birth_day']   : null;
    }

    echo json_encode(['members' => $rows], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints members error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
