<?php
require_once __DIR__ . '/helpers.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;
$pdo = getDB();

// GET - Next work order number
if ($method === 'GET' && $action === 'next_number') {
    $stmt = $pdo->prepare("SELECT current_value + 1 as next_number FROM sequences WHERE name = 'work_order'");
    $stmt->execute();
    jsonResponse(['next_number' => (int)$stmt->fetchColumn()]);
}

// GET - List or single
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM work_orders_full WHERE unique_id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        if (!$order) jsonResponse(['error' => 'Work order not found'], 404);
        jsonResponse($order);
    }

    $where = [];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[] = "status = ?";
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['customer_id'])) {
        $where[] = "customer_id = ?";
        $params[] = $_GET['customer_id'];
    }
    if (!empty($_GET['search'])) {
        $where[] = "(customer_name LIKE ? OR order_number LIKE ? OR product LIKE ? OR CAST(work_order AS CHAR) LIKE ?)";
        $like = "%" . $_GET['search'] . "%";
        $params = array_merge($params, [$like, $like, $like, $like]);
    }

    $sql = "SELECT * FROM work_orders_full";
    if ($where) {
        $sql .= " WHERE " . implode(' AND ', $where);
    }
    $sql .= " ORDER BY work_order DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

// POST - Create
if ($method === 'POST') {
    $data = getRequestBody();
    $uniqueId = generateShortUuid();
    $workOrderNum = getNextWorkOrderNumber($pdo);

    $stmt = $pdo->prepare("INSERT INTO work_orders (unique_id, work_order, captured_by, status, order_date, customer_id, order_number, product, product_note, product_requested, order_qty, manufactured, note, price, user_changed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $uniqueId,
        $workOrderNum,
        $user['email'],
        $data['status'] ?? 'DRAFT',
        $data['order_date'] ?? date('Y-m-d'),
        $data['customer_id'] ?? null,
        $data['order_number'] ?? null,
        $data['product'] ?? null,
        $data['product_note'] ?? null,
        $data['product_requested'] ?? null,
        $data['order_qty'] ?? 0,
        $data['manufactured'] ?? 0,
        $data['note'] ?? null,
        $data['price'] ?? null,
        $user['email'],
    ]);

    $stmt = $pdo->prepare("SELECT * FROM work_orders_full WHERE unique_id = ?");
    $stmt->execute([$uniqueId]);
    jsonResponse($stmt->fetch(), 201);
}

// PUT - Update
if ($method === 'PUT') {
    if (!$id) jsonResponse(['error' => 'Work order ID required'], 400);

    $data = getRequestBody();
    $fields = [];
    $values = [];

    $allowedFields = ['status', 'order_date', 'customer_id', 'order_number', 'product', 'product_note', 'product_requested', 'order_qty', 'manufactured', 'note', 'price'];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }

    if (empty($fields)) jsonResponse(['error' => 'No fields to update'], 400);

    $fields[] = "user_changed = ?";
    $values[] = $user['email'];
    $values[] = $id;

    $sql = "UPDATE work_orders SET " . implode(', ', $fields) . " WHERE unique_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $stmt = $pdo->prepare("SELECT * FROM work_orders_full WHERE unique_id = ?");
    $stmt->execute([$id]);
    jsonResponse($stmt->fetch());
}

// DELETE
if ($method === 'DELETE') {
    if (!$id) jsonResponse(['error' => 'Work order ID required'], 400);

    $stmt = $pdo->prepare("DELETE FROM work_orders WHERE unique_id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Work order not found'], 404);
    jsonResponse(['message' => 'Work order deleted']);
}

jsonResponse(['error' => 'Method not allowed'], 405);
