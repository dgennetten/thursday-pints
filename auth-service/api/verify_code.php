<?php
/**
 * Centralized Auth Service — Verify OTP Code
 * Deploy to: auth.gennetten.org/api/verify_code.php
 *
 * POST { "app_id": "thursday-pints", "app_secret": "...", "email": "...", "code": "123456" }
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

$body   = json_decode(file_get_contents('php://input'), true);
$appId  = trim((string)($body['app_id']     ?? ''));
$secret = trim((string)($body['app_secret'] ?? ''));
$email  = trim((string)($body['email']      ?? ''));
$code   = trim((string)($body['code']       ?? ''));

if (empty($appId) || empty($secret) || empty($email) || empty($code)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'app_id, app_secret, email, and code are required']);
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

    // Look up valid, unused OTP for this app+email+code
    $stmt = $pdo->prepare(
        'SELECT id FROM otp_codes
         WHERE app_id = ? AND email = ? AND code = ?
           AND used = 0 AND expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$app['id'], $email, $code]);
    $otp = $stmt->fetch();

    if (!$otp) {
        http_response_code(200);  // Don't leak 401 for wrong code — caller decides UX
        echo json_encode(['success' => false, 'message' => 'Invalid or expired code']);
        exit;
    }

    // Mark code as used
    $pdo->prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')->execute([$otp['id']]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Auth service verify_code error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
