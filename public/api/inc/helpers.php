<?php

function api_json($payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function api_error(string $message, int $status = 400): void
{
    api_json(['error' => $message, 'status' => $status], $status);
}

function api_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function uuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
        return trim($m[1]);
    }
    return null;
}

function create_token(string $userId, string $secret, int $ttl = 604800): string
{
    $payload = base64_encode(json_encode([
        'sub' => $userId,
        'exp' => time() + $ttl,
    ]));
    $sig = hash_hmac('sha256', $payload, $secret);
    return $payload . '.' . $sig;
}

function verify_token(string $token, string $secret): ?string
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return null;
    }
    [$payload, $sig] = $parts;
    if (!hash_equals(hash_hmac('sha256', $payload, $secret), $sig)) {
        return null;
    }
    $data = json_decode(base64_decode($payload, true), true);
    if (!is_array($data) || empty($data['sub']) || empty($data['exp']) || $data['exp'] < time()) {
        return null;
    }
    return (string) $data['sub'];
}

function current_user_id(PDO $pdo, array $config): ?string
{
    $token = bearer_token();
    if (!$token) {
        return null;
    }
    return verify_token($token, $config['jwt_secret'] ?? 'change-me-in-config');
}

function user_roles(PDO $pdo, string $userId): array
{
    $stmt = $pdo->prepare('SELECT role FROM user_roles WHERE user_id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
}

function require_auth(PDO $pdo, array $config): string
{
    $userId = current_user_id($pdo, $config);
    if (!$userId) {
        api_error('Unauthorized', 401);
    }
    return $userId;
}

function require_roles(PDO $pdo, string $userId, array $allowed): void
{
    $roles = user_roles($pdo, $userId);
    if (!array_intersect($roles, $allowed)) {
        api_error('Forbidden', 403);
    }
}

function is_staff_role(array $roles): bool
{
    return (bool) array_intersect($roles, ['staff', 'admin', 'super_admin']);
}
