<?php
require_once __DIR__ . '/helpers.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$pdo = getDB();

// GET - List all or single
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        if (!$customer) jsonResponse(['error' => 'Customer not found'], 404);
        jsonResponse($customer);
    }

    $search = $_GET['search'] ?? '';
    if ($search) {
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE customer_name LIKE ? OR email LIKE ? ORDER BY customer_name");
        $like = "%$search%";
        $stmt->execute([$like, $like]);
    } else {
        $stmt = $pdo->query("SELECT * FROM customers ORDER BY customer_name");
    }
    jsonResponse($stmt->fetchAll());
}

// POST - Create
if ($method === 'POST') {
    $data = getRequestBody();
    $customerId = generateShortUuid();

    $stmt = $pdo->prepare("INSERT INTO customers (customer_id, customer_name, email, own_label, courier) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $customerId,
        $data['customer_name'] ?? '',
        $data['email'] ?? null,
        $data['own_label'] ?? false,
        $data['courier'] ?? false,
    ]);

    $stmt = $pdo->prepare("SELECT * FROM customers WHERE customer_id = ?");
    $stmt->execute([$customerId]);
    jsonResponse($stmt->fetch(), 201);
}

// PUT - Update
if ($method === 'PUT') {
    if (!$id) jsonResponse(['error' => 'Customer ID required'], 400);

    $data = getRequestBody();
    $fields = [];
    $values = [];

    foreach (['customer_name', 'email'] as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    foreach (['own_label', 'courier'] as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $values[] = (bool)$data[$field];
        }
    }

    if (empty($fields)) jsonResponse(['error' => 'No fields to update'], 400);

    $values[] = $id;
    $sql = "UPDATE customers SET " . implode(', ', $fields) . " WHERE customer_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $stmt = $pdo->prepare("SELECT * FROM customers WHERE customer_id = ?");
    $stmt->execute([$id]);
    jsonResponse($stmt->fetch());
}

// DELETE
if ($method === 'DELETE') {
    if (!$id) jsonResponse(['error' => 'Customer ID required'], 400);

    try {
        $stmt = $pdo->prepare("DELETE FROM customers WHERE customer_id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Customer not found'], 404);
        jsonResponse(['message' => 'Customer deleted']);
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            jsonResponse(['error' => 'Cannot delete customer with existing work orders'], 409);
        }
        throw $e;
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
