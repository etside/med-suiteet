<?php
/**
 * CLI bulk product import (stdin JSON from scripts/import-med-products.mjs).
 * JSON: { "replace": bool, "products": [ ... ] }
 */
require __DIR__ . '/inc/helpers.php';

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "CLI only\n");
    exit(1);
}

$raw = stream_get_contents(STDIN);
$payload = json_decode($raw, true);
if (!is_array($payload) || !isset($payload['products']) || !is_array($payload['products'])) {
    fwrite(STDERR, "Invalid JSON payload\n");
    exit(1);
}

$config = require __DIR__ . '/config.php';
$dsn = "mysql:host={$config['db_host']};port={$config['db_port']};dbname={$config['db_name']};charset=utf8mb4";
$pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$hasManufacturer = (bool) $pdo->query("SHOW COLUMNS FROM products LIKE 'manufacturer'")->fetch();
if (!$hasManufacturer) {
    $migration = __DIR__ . '/migrations/add_manufacturer.sql';
    if (is_readable($migration)) {
        $sql = file_get_contents($migration);
        foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
            if ($stmt !== '') {
                $pdo->exec($stmt);
            }
        }
        $hasManufacturer = true;
        echo "✓ Applied manufacturer migration\n";
    }
}

$replace = !empty($payload['replace']);
if ($replace) {
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    $pdo->exec('DELETE FROM order_items');
    $pdo->exec('DELETE FROM products');
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    echo "✓ Cleared products table\n";
}

$cols = 'id, name, name_bn, generic_name, category, price, stock, min_stock, batch_number, expiry_date, requires_prescription, description';
$placeholders = '?,?,?,?,?,?,?,?,?,?,?,?';
if ($hasManufacturer) {
    $cols = 'id, name, name_bn, generic_name, manufacturer, category, price, stock, min_stock, batch_number, expiry_date, requires_prescription, description';
    $placeholders = '?,?,?,?,?,?,?,?,?,?,?,?,?';
}

$sql = "INSERT INTO products ($cols) VALUES ($placeholders)";
$stmt = $pdo->prepare($sql);

$imported = 0;
$failed = 0;
$pdo->beginTransaction();
try {
    foreach ($payload['products'] as $p) {
        $name = trim((string) ($p['name'] ?? ''));
        if ($name === '') {
            $failed++;
            continue;
        }
        $params = [
            $p['id'] ?? uuid(),
            $name,
            $p['name_bn'] ?? null,
            $p['generic_name'] ?? null,
        ];
        if ($hasManufacturer) {
            $params[] = $p['manufacturer'] ?? null;
        }
        $params = array_merge($params, [
            $p['category'] ?? null,
            $p['price'] ?? 0,
            $p['stock'] ?? 0,
            $p['min_stock'] ?? 10,
            $p['batch_number'] ?? null,
            !empty($p['expiry_date']) ? $p['expiry_date'] : null,
            !empty($p['requires_prescription']) ? 1 : 0,
            $p['description'] ?? null,
        ]);
        try {
            $stmt->execute($params);
            $imported++;
        } catch (Throwable $e) {
            $failed++;
        }
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, 'Import failed: ' . $e->getMessage() . "\n");
    exit(1);
}

$total = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
echo "✓ Imported $imported rows ($failed failed/skipped in loop)\n";
echo "✓ Total products in database: $total\n";
