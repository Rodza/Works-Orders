<?php
require_once __DIR__ . '/helpers.php';

$currentUser = requireAdmin();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$pdo = getDB();

// GET - List all
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT id, user_name, user_email, role, company, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        if (!$user) jsonResponse(['error' => 'User not found'], 404);
        jsonResponse($user);
    }

    $stmt = $pdo->query("SELECT id, user_name, user_email, role, company, created_at, updated_at FROM users ORDER BY user_name");
    jsonResponse($stmt->fetchAll());
}

// POST - Create
if ($method === 'POST') {
    $data = getRequestBody();

    if (empty($data['user_email']) || empty($data['password']) || empty($data['user_name'])) {
        jsonResponse(['error' => 'Name, email, and password are required'], 400);
    }

    $userId = generateShortUuid();
    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (id, user_name, user_email, password_hash, role, company) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $data['user_name'],
            $data['user_email'],
            $passwordHash,
            $data['role'] ?? 'USER',
            $data['company'] ?? null,
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            jsonResponse(['error' => 'Email already exists'], 409);
        }
        throw $e;
    }

    $stmt = $pdo->prepare("SELECT id, user_name, user_email, role, company, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    jsonResponse($stmt->fetch(), 201);
}

// PUT - Update
if ($method === 'PUT') {
    if (!$id) jsonResponse(['error' => 'User ID required'], 400);

    $data = getRequestBody();
    $fields = [];
    $values = [];

    foreach (['user_name', 'user_email', 'role', 'company'] as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }

    if (!empty($data['password'])) {
        $fields[] = "password_hash = ?";
        $values[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    if (empty($fields)) jsonResponse(['error' => 'No fields to update'], 400);

    $values[] = $id;

    try {
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            jsonResponse(['error' => 'Email already exists'], 409);
        }
        throw $e;
    }

    $stmt = $pdo->prepare("SELECT id, user_name, user_email, role, company, created_at, updated_at FROM users WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse($stmt->fetch());
}

// DELETE
if ($method === 'DELETE') {
    if (!$id) jsonResponse(['error' => 'User ID required'], 400);

    if ($id === $currentUser['id']) {
        jsonResponse(['error' => 'Cannot delete your own account'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonResponse(['error' => 'User not found'], 404);
    jsonResponse(['message' => 'User deleted']);
}

jsonResponse(['error' => 'Method not allowed'], 405);
