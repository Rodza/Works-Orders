<?php
require_once __DIR__ . '/config.php';

// Generate 8-character unique ID
function generateShortUuid(): string {
    return substr(str_replace('-', '', sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    )), 0, 8);
}

// JSON response helper
function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

// Get request body as JSON
function getRequestBody(): array {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return $data ?? [];
}

// Get next work order number (atomic)
function getNextWorkOrderNumber(PDO $pdo): int {
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT current_value FROM sequences WHERE name = 'work_order' FOR UPDATE");
        $stmt->execute();
        $current = $stmt->fetchColumn();

        $next = $current + 1;

        $stmt = $pdo->prepare("UPDATE sequences SET current_value = ? WHERE name = 'work_order'");
        $stmt->execute([$next]);

        $pdo->commit();
        return $next;
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// JWT Functions
function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function createJWT(array $payload): string {
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

    $payload['exp'] = $payload['exp'] ?? (time() + JWT_EXPIRY);
    $payload['iat'] = time();
    $payloadEncoded = base64UrlEncode(json_encode($payload));

    $signature = base64UrlEncode(
        hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true)
    );

    return "$header.$payloadEncoded.$signature";
}

function verifyJWT(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $signature] = $parts;

    $expectedSignature = base64UrlEncode(
        hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
    );

    if (!hash_equals($expectedSignature, $signature)) return null;

    $data = json_decode(base64UrlDecode($payload), true);
    if (!$data) return null;

    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

// Auth middleware - returns user data or sends 401
function requireAuth(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        jsonResponse(['error' => 'Authorization token required'], 401);
    }

    $user = verifyJWT($matches[1]);
    if (!$user) {
        jsonResponse(['error' => 'Invalid or expired token'], 401);
    }

    return $user;
}

// Admin middleware
function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'ADMIN') {
        jsonResponse(['error' => 'Admin access required'], 403);
    }
    return $user;
}
