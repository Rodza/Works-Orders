<?php
require_once __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && $action === 'login') {
    $data = getRequestBody();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
        jsonResponse(['error' => 'Email and password required'], 400);
    }

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT id, user_name, user_email, password_hash, role, company FROM users WHERE user_email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'Invalid email or password'], 401);
    }

    $token = createJWT([
        'id' => $user['id'],
        'email' => $user['user_email'],
        'name' => $user['user_name'],
        'role' => $user['role'],
        'company' => $user['company'],
    ]);

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['user_name'],
            'email' => $user['user_email'],
            'role' => $user['role'],
            'company' => $user['company'],
        ],
    ]);
}

if ($method === 'POST' && $action === 'verify') {
    $user = requireAuth();
    jsonResponse(['valid' => true, 'user' => $user]);
}

jsonResponse(['error' => 'Invalid action'], 400);
