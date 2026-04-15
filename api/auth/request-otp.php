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

// Always return 200 — never reveal whether the email exists.
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['ok' => true]);
}

$pdo  = getDbConnection();
$stmt = $pdo->prepare('SELECT id FROM admins WHERE LOWER(email) = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$email]);

if (!$stmt->fetch()) {
    // Email not in admins — silently do nothing
    jsonOut(['ok' => true]);
}

// Invalidate any existing unused codes for this email
$pdo->prepare('UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0')->execute([$email]);

// Generate and store a 6-digit code (expires in OTP_TTL_MINUTES)
$code      = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$expiresAt = date('Y-m-d H:i:s', strtotime('+' . OTP_TTL_MINUTES . ' minutes'));

$pdo->prepare('INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)')->execute([$email, $code, $expiresAt]);

// Send the code
$subject = 'Your Thursday Pints sign-in code';
$message = "Your one-time sign-in code is:\n\n    {$code}\n\nIt expires in " . OTP_TTL_MINUTES . " minutes.\n\nIf you didn't request this, you can ignore this email.";
$headers = "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

mail($email, $subject, $message, $headers);

jsonOut(['ok' => true]);
