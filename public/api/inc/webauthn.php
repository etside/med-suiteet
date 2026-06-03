<?php

declare(strict_types=1);

function webauthn_b64url_encode(string $bin): string
{
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function webauthn_b64url_decode(string $b64url): string
{
    $pad = str_repeat('=', (4 - strlen($b64url) % 4) % 4);
    return base64_decode(strtr($b64url . $pad, '-_', '+/'), true) ?: '';
}

function webauthn_rp_id(): string
{
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $host = preg_replace('/:\d+$/', '', $host);
    if ($host === '127.0.0.1' || $host === '::1') {
        return 'localhost';
    }
    return $host;
}

function webauthn_columns_ready(PDO $pdo): bool
{
    static $ready = null;
    if ($ready !== null) {
        return $ready;
    }
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'biometric_enrolled'");
    $ready = (bool) $stmt->fetch();
    return $ready;
}

function webauthn_require_columns(PDO $pdo): void
{
    if (!webauthn_columns_ready($pdo)) {
        api_error(
            'Biometric auth not installed. Run: mysql ... < public/api/migrations/add_biometric.sql',
            503
        );
    }
}

function webauthn_new_challenge(): string
{
    return webauthn_b64url_encode(random_bytes(32));
}

function webauthn_store_challenge(PDO $pdo, string $userId, string $challenge): void
{
    $expires = date('Y-m-d H:i:s', time() + 300);
    $stmt = $pdo->prepare(
        'UPDATE users SET webauthn_challenge = ?, webauthn_challenge_expires = ? WHERE id = ?'
    );
    $stmt->execute([$challenge, $expires, $userId]);
}

function webauthn_verify_challenge(PDO $pdo, string $userId, string $challengeFromClient): bool
{
    $stmt = $pdo->prepare(
        'SELECT webauthn_challenge, webauthn_challenge_expires FROM users WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['webauthn_challenge'])) {
        return false;
    }
    if (!empty($row['webauthn_challenge_expires']) && strtotime($row['webauthn_challenge_expires']) < time()) {
        return false;
    }
    if (!hash_equals($row['webauthn_challenge'], $challengeFromClient)) {
        return false;
    }
    $pdo->prepare('UPDATE users SET webauthn_challenge = NULL, webauthn_challenge_expires = NULL WHERE id = ?')
        ->execute([$userId]);
    return true;
}

function webauthn_parse_client_data(?string $clientDataJSON_b64url): array
{
    if (!$clientDataJSON_b64url) {
        return [];
    }
    $json = webauthn_b64url_decode($clientDataJSON_b64url);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function webauthn_issue_session(PDO $pdo, array $config, array $userRow): void
{
    $token = create_token((string) $userRow['id'], $config['jwt_secret']);
    $roles = user_roles($pdo, (string) $userRow['id']);
    $prof = $pdo->prepare('SELECT full_name, approval_status FROM profiles WHERE user_id = ?');
    $prof->execute([$userRow['id']]);
    $profile = $prof->fetch() ?: [];
    api_json([
        'data' => [
            'token' => $token,
            'user' => ['id' => $userRow['id'], 'email' => $userRow['email']],
            'roles' => $roles,
            'approval_status' => $profile['approval_status'] ?? 'approved',
            'full_name' => $profile['full_name'] ?? null,
        ],
    ]);
}
