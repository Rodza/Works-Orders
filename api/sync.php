<?php
require_once __DIR__ . '/helpers.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDB();

// GET - Get changes since timestamp
if ($method === 'GET') {
    $since = $_GET['since'] ?? '1970-01-01 00:00:00';

    $result = [];

    $stmt = $pdo->prepare("SELECT * FROM customers WHERE updated_at > ?");
    $stmt->execute([$since]);
    $result['customers'] = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT * FROM products WHERE updated_at > ?");
    $stmt->execute([$since]);
    $result['products'] = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT * FROM work_orders_full WHERE updated_at > ?");
    $stmt->execute([$since]);
    $result['work_orders'] = $stmt->fetchAll();

    $result['timestamp'] = date('Y-m-d H:i:s');

    jsonResponse($result);
}

// POST - Bulk sync offline changes
if ($method === 'POST') {
    $data = getRequestBody();
    $changes = $data['changes'] ?? [];
    $results = ['success' => [], 'errors' => []];

    foreach ($changes as $change) {
        $table = $change['table'] ?? '';
        $action = $change['action'] ?? '';
        $record = $change['data'] ?? [];

        try {
            switch ($table) {
                case 'work_orders':
                    syncWorkOrder($pdo, $action, $record, $user);
                    break;
                case 'customers':
                    syncCustomer($pdo, $action, $record);
                    break;
                case 'products':
                    syncProduct($pdo, $action, $record);
                    break;
                default:
                    throw new Exception("Unknown table: $table");
            }
            $results['success'][] = [
                'table' => $table,
                'action' => $action,
                'id' => $record['id'] ?? $record['unique_id'] ?? $record['customer_id'] ?? $record['size'] ?? null,
            ];
        } catch (Exception $e) {
            $results['errors'][] = [
                'table' => $table,
                'action' => $action,
                'error' => $e->getMessage(),
            ];
        }
    }

    // Return latest data
    $stmt = $pdo->query("SELECT * FROM customers ORDER BY customer_name");
    $results['customers'] = $stmt->fetchAll();

    $stmt = $pdo->query("SELECT * FROM products ORDER BY size");
    $results['products'] = $stmt->fetchAll();

    $stmt = $pdo->query("SELECT * FROM work_orders_full ORDER BY work_order DESC");
    $results['work_orders'] = $stmt->fetchAll();

    $results['timestamp'] = date('Y-m-d H:i:s');

    jsonResponse($results);
}

function syncWorkOrder(PDO $pdo, string $action, array $data, array $user): void {
    if ($action === 'create') {
        $uniqueId = $data['unique_id'] ?? generateShortUuid();
        $workOrderNum = getNextWorkOrderNumber($pdo);

        $stmt = $pdo->prepare("INSERT INTO work_orders (unique_id, work_order, captured_by, status, order_date, customer_id, order_number, product, product_note, product_requested, order_qty, manufactured, note, price, user_changed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $uniqueId, $workOrderNum, $user['email'],
            $data['status'] ?? 'DRAFT', $data['order_date'] ?? date('Y-m-d'),
            $data['customer_id'] ?? null, $data['order_number'] ?? null,
            $data['product'] ?? null, $data['product_note'] ?? null,
            $data['product_requested'] ?? null, $data['order_qty'] ?? 0,
            $data['manufactured'] ?? 0, $data['note'] ?? null,
            $data['price'] ?? null, $user['email'],
        ]);
    } elseif ($action === 'update') {
        // Server wins: check last_amend
        $stmt = $pdo->prepare("SELECT last_amend FROM work_orders WHERE unique_id = ?");
        $stmt->execute([$data['unique_id']]);
        $serverAmend = $stmt->fetchColumn();

        if ($serverAmend && isset($data['last_amend']) && $serverAmend > $data['last_amend']) {
            return; // Server version is newer, skip
        }

        $fields = ['status', 'order_date', 'customer_id', 'order_number', 'product', 'product_note', 'product_requested', 'order_qty', 'manufactured', 'note', 'price'];
        $setClauses = [];
        $values = [];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $setClauses[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if ($setClauses) {
            $setClauses[] = "user_changed = ?";
            $values[] = $user['email'];
            $values[] = $data['unique_id'];
            $sql = "UPDATE work_orders SET " . implode(', ', $setClauses) . " WHERE unique_id = ?";
            $pdo->prepare($sql)->execute($values);
        }
    } elseif ($action === 'delete') {
        $pdo->prepare("DELETE FROM work_orders WHERE unique_id = ?")->execute([$data['unique_id']]);
    }
}

function syncCustomer(PDO $pdo, string $action, array $data): void {
    if ($action === 'create') {
        $stmt = $pdo->prepare("INSERT INTO customers (customer_id, customer_name, email, own_label, courier) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['customer_id'] ?? generateShortUuid(),
            $data['customer_name'], $data['email'] ?? null,
            $data['own_label'] ?? false, $data['courier'] ?? false,
        ]);
    } elseif ($action === 'update') {
        $stmt = $pdo->prepare("UPDATE customers SET customer_name = ?, email = ?, own_label = ?, courier = ? WHERE customer_id = ?");
        $stmt->execute([
            $data['customer_name'], $data['email'] ?? null,
            $data['own_label'] ?? false, $data['courier'] ?? false,
            $data['customer_id'],
        ]);
    } elseif ($action === 'delete') {
        $pdo->prepare("DELETE FROM customers WHERE customer_id = ?")->execute([$data['customer_id']]);
    }
}

function syncProduct(PDO $pdo, string $action, array $data): void {
    if ($action === 'create') {
        $stmt = $pdo->prepare("INSERT INTO products (size, double_labels, mount_up, product_notes, rein_bonded, weight_list) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['size'], $data['double_labels'] ?? false,
            $data['mount_up'] ?? false, $data['product_notes'] ?? null,
            $data['rein_bonded'] ?? false, $data['weight_list'] ?? false,
        ]);
    } elseif ($action === 'update') {
        $stmt = $pdo->prepare("UPDATE products SET double_labels = ?, mount_up = ?, product_notes = ?, rein_bonded = ?, weight_list = ? WHERE size = ?");
        $stmt->execute([
            $data['double_labels'] ?? false, $data['mount_up'] ?? false,
            $data['product_notes'] ?? null, $data['rein_bonded'] ?? false,
            $data['weight_list'] ?? false, $data['size'],
        ]);
    } elseif ($action === 'delete') {
        $pdo->prepare("DELETE FROM products WHERE size = ?")->execute([$data['size']]);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
