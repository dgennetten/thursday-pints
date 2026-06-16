<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://thursdaypints.com');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/auth.php';

try {
    $pdo    = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // GET — list all admins (admin and superadmin)
    if ($method === 'GET') {
        $me = requireAuth($pdo, ['admin', 'superadmin']);
        $stmt = $pdo->query(
            'SELECT id, email, first_name, last_name, role, is_active, created_at, birth_month, birth_day FROM admins ORDER BY created_at ASC'
        );
        $admins = $stmt->fetchAll();
        foreach ($admins as &$a) {
            $a['id']          = (int)$a['id'];
            $a['is_active']   = (bool)$a['is_active'];
            $a['birth_month'] = $a['birth_month'] !== null ? (int)$a['birth_month'] : null;
            $a['birth_day']   = $a['birth_day']   !== null ? (int)$a['birth_day']   : null;
        }
        echo json_encode($admins, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST — add a new user (superadmin: any role; admin: member only)
    if ($method === 'POST') {
        $me   = requireAuth($pdo, ['admin', 'superadmin']);
        $body = json_decode(file_get_contents('php://input'), true);

        $email = trim((string)($body['email'] ?? ''));
        $role  = trim((string)($body['role']  ?? 'member'));

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid email required']);
            exit;
        }
        $allowedRoles = $me['role'] === 'superadmin'
            ? ['admin', 'superadmin', 'member']
            : ['member'];
        if (!in_array($role, $allowedRoles, true)) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions for this role']);
            exit;
        }

        $firstName  = isset($body['first_name']) ? trim((string)$body['first_name']) : null;
        $lastName   = isset($body['last_name'])  ? trim((string)$body['last_name'])  : null;
        if ($firstName === '') $firstName = null;
        if ($lastName  === '') $lastName  = null;

        $birthMonth = isset($body['birth_month']) && $body['birth_month'] !== '' ? (int)$body['birth_month'] : null;
        $birthDay   = isset($body['birth_day'])   && $body['birth_day']   !== '' ? (int)$body['birth_day']   : null;
        if ($birthMonth !== null && ($birthMonth < 1 || $birthMonth > 12)) $birthMonth = null;
        if ($birthDay   !== null && ($birthDay   < 1 || $birthDay   > 31)) $birthDay   = null;
        if ($birthMonth === null || $birthDay === null) { $birthMonth = null; $birthDay = null; }

        $stmt = $pdo->prepare(
            'INSERT INTO admins (email, first_name, last_name, role, created_by, birth_month, birth_day) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$email, $firstName, $lastName, $role, $me['id'], $birthMonth, $birthDay]);

        $newId = (int)$pdo->lastInsertId();
        $response = ['ok' => true, 'id' => $newId];
        if ($role === 'member') {
            $response['welcomeEmailSent'] = sendWelcomeMemberEmail($pdo, $email, $firstName, $me['email']);
        }

        echo json_encode($response);
        exit;
    }

    // PUT — update user profile (admin: members only; superadmin: any user)
    if ($method === 'PUT') {
        $me   = requireAuth($pdo, ['admin', 'superadmin']);
        $body = json_decode(file_get_contents('php://input'), true);

        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid id required']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id, email, role, is_active FROM admins WHERE id = ?');
        $stmt->execute([$id]);
        $target = $stmt->fetch();

        if (!$target || !(bool)$target['is_active']) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            exit;
        }

        if ($me['role'] === 'admin' && $target['role'] !== 'member') {
            http_response_code(403);
            echo json_encode(['error' => 'Can only edit members']);
            exit;
        }

        $email = isset($body['email']) ? trim((string)$body['email']) : (string)$target['email'];
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Valid email required']);
            exit;
        }

        $firstName  = isset($body['first_name']) ? trim((string)$body['first_name']) : null;
        $lastName   = isset($body['last_name'])  ? trim((string)$body['last_name'])  : null;
        if ($firstName === '') $firstName = null;
        if ($lastName  === '') $lastName  = null;

        $birthMonth = isset($body['birth_month']) && $body['birth_month'] !== '' && $body['birth_month'] !== null
            ? (int)$body['birth_month'] : null;
        $birthDay   = isset($body['birth_day'])   && $body['birth_day']   !== '' && $body['birth_day']   !== null
            ? (int)$body['birth_day']   : null;
        if ($birthMonth !== null && ($birthMonth < 1 || $birthMonth > 12)) $birthMonth = null;
        if ($birthDay   !== null && ($birthDay   < 1 || $birthDay   > 31)) $birthDay   = null;
        if ($birthMonth === null || $birthDay === null) { $birthMonth = null; $birthDay = null; }

        $role = (string)$target['role'];
        if ($me['role'] === 'superadmin' && isset($body['role'])) {
            $newRole = trim((string)$body['role']);
            if (!in_array($newRole, ['admin', 'superadmin', 'member'], true)) {
                http_response_code(400);
                echo json_encode(['error' => 'Valid role required']);
                exit;
            }
            if ($id === (int)$me['id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot change your own role']);
                exit;
            }
            $role = $newRole;
        }

        $pdo->prepare(
            'UPDATE admins SET email = ?, first_name = ?, last_name = ?, birth_month = ?, birth_day = ?, role = ? WHERE id = ?'
        )->execute([$email, $firstName, $lastName, $birthMonth, $birthDay, $role, $id]);

        echo json_encode(['ok' => true]);
        exit;
    }

    // PATCH — change a user's role (superadmin only)
    if ($method === 'PATCH') {
        $me   = requireAuth($pdo, ['superadmin']);
        $body = json_decode(file_get_contents('php://input'), true);

        $id   = (int)($body['id']   ?? 0);
        $role = trim((string)($body['role'] ?? ''));

        if ($id <= 0 || !in_array($role, ['admin', 'superadmin', 'member'], true)) {
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
