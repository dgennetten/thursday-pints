<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();
    requireAuth($pdo);

    // GET — return all visits sorted chronologically
    if ($method === 'GET') {
        $stmt = $pdo->query(
            'SELECT id,
                    visit_date   AS date,
                    brewery_name AS breweryName,
                    next_brewery AS nextBrewery,
                    notes,
                    is_closed    AS isClosed
             FROM visits
             ORDER BY visit_date ASC'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['id']       = (int)  $r['id'];
            $r['isClosed'] = (bool) $r['isClosed'];
            if ($r['nextBrewery'] === null) unset($r['nextBrewery']);
            if ($r['notes']       === null) unset($r['notes']);
        }
        unset($r);
        echo json_encode($rows, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // PUT — update an existing visit by id
    if ($method === 'PUT') {
        $body        = json_decode(file_get_contents('php://input'), true);
        $id          = (int)   ($body['id']          ?? 0);
        $date        = trim((string)($body['date']        ?? ''));
        $breweryName = trim((string)($body['breweryName'] ?? ''));
        $nextBrewery = array_key_exists('nextBrewery', $body) ? trim((string)$body['nextBrewery']) : null;
        $notes       = array_key_exists('notes',       $body) ? trim((string)$body['notes'])       : null;

        if ($id <= 0 || empty($date) || empty($breweryName)) {
            http_response_code(400);
            echo json_encode(['error' => 'id, date, and breweryName are required']);
            exit;
        }

        $d = DateTime::createFromFormat('Y-m-d', $date);
        if (!$d || $d->format('Y-m-d') !== $date) {
            http_response_code(400);
            echo json_encode(['error' => 'date must be in YYYY-MM-DD format']);
            exit;
        }

        if ($nextBrewery === '') $nextBrewery = null;
        if ($notes       === '') $notes       = null;

        $stmt = $pdo->prepare(
            'UPDATE visits
             SET visit_date = ?, brewery_name = ?, next_brewery = ?, notes = ?
             WHERE id = ?'
        );
        $stmt->execute([$date, $breweryName, $nextBrewery, $notes, $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Visit not found']);
            exit;
        }

        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['error' => 'A visit already exists for that date']);
    } else {
        http_response_code(500);
        error_log('Thursday Pints visits error: ' . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints visits error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
