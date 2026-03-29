<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'sagrindi_orders');
define('DB_USER', 'sagrindi_admin');
define('DB_PASS', '');

// JWT configuration
define('JWT_SECRET', 'sag-works-orders-jwt-secret-change-in-production-2024');
define('JWT_EXPIRY', 86400 * 7); // 7 days

// CORS headers
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://orders.sagrinding.co.za',
    'http://orders.sagrinding.co.za',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://orders.sagrinding.co.za");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit();
        }
    }
    return $pdo;
}
