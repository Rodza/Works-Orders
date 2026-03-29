<?php
require_once __DIR__ . '/helpers.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$pdo = getDB();

// GET - List all or single
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE size = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) jsonResponse(['error' => 'Product not found'], 404);
        jsonResponse($product);
    }

    $search = $_GET['search'] ?? '';
    if ($search) {
        $stmt = $pdo->prepare("SELECT * FROM products WHERE size LIKE ? OR product_notes LIKE ? ORDER BY size");
        $like = "%$search%";
        $stmt->execute([$like, $like]);
    } else {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY size");
    }
    jsonResponse($stmt->fetchAll());
}

// POST - Create
if ($method === 'POST') {
    $data = getRequestBody();
    if (empty($data['size'])) jsonResponse(['error' => 'Size is required'], 400);

    $stmt = $pdo->prepare("INSERT INTO products (size, double_labels, mount_up, product_notes, rein_bonded, weight_list) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['size'],
        $data['double_labels'] ?? false,
        $data['mount_up'] ?? false,
        $data['product_notes'] ?? null,
        $data['rein_bonded'] ?? false,
        $data['weight_list'] ?? false,
    ]);

    $stmt = $pdo->prepare("SELECT * FROM products WHERE size = ?");
    $stmt->execute([$data['size']]);
    jsonResponse($stmt->fetch(), 201);
}

// PUT - Update
if ($method === 'PUT') {
    if (!$id) jsonResponse(['error' => 'Product size required'], 400);

    $data = getRequestBody();
    $fields = [];
    $values = [];

    if (isset($data['product_notes'])) {
        $fields[] = "product_notes = ?";
        $values[] = $data['product_notes'];
    }
    foreach (['double_labels', 'mount_up', 'rein_bonded', 'weight_list'] as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $values[] = (bool)$data[$field];
        }
    }

    if (empty($fields)) jsonResponse(['error' => 'No fields to update'], 400);

    $values[] = $id;
    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE size = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $stmt = $pdo->prepare("SELECT * FROM products WHERE size = ?");
    $stmt->execute([$id]);
    jsonResponse($stmt->fetch());
}

// DELETE
if ($method === 'DELETE') {
    if (!$id) jsonResponse(['error' => 'Product size required'], 400);

    try {
        $stmt = $pdo->prepare("DELETE FROM products WHERE size = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Product not found'], 404);
        jsonResponse(['message' => 'Product deleted']);
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            jsonResponse(['error' => 'Cannot delete product with existing work orders'], 409);
        }
        throw $e;
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
