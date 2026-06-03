<?php
/**
 * Medsuite-eT PostgreSQL/Neon API Configuration
 * Copy to config.php for PostgreSQL backend
 * Format: postgresql://user:password@host:port/dbname
 */
return [
    'db_type' => 'postgresql', // 'mysql' or 'postgresql'
    'db_host' => env('NEON_HOST') ?: 'your-neon-hostname.neon.tech',
    'db_port' => env('NEON_PORT') ?: '5432',
    'db_name' => env('NEON_DB') ?: 'medsuite',
    'db_user' => env('NEON_USER') ?: 'postgres',
    'db_pass' => env('NEON_PASS') ?: '',
    'jwt_secret' => env('JWT_SECRET') ?: 'change-this-to-a-long-random-string',
    'app_version' => '3.0.0',
];

/**
 * Helper function to get environment variables
 */
function env($key, $default = null) {
    return $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key) ?: $default;
}
