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

$body       = json_decode(file_get_contents('php://input'), true) ?? [];
$email      = strtolower(trim($body['email'] ?? ''));
$adminId    = (int)($body['adminId'] ?? 0);
$birthMonth = isset($body['birthMonth']) ? (int)$body['birthMonth'] : null;
$birthDay   = isset($body['birthDay'])   ? (int)$body['birthDay']   : null;

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['ok' => false, 'error' => 'Valid email required'], 400);
}

if ($adminId <= 0) {
    jsonOut(['ok' => false, 'error' => 'Admin required'], 400);
}

if ($birthMonth !== null && ($birthMonth < 1 || $birthMonth > 12)) {
    jsonOut(['ok' => false, 'error' => 'Invalid birth month'], 400);
}

if ($birthDay !== null && ($birthDay < 1 || $birthDay > 31)) {
    jsonOut(['ok' => false, 'error' => 'Invalid birth day'], 400);
}

$pdo = getDbConnection();

$stmt = $pdo->prepare('SELECT id FROM admins WHERE LOWER(email) = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonOut(['ok' => false, 'error' => 'That email is already a member'], 400);
}

$stmt = $pdo->prepare(
    "SELECT id, email, first_name, last_name
     FROM admins
     WHERE id = ? AND role IN ('admin', 'superadmin') AND is_active = 1
     LIMIT 1"
);
$stmt->execute([$adminId]);
$admin = $stmt->fetch();

if (!$admin) {
    jsonOut(['ok' => false, 'error' => 'Admin not found'], 404);
}

$adminName = trim(($admin['first_name'] ?? '') . ' ' . ($admin['last_name'] ?? ''));
if ($adminName === '') {
    $adminName = $admin['email'];
}

$monthNames = [
    1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
    5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
    9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
];

$birthdayLine = '';
if ($birthMonth !== null && $birthDay !== null) {
    $birthdayLine = "Birthday: {$monthNames[$birthMonth]} {$birthDay}\n";
}

$subject = 'Thursday Pints membership request';
$message = "{$email} would like to join Thursday Pints.\n\n"
         . "Email: {$email}\n"
         . $birthdayLine
         . "\nPlease add them as a member in the admin panel when ready.\n";

$headers = "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n"
         . "Reply-To: {$email}\r\n"
         . "Bcc: " . MAIL_BCC . "\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

if (!mail($admin['email'], $subject, $message, $headers)) {
    error_log('Thursday Pints request-membership mail failed for ' . $email);
    jsonOut(['ok' => false, 'error' => 'Could not send request. Please try again.'], 500);
}

$confirmSubject = 'Your Thursday Pints membership request was sent';
$confirmMessage = "Hi,\n\nWe sent your membership request to {$adminName} ({$admin['email']}).\n"
                . "They'll add you when ready — you'll receive a sign-in code once you're a member.\n";
$confirmHeaders = "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n";

mail($email, $confirmSubject, $confirmMessage, $confirmHeaders);

jsonOut(['ok' => true, 'adminName' => $adminName]);
