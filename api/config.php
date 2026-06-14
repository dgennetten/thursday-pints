<?php
define('DB_HOST',    'mysql.gennetten.com');
define('DB_NAME',    'thursdaypints');
define('DB_USER',    'dgennetten');
define('DB_PASS',    'td!S1ngular1ty');  // Set the real password here before deploying
define('DB_CHARSET', 'utf8mb4');

define('MAIL_FROM',       'noreply@gennetten.org');
define('MAIL_FROM_NAME',  'Thursday Pints');
define('MAIL_BCC',        'douglas@gennetten.com');
define('OTP_TTL_MINUTES', 10);
define('WELCOME_OTC_DAYS', 7);

function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_FOUND_ROWS   => true,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}

function jsonOut(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

/**
 * Issue a welcome sign-in code for a new member and email it.
 * Returns true if the email was sent, false on failure.
 */
function sendWelcomeMemberEmail(PDO $pdo, string $email, ?string $firstName = null, ?string $addedByEmail = null): bool {
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $code      = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+' . WELCOME_OTC_DAYS . ' days'));

    try {
        $pdo->beginTransaction();
        $pdo->prepare('INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)')->execute([$email, $code, $expiresAt]);
        $pdo->commit();
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Thursday Pints welcome OTC error: ' . $e->getMessage());
        return false;
    }

    $greeting = $firstName ? "Hi {$firstName}," : 'Hi,';
    $subject  = 'Welcome to Thursday Pints';
    $message  = "{$greeting}\n\n"
              . "Welcome to Thursday Pints! You've been added as a member.\n\n"
              . "Your sign-in code is:\n\n    {$code}\n\n"
              . "This code is valid for " . WELCOME_OTC_DAYS . " days. "
              . "Visit https://thursdaypints.com, click Sign In, enter your email ({$email}), "
              . "and use this code to sign in.\n\n"
              . "After it expires, you can request a fresh code anytime from the sign-in page.\n";

    $headers = "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n";
    if ($addedByEmail !== null && filter_var($addedByEmail, FILTER_VALIDATE_EMAIL)) {
        $headers .= "Cc: {$addedByEmail}\r\n";
    }
    $headers .= "Bcc: " . MAIL_BCC . "\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n";

    if (!mail($email, $subject, $message, $headers)) {
        error_log('Thursday Pints welcome email mail() failed for ' . $email);
        return false;
    }

    if ($addedByEmail !== null && filter_var($addedByEmail, FILTER_VALIDATE_EMAIL)) {
        $memberLabel = $firstName ? "{$firstName} ({$email})" : $email;
        $adminSubject = 'Thursday Pints welcome email sent';
        $adminMessage = "You added {$memberLabel} as a member.\n\n"
                      . "A welcome email with a " . WELCOME_OTC_DAYS . "-day sign-in code was sent to {$email}.\n";
        $adminHeaders = "From: " . MAIL_FROM_NAME . " <" . MAIL_FROM . ">\r\n"
                      . "Content-Type: text/plain; charset=UTF-8\r\n";
        if (!mail($addedByEmail, $adminSubject, $adminMessage, $adminHeaders)) {
            error_log('Thursday Pints welcome admin notification failed for ' . $addedByEmail);
        }
    }

    return true;
}
