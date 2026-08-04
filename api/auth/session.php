<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config.php';

$body  = json_decode(file_get_contents('php://input'), true) ?? [];
$token = trim($body['token'] ?? '');

if ($token === '' || strlen($token) !== 64 || !ctype_xdigit($token)) {
    jsonOut(['success' => false, 'error' => 'Invalid token'], 401);
}

$pdo = getDbConnection();

$stmt = $pdo->prepare(
    'SELECT s.expires_at, a.id, a.email, a.role
     FROM auth_sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token = ? AND a.is_active = 1
     LIMIT 1'
);
$stmt->execute([$token]);
$row = $stmt->fetch();

if (!$row) {
    jsonOut(['success' => false, 'error' => 'Unknown session'], 401);
}

$expiresTs = strtotime($row['expires_at']);
if ($expiresTs === false || $expiresTs < time()) {
    $pdo->prepare('DELETE FROM auth_sessions WHERE token = ?')->execute([$token]);
    jsonOut(['success' => false, 'error' => 'Session expired'], 401);
}

// Count restoring a remembered session as a login, so admins who stay signed in
// via a device token still get an accurate last_login_at. Throttle to at most once
// an hour so this doesn't write on every app load.
$pdo->prepare(
    'UPDATE admins
     SET last_login_at = NOW()
     WHERE id = ? AND (last_login_at IS NULL OR last_login_at < NOW() - INTERVAL 1 HOUR)'
)->execute([$row['id']]);

jsonOut([
    'success'   => true,
    'token'     => $token,
    'email'     => $row['email'],
    'role'      => $row['role'],
    'id'        => (int) $row['id'],
    'expiresAt' => $expiresTs * 1000,
]);
