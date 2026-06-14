<?php
/**
 * Auth middleware — require_once this at the top of every protected endpoint.
 * NOT a public HTTP endpoint itself.
 *
 * Usage:
 *   require_once __DIR__ . '/auth.php';
 *   $admin = requireAuth($pdo);               // any admin role
 *   $admin = requireAuth($pdo, ['superadmin']); // superadmin only
 *   $admin = getAuthenticatedAdmin($pdo, ['member', 'admin', 'superadmin']); // optional
 */

function getBearerToken(): ?string {
    $authHeader = '';
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }
    }
    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (preg_match('/^Bearer\s+(.+)$/i', trim($authHeader), $matches)) {
        return $matches[1];
    }
    return null;
}

function getAuthenticatedAdmin(PDO $pdo, array $roles): ?array {
    $token = getBearerToken();
    if (empty($token)) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT a.id, a.email, a.role
         FROM auth_sessions s
         JOIN admins a ON a.id = s.admin_id
         WHERE s.token = ?
           AND s.expires_at > NOW()
           AND a.is_active = 1
         LIMIT 1'
    );
    $stmt->execute([$token]);
    $admin = $stmt->fetch();

    if (!$admin || !in_array($admin['role'], $roles, true)) {
        return null;
    }

    return $admin;
}

function requireAuth(PDO $pdo, array $roles = ['admin', 'superadmin']): array {
    $token = getBearerToken();

    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $stmt = $pdo->prepare(
        'SELECT a.id, a.email, a.role
         FROM auth_sessions s
         JOIN admins a ON a.id = s.admin_id
         WHERE s.token = ?
           AND s.expires_at > NOW()
           AND a.is_active = 1
         LIMIT 1'
    );
    $stmt->execute([$token]);
    $admin = $stmt->fetch();

    if (!$admin) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    if (!in_array($admin['role'], $roles, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    return $admin;
}
