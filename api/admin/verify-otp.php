<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config.php';

$body  = json_decode(file_get_contents('php://input'), true) ?? [];
$email = strtolower(trim((string)($body['email'] ?? '')));
$code  = trim((string)($body['code'] ?? ''));

if (empty($email) || empty($code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and code required']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Verify OTP against local otp_codes table
    $stmt = $pdo->prepare(
        'SELECT id FROM otp_codes
         WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$email, $code]);
    $otpRow = $stmt->fetch();

    if (!$otpRow) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired code']);
        exit;
    }

    // Mark as used
    $pdo->prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')->execute([$otpRow['id']]);

    // Look up admin
    $stmt = $pdo->prepare('SELECT id, email, role FROM admins WHERE LOWER(email) = ? AND is_active = 1 LIMIT 1');
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if (!$admin) {
        http_response_code(401);
        echo json_encode(['error' => 'Account not active']);
        exit;
    }

    // Generate session token (expires in 24 hours)
    $token = bin2hex(random_bytes(32));
    $pdo->prepare(
        'INSERT INTO auth_sessions (admin_id, token, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))'
    )->execute([$admin['id'], $token]);

    echo json_encode([
        'token' => $token,
        'role'  => $admin['role'],
        'email' => $admin['email'],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints verify-otp error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
