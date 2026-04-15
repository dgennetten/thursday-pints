<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

try {
    $pdo    = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // GET — list all admins (superadmin only)
    if ($method === 'GET') {
        $me = requireAuth($pdo, ['superadmin']);
        $stmt = $pdo->query(
            'SELECT id, email, role, is_active, created_at FROM admins ORDER BY created_at ASC'
        );
        $admins = $stmt->fetchAll();
        // Cast types
        foreach ($admins as &$a) {
            $a['id']        = (int)$a['id'];
            $a['is_active'] = (bool)$a['is_active'];
        }
        echo json_encode($admins, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST — add a new admin (superadmin only)
    if ($method === 'POST') {
        $me   = requireAuth($pdo, ['superadmin']);
        $body = json_decode(file_get_contents('php://input'), true);

        $email = trim((string)($body['email'] ?? ''));
        $role  = trim((string)($body['role']  ?? 'admin'));

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid email required']);
            exit;
        }
        if (!in_array($role, ['admin', 'superadmin'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Role must be admin or superadmin']);
            exit;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO admins (email, role, created_by) VALUES (?, ?, ?)'
        );
        $stmt->execute([$email, $role, $me['id']]);

        echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
        exit;
    }

    // PATCH — change a user's role (superadmin only)
    if ($method === 'PATCH') {
        $me   = requireAuth($pdo, ['superadmin']);
        $body = json_decode(file_get_contents('php://input'), true);

        $id   = (int)($body['id']   ?? 0);
        $role = trim((string)($body['role'] ?? ''));

        if ($id <= 0 || !in_array($role, ['admin', 'superadmin'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid id and role required']);
            exit;
        }
        if ($id === (int)$me['id']) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot change your own role']);
            exit;
        }

        $pdo->prepare('UPDATE admins SET role = ? WHERE id = ?')->execute([$role, $id]);
        echo json_encode(['ok' => true]);
        exit;
    }

    // DELETE — soft-delete an admin (superadmin only)
    if ($method === 'DELETE') {
        $me   = requireAuth($pdo, ['superadmin']);
        $body = json_decode(file_get_contents('php://input'), true);

        $id = (int)($body['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid id required']);
            exit;
        }
        if ($id === (int)$me['id']) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete your own account']);
            exit;
        }

        $pdo->prepare('UPDATE admins SET is_active = 0 WHERE id = ?')->execute([$id]);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['error' => 'An admin with that email already exists']);
    } else {
        http_response_code(500);
        error_log('Thursday Pints admins endpoint error: ' . $e->getMessage());
        echo json_encode(['error' => 'Database error']);
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Thursday Pints admins endpoint error: ' . $e->getMessage());
    echo json_encode(['error' => 'Server error']);
}
