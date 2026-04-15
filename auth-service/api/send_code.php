<?php
/**
 * Centralized Auth Service — Send OTP Code
 * Deploy to: auth.gennetten.org/api/send_code.php
 *
 * POST { "app_id": "thursday-pints", "app_secret": "...", "email": "user@example.com" }
 * Returns: { "success": true } or { "success": false, "message": "..." }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config.php';

$body     = json_decode(file_get_contents('php://input'), true);
$appId    = trim((string)($body['app_id']     ?? ''));
$secret   = trim((string)($body['app_secret'] ?? ''));
$email    = trim((string)($body['email']      ?? ''));

if (empty($appId) || empty($secret) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'app_id, app_secret, and email are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

try {
    $pdo = getAuthDb();
    $app = resolveApp($pdo, $appId, $secret);

    if (!$app) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid app credentials']);
        exit;
    }

    // Generate cryptographically secure 6-digit OTP
    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    // Remove any existing unused codes for this app+email
    $pdo->prepare(
        'DELETE FROM otp_codes WHERE app_id = ? AND email = ?'
    )->execute([$app['id'], $email]);

    // Insert new OTP (expires in 10 minutes)
    $pdo->prepare(
        'INSERT INTO otp_codes (app_id, email, code, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))'
    )->execute([$app['id'], $email, $code]);

    // Send email
    $appName = $app['app_name'];
    $subject = "Your {$appName} login code";
    $message = "Your {$appName} login code is:\n\n  {$code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, you can safely ignore this email.";
    $headers  = "From: noreply@gennetten.org\r\nContent-Type: text/plain; charset=utf-8";
    mail($email, $subject, $message, $headers);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Auth service send_code error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
