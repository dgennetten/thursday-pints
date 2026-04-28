<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: public, max-age=60');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config.php';

try {
    $pdo  = getDbConnection();
    $stmt = $pdo->query(
        'SELECT DISTINCT DATE_FORMAT(visit_date, \'%Y-%m-%d\') AS visit_date
         FROM visit_photos
         ORDER BY visit_date DESC'
    );
    $dates = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['dates' => $dates]);
} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints photos.php error: ' . $e->getMessage());
    echo json_encode(['dates' => []]);
}
