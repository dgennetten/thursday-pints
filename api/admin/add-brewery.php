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

    $name      = trim((string)($body['name']      ?? ''));
    $address   = trim((string)($body['address']   ?? ''));
    $latitude  = $body['latitude']  ?? null;
    $longitude = $body['longitude'] ?? null;

    // Validate required fields
    if (empty($name) || empty($address) || $latitude === null || $longitude === null) {
        http_response_code(400);
        echo json_encode(['error' => 'name, address, latitude, and longitude are required']);
        exit;
    }

    $latitude  = (float)$latitude;
    $longitude = (float)$longitude;

    if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid latitude or longitude values']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO breweries (brewery_name, brewery_address, latitude, longitude, status)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $address, $latitude, $longitude, 'Open']);

    echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);

} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['error' => 'A brewery with that name already exists']);
    } else {
        http_response_code(500);
        error_log('Thursday Pints add-brewery error: ' . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints add-brewery error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
