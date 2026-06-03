<?php
/**
 * Medsuite-eT — PostgreSQL/Neon REST API
 * Supports both MySQL and PostgreSQL backends
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/inc/helpers.php';

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    api_json([
        'error' => 'API not configured. Copy config.example.php or config.neon.php to config.php.',
        'status' => 503,
    ], 503);
}

$config = require $configPath;
$db_type = $config['db_type'] ?? 'mysql';

if (empty($config['jwt_secret'])) {
    $config['jwt_secret'] = 'medsuite-et-dev-secret-change-in-production';
}

try {
    if ($db_type === 'postgresql') {
        // PostgreSQL/Neon Connection
        $dsn = "pgsql:host={$config['db_host']};port={$config['db_port']};dbname={$config['db_name']};sslmode=require";
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } else {
        // MySQL Connection (default)
        $dsn = "mysql:host={$config['db_host']};port={$config['db_port']};dbname={$config['db_name']};charset=utf8mb4";
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
} catch (PDOException $e) {
    api_json(['error' => 'Database connection failed: ' . $e->getMessage(), 'status' => 500], 500);
}

$action = $_GET['action'] ?? 'health';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        case 'health':
            api_json([
                'status' => 'ok',
                'service' => 'Medsuite-eT REST API',
                'version' => '3.0.0',
                'database' => $db_type,
                'timestamp' => date('c'),
            ]);

        // ——— Auth Endpoints ———
        case 'auth_login':
            if ($method !== 'POST') {
                api_error('POST required', 405);
            }
            $body = api_body();
            $email = trim($body['email'] ?? '');
            $password = $body['password'] ?? '';
            
            if ($email === '' || $password === '') {
                api_error('Email and password required');
            }
            
            $stmt = $pdo->prepare('SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([strtolower($email)]);
            $row = $stmt->fetch();
            
            if (!$row || !password_verify($password, $row['password_hash'])) {
                // Log failed attempt
                log_auth_attempt($pdo, ['email' => $email, 'method' => 'password', 'success' => false]);
                api_error('Invalid email or password', 401);
            }
            
            // Log successful attempt
            log_auth_attempt($pdo, ['email' => $email, 'method' => 'password', 'success' => true, 'user_id' => $row['id']]);
            
            $token = create_token($row['id'], $config['jwt_secret']);
            $roles = user_roles($pdo, $row['id']);
            
            $prof = $pdo->prepare('SELECT full_name FROM profiles WHERE user_id = ?');
            $prof->execute([$row['id']]);
            $profile = $prof->fetch() ?: [];
            
            api_json([
                'data' => [
                    'user_id' => (int) $row['id'],
                    'email' => $row['email'],
                    'name' => $profile['full_name'] ?? 'User',
                    'roles' => $roles,
                    'token' => $token,
                    'expires_in' => 86400,
                ],
            ]);

        case 'auth_pin':
            if ($method !== 'POST') {
                api_error('POST required', 405);
            }
            $body = api_body();
            $email = trim($body['email'] ?? '');
            $pin = $body['pin'] ?? '';
            
            if ($email === '' || $pin === '') {
                api_error('Email and PIN required');
            }
            
            $stmt = $pdo->prepare('SELECT id, email, pin_hash, pin_locked_until FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([strtolower($email)]);
            $row = $stmt->fetch();
            
            if (!$row) {
                api_error('User not found', 401);
            }
            
            // Check if PIN is locked
            if ($row['pin_locked_until']) {
                $locked_until = strtotime($row['pin_locked_until']);
                if (time() < $locked_until) {
                    api_error('PIN locked. Try again later.', 429);
                }
            }
            
            if (!$row['pin_hash'] || !password_verify($pin, $row['pin_hash'])) {
                log_auth_attempt($pdo, ['email' => $email, 'method' => 'pin', 'success' => false]);
                api_error('Invalid PIN', 401);
            }
            
            log_auth_attempt($pdo, ['email' => $email, 'method' => 'pin', 'success' => true, 'user_id' => $row['id']]);
            
            $token = create_token($row['id'], $config['jwt_secret']);
            $roles = user_roles($pdo, $row['id']);
            
            $prof = $pdo->prepare('SELECT full_name FROM profiles WHERE user_id = ?');
            $prof->execute([$row['id']]);
            $profile = $prof->fetch() ?: [];
            
            api_json([
                'data' => [
                    'user_id' => (int) $row['id'],
                    'email' => $row['email'],
                    'name' => $profile['full_name'] ?? 'User',
                    'roles' => $roles,
                    'token' => $token,
                    'expires_in' => 86400,
                ],
            ]);

        case 'auth_biometric':
            if ($method !== 'POST') {
                api_error('POST required', 405);
            }
            $body = api_body();
            $credential = $body['credential'] ?? null;
            $email = $body['email'] ?? '';
            
            if (!$credential || $email === '') {
                api_error('Biometric credential and email required');
            }
            
            $stmt = $pdo->prepare('SELECT id, email, biometric_enrolled FROM users WHERE email = ? LIMIT 1');
            $stmt->execute([strtolower($email)]);
            $row = $stmt->fetch();
            
            if (!$row || !$row['biometric_enrolled']) {
                api_error('Biometric not enrolled for this user', 401);
            }
            
            // Verify WebAuthn credential (simplified)
            // In production, use webauthn library
            log_auth_attempt($pdo, ['email' => $email, 'method' => 'biometric', 'success' => true, 'user_id' => $row['id']]);
            
            $token = create_token($row['id'], $config['jwt_secret']);
            $roles = user_roles($pdo, $row['id']);
            
            $prof = $pdo->prepare('SELECT full_name FROM profiles WHERE user_id = ?');
            $prof->execute([$row['id']]);
            $profile = $prof->fetch() ?: [];
            
            api_json([
                'data' => [
                    'user_id' => (int) $row['id'],
                    'email' => $row['email'],
                    'name' => $profile['full_name'] ?? 'User',
                    'roles' => $roles,
                    'token' => $token,
                    'expires_in' => 86400,
                ],
            ]);

        case 'auth_enroll_biometric':
            if ($method !== 'POST') {
                api_error('POST required', 405);
            }
            $user = verify_token($pdo, get_bearer_token(), $config['jwt_secret']);
            if (!$user) {
                api_error('Unauthorized', 401);
            }
            
            $body = api_body();
            $credential = json_encode($body['credential'] ?? []);
            
            $stmt = $pdo->prepare('UPDATE users SET biometric_enrolled = true, biometric_data = ? WHERE id = ?');
            $stmt->execute([$credential, $user['id']]);
            
            api_json(['data' => ['success' => true, 'message' => 'Biometric enrolled']]);

        case 'auth_set_pin':
            if ($method !== 'POST') {
                api_error('POST required', 405);
            }
            $user = verify_token($pdo, get_bearer_token(), $config['jwt_secret']);
            if (!$user) {
                api_error('Unauthorized', 401);
            }
            
            $body = api_body();
            $current_password = $body['current_password'] ?? '';
            $new_pin = $body['new_pin'] ?? '';
            
            if ($current_password === '' || $new_pin === '') {
                api_error('Current password and new PIN required');
            }
            
            // Verify current password
            $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
            $stmt->execute([$user['id']]);
            $userRow = $stmt->fetch();
            
            if (!$userRow || !password_verify($current_password, $userRow['password_hash'])) {
                api_error('Invalid password', 401);
            }
            
            $pin_hash = password_hash($new_pin, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE users SET pin_hash = ? WHERE id = ?');
            $stmt->execute([$pin_hash, $user['id']]);
            
            api_json(['data' => ['success' => true, 'message' => 'PIN set successfully']]);

        case 'auth_logs':
            $user = verify_token($pdo, get_bearer_token(), $config['jwt_secret']);
            if (!$user) {
                api_error('Unauthorized', 401);
            }
            
            $limit = (int) ($_GET['limit'] ?? 50);
            $stmt = $pdo->prepare('SELECT * FROM auth_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?');
            $stmt->execute([$user['id'], $limit]);
            $logs = $stmt->fetchAll();
            
            api_json(['data' => $logs]);

        // ——— CMS Endpoints ———
        case 'cms_content':
            if ($method === 'GET') {
                $category = $_GET['category'] ?? null;
                $status = $_GET['status'] ?? 'published';
                $page = (int) ($_GET['page'] ?? 1);
                $limit = (int) ($_GET['limit'] ?? 10);
                $offset = ($page - 1) * $limit;
                
                $query = 'SELECT * FROM cms_content WHERE status = ?';
                $params = [$status];
                
                if ($category) {
                    $query .= ' AND category = ?';
                    $params[] = $category;
                }
                
                $query .= ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
                $params[] = $limit;
                $params[] = $offset;
                
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $content = $stmt->fetchAll();
                
                api_json(['data' => $content]);
            } else if ($method === 'POST') {
                $user = verify_token($pdo, get_bearer_token(), $config['jwt_secret']);
                if (!$user || !is_admin($pdo, $user['id'])) {
                    api_error('Admin access required', 403);
                }
                
                $body = api_body();
                $stmt = $pdo->prepare('
                    INSERT INTO cms_content (title, slug, content, category, status, excerpt, author_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([
                    $body['title'],
                    $body['slug'],
                    $body['content'],
                    $body['category'],
                    $body['status'] ?? 'draft',
                    $body['excerpt'] ?? '',
                    $user['id']
                ]);
                
                api_json(['data' => ['id' => $pdo->lastInsertId()]]);
            }
            break;

        // ——— Dashboard Endpoints ———
        case 'dashboard':
            $user = verify_token($pdo, get_bearer_token(), $config['jwt_secret']);
            if (!$user) {
                api_error('Unauthorized', 401);
            }
            
            // Today's sales
            $today = date('Y-m-d');
            $stmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE DATE(created_at) = ? AND user_id = ?');
            $stmt->execute([$today, $user['id']]);
            $today_sales = (float) $stmt->fetch()['total'];
            
            // Total products
            $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM products');
            $stmt->execute();
            $total_products = (int) $stmt->fetch()['count'];
            
            // Pending orders
            $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?');
            $stmt->execute(['pending']);
            $pending_orders = (int) $stmt->fetch()['count'];
            
            // Low stock alerts
            $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM products WHERE quantity < min_quantity');
            $stmt->execute();
            $low_stock = (int) $stmt->fetch()['count'];
            
            api_json([
                'data' => [
                    'today_sales' => $today_sales,
                    'total_products' => $total_products,
                    'pending_orders' => $pending_orders,
                    'low_stock_alerts' => $low_stock,
                ],
            ]);

        default:
            api_error('Unknown action', 404);
    }
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    api_json(['error' => 'Server error', 'status' => 500], 500);
}

/**
 * Helper: Log authentication attempts
 */
function log_auth_attempt($pdo, $data) {
    try {
        $stmt = $pdo->prepare('
            INSERT INTO auth_logs (user_id, auth_method, ip_address, success)
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['user_id'] ?? null,
            $data['method'] ?? 'unknown',
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            $data['success'] ? 1 : 0,
        ]);
    } catch (Exception $e) {
        // Silently fail logging
    }
}

/**
 * Helper: Check if user is admin
 */
function is_admin($pdo, $user_id) {
    $stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $row = $stmt->fetch();
    return $row && in_array($row['role'], ['admin', 'super_admin']);
}
