<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Cache-Control: public, max-age=300');

require_once __DIR__ . '/config.php';

try {
    $pdo  = getDbConnection();
    $stmt = $pdo->query(
        'SELECT visit_date   AS `date`,
                brewery_name AS breweryName,
                is_closed    AS isClosed,
                notes,
                next_brewery AS nextBrewery
         FROM visits
         ORDER BY visit_date DESC'
    );

    $visits = [];
    while ($row = $stmt->fetch()) {
        $v = [
            'date'        => $row['date'],
            'breweryName' => $row['breweryName'],
        ];
        if ((int)$row['isClosed'] === 1)   $v['isClosed']    = true;
        if ($row['notes']       !== null)   $v['notes']       = $row['notes'];
        if ($row['nextBrewery'] !== null)   $v['nextBrewery'] = $row['nextBrewery'];
        $visits[] = $v;
    }

    echo json_encode($visits, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints visits API error: ' . $e->getMessage());
    echo json_encode(['error' => 'Database error']);
}
