<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo    = getDbConnection();

define('PHOTO_URL_BASE', 'https://thursdaypints.com/uploads/visit-photos/');
define('PHOTO_DIR',      __DIR__ . '/../../uploads/visit-photos/');
define('MAX_PHOTO_BYTES', 10 * 1024 * 1024); // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// ---- GET: list photos for a visit (member + admin) ----
if ($method === 'GET') {
    requireAuth($pdo, ['admin', 'superadmin', 'member']);

    $date = trim($_GET['date'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing or invalid date parameter']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT id, filename, DATE_FORMAT(created_at, \'%Y-%m-%dT%H:%i:%sZ\') AS created_at
         FROM visit_photos WHERE visit_date = ? ORDER BY created_at ASC'
    );
    $stmt->execute([$date]);
    $photos = array_map(function (array $row): array {
        return [
            'id'         => (int) $row['id'],
            'filename'   => $row['filename'],
            'url'        => PHOTO_URL_BASE . $row['filename'],
            'created_at' => $row['created_at'],
        ];
    }, $stmt->fetchAll());

    echo json_encode($photos);
    exit;
}

// ---- POST: upload a photo (admin only) ----
if ($method === 'POST') {
    $admin = requireAuth($pdo, ['admin', 'superadmin']);

    $date        = trim($_POST['visit_date'] ?? '');
    $breweryName = trim($_POST['brewery_name'] ?? '');

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $breweryName === '') {
        http_response_code(400);
        echo json_encode(['error' => 'visit_date and brewery_name are required']);
        exit;
    }

    if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        $uploadErr = $_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE;
        http_response_code(400);
        echo json_encode(['error' => 'Upload error: ' . $uploadErr]);
        exit;
    }

    $file = $_FILES['photo'];

    if ($file['size'] > MAX_PHOTO_BYTES) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large (max 10 MB)']);
        exit;
    }

    $mime = mime_content_type($file['tmp_name']);
    if (!in_array($mime, ALLOWED_MIME, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Only JPEG, PNG, and WebP images are accepted']);
        exit;
    }

    $ext      = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime];
    $filename = sprintf('%s.%s', bin2hex(random_bytes(16)), $ext);

    if (!is_dir(PHOTO_DIR)) {
        mkdir(PHOTO_DIR, 0755, true);
    }

    if (!move_uploaded_file($file['tmp_name'], PHOTO_DIR . $filename)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO visit_photos (visit_date, brewery_name, filename, uploaded_by)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$date, $breweryName, $filename, $admin['id']]);
    $id = (int) $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        'id'         => $id,
        'filename'   => $filename,
        'url'        => PHOTO_URL_BASE . $filename,
        'created_at' => date('Y-m-d\TH:i:s\Z'),
    ]);
    exit;
}

// ---- DELETE: remove a photo (admin only) ----
if ($method === 'DELETE') {
    $admin = requireAuth($pdo, ['admin', 'superadmin']);

    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = isset($body['id']) ? (int) $body['id'] : 0;

    if ($id < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'id required']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT filename FROM visit_photos WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Photo not found']);
        exit;
    }

    $pdo->prepare('DELETE FROM visit_photos WHERE id = ?')->execute([$id]);

    $filepath = PHOTO_DIR . $row['filename'];
    if (file_exists($filepath)) {
        @unlink($filepath);
    }

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
