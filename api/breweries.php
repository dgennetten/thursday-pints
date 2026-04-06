<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Cache-Control: public, max-age=3600');

require_once __DIR__ . '/config.php';

try {
    $pdo  = getDbConnection();
    $stmt = $pdo->query(
        'SELECT brewery_name,
                brewery_address,
                latitude,
                longitude,
                status
         FROM breweries
         ORDER BY brewery_name ASC'
    );

    $breweries = [];
    while ($row = $stmt->fetch()) {
        $breweries[] = [
            'brewery_name'    => $row['brewery_name'],
            'brewery_address' => $row['brewery_address'],
            'latitude'        => (float)$row['latitude'],
            'longitude'       => (float)$row['longitude'],
            'status'          => $row['status'],
        ];
    }

    echo json_encode($breweries, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints breweries API error: ' . $e->getMessage());
    echo json_encode(['error' => 'Database error']);
}
