<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

function normalizeWebsiteUrl(?string $url): ?string {
    if ($url === null) return null;
    $url = trim($url);
    if ($url === '') return null;
    if (!preg_match('/^https?:\/\//i', $url)) {
        $url = 'https://' . $url;
    }
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return null;
    }
    return $url;
}

try {
    $pdo    = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        requireAuth($pdo);
        $stmt = $pdo->query(
            'SELECT id, brewery_name, brewery_address, latitude, longitude, status, website_url
             FROM breweries
             ORDER BY brewery_name ASC'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id']        = (int)$row['id'];
            $row['latitude']  = (float)$row['latitude'];
            $row['longitude'] = (float)$row['longitude'];
            $row['website_url'] = $row['website_url'] !== null ? (string)$row['website_url'] : null;
        }
        echo json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if ($method === 'PUT') {
        requireAuth($pdo);
        $body = json_decode(file_get_contents('php://input'), true);

        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid id required']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM breweries WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Brewery not found']);
            exit;
        }

        $fields = [];
        $params = [];

        if (array_key_exists('status', $body)) {
            $status = trim((string)$body['status']);
            if (!in_array($status, ['Open', 'Closed'], true)) {
                http_response_code(400);
                echo json_encode(['error' => 'status must be Open or Closed']);
                exit;
            }
            $fields[] = 'status = ?';
            $params[] = $status;
        }

        if (array_key_exists('brewery_address', $body)) {
            $address = trim((string)$body['brewery_address']);
            if ($address === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Address cannot be empty']);
                exit;
            }
            $fields[] = 'brewery_address = ?';
            $params[] = $address;
        }

        if (array_key_exists('latitude', $body)) {
            $latitude = (float)$body['latitude'];
            if ($latitude < -90 || $latitude > 90) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid latitude']);
                exit;
            }
            $fields[] = 'latitude = ?';
            $params[] = $latitude;
        }

        if (array_key_exists('longitude', $body)) {
            $longitude = (float)$body['longitude'];
            if ($longitude < -180 || $longitude > 180) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid longitude']);
                exit;
            }
            $fields[] = 'longitude = ?';
            $params[] = $longitude;
        }

        if (array_key_exists('website_url', $body)) {
            $websiteUrl = normalizeWebsiteUrl(
                $body['website_url'] === null ? null : (string)$body['website_url']
            );
            if ($body['website_url'] !== null && trim((string)$body['website_url']) !== '' && $websiteUrl === null) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid website URL']);
                exit;
            }
            $fields[] = 'website_url = ?';
            $params[] = $websiteUrl;
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }

        $params[] = $id;
        $pdo->prepare('UPDATE breweries SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints admin breweries error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
