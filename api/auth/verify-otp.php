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
$email = strtolower(trim($body['email'] ?? ''));
$code  = trim($body['code'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $code)) {
    jsonOut(['success' => false, 'error' => 'Invalid input'], 400);
}

$pdo = getDbConnection();

// Find a valid, unused, unexpired code
$stmt = $pdo->prepare(
    'SELECT id FROM otp_codes
     WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()
     LIMIT 1'
);
$stmt->execute([$email, $code]);
$otpRow = $stmt->fetch();

if (!$otpRow) {
    jsonOut(['success' => false, 'error' => 'Invalid or expired code'], 401);
}

// Mark code as used
$pdo->prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')->execute([$otpRow['id']]);

// Look up admin
$stmt = $pdo->prepare('SELECT id, email, role FROM admins WHERE LOWER(email) = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$email]);
$admin = $stmt->fetch();

if (!$admin) {
    jsonOut(['success' => false, 'error' => 'Account not active'], 401);
}

// Create session token — long-lived if "remember this device" was checked
$remember  = !empty($body['remember']);
$token     = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime($remember ? '+365 days' : '+1 day'));

$pdo->prepare('INSERT INTO auth_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)')->execute([$admin['id'], $token, $expiresAt]);

// Occasional cleanup of expired / used OTP codes
if (random_int(1, 20) === 1) {
    $pdo->prepare('DELETE FROM otp_codes WHERE expires_at < NOW() OR used = 1')->execute();
}

$expiresTs = strtotime($expiresAt);

jsonOut([
    'success'   => true,
    'token'     => $token,
    'email'     => $admin['email'],
    'role'      => $admin['role'],
    'id'        => (int) $admin['id'],
    'expiresAt' => $expiresTs * 1000,
]);
