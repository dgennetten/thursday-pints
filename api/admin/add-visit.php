<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

try {
    $pdo = getDbConnection();
    requireAuth($pdo); // any admin role

    $body = json_decode(file_get_contents('php://input'), true);

    $date        = trim((string)($body['date']        ?? ''));
    $breweryName = trim((string)($body['breweryName'] ?? ''));
    $nextBrewery = isset($body['nextBrewery']) ? trim((string)$body['nextBrewery']) : null;
    $notes       = isset($body['notes'])       ? trim((string)$body['notes'])       : null;

    // Validate required fields
    if (empty($date) || empty($breweryName)) {
        http_response_code(400);
        echo json_encode(['error' => 'date and breweryName are required']);
        exit;
    }

    // Validate date format (YYYY-MM-DD)
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        http_response_code(400);
        echo json_encode(['error' => 'date must be in YYYY-MM-DD format']);
        exit;
    }

    // Normalize empty strings to NULL
    if ($nextBrewery === '') $nextBrewery = null;
    if ($notes       === '') $notes       = null;

    $stmt = $pdo->prepare(
        'INSERT INTO visits (visit_date, brewery_name, next_brewery, notes)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$date, $breweryName, $nextBrewery, $notes]);

    echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        // Duplicate entry for visit_date
        http_response_code(409);
        echo json_encode(['error' => 'A visit already exists for that date']);
    } else {
        http_response_code(500);
        error_log('Thursday Pints add-visit error: ' . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints add-visit error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
