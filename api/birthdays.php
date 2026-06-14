<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/admin/auth.php';

$from = $_GET['from'] ?? null;
$to   = $_GET['to']   ?? null;

if (!$from || !$to
    || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)
    || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
    http_response_code(400);
    echo json_encode(['error' => 'from and to date params required (YYYY-MM-DD)']);
    exit;
}

try {
    $pdo  = getDbConnection();
    $stmt = $pdo->query(
        'SELECT email, first_name, last_name, birth_month, birth_day
         FROM admins
         WHERE is_active = 1 AND birth_month IS NOT NULL AND birth_day IS NOT NULL'
    );
    $members = $stmt->fetchAll();

    $fromDt   = new DateTimeImmutable($from);
    $toDt     = new DateTimeImmutable($to);
    $fromYear = (int)$fromDt->format('Y');

    $birthdays = [];
    foreach ($members as $m) {
        $month = (int)$m['birth_month'];
        $day   = (int)$m['birth_day'];

        if (!checkdate($month, $day, 2000)) continue;

        foreach ([$fromYear, $fromYear + 1] as $year) {
            $bday = DateTimeImmutable::createFromFormat('Y-n-j', "$year-$month-$day");
            if ($bday && $bday >= $fromDt && $bday <= $toDt) {
                if (!empty($m['first_name']) || !empty($m['last_name'])) {
                    $name = trim(($m['first_name'] ?? '') . ' ' . ($m['last_name'] ?? ''));
                } else {
                    $localPart = explode('@', $m['email'])[0];
                    $name      = ucfirst(strtolower(preg_replace('/[^a-zA-Z]/', '', $localPart)));
                }
                $birthdays[] = ['name' => $name, 'month' => $month, 'day' => $day];
                break;
            }
        }
    }

    $viewer = getAuthenticatedAdmin($pdo, ['member', 'admin', 'superadmin']);
    if ($viewer) {
        echo json_encode(['birthdays' => $birthdays, 'birthdayCount' => count($birthdays)], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['birthdays' => [], 'birthdayCount' => count($birthdays)], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints birthdays error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
