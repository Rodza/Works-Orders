-- SA Grinding Wheels CC - Works Orders Database Schema
-- Database: sagrindi_orders

-- Drop tables if exist (in correct order for FK constraints)
DROP TABLE IF EXISTS work_orders;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS sequences;

-- CUSTOMERS TABLE
CREATE TABLE customers (
    customer_id CHAR(8) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    own_label BOOLEAN DEFAULT FALSE,
    courier BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PRODUCTS TABLE
CREATE TABLE products (
    size VARCHAR(100) PRIMARY KEY,
    double_labels BOOLEAN DEFAULT FALSE,
    mount_up BOOLEAN DEFAULT FALSE,
    product_notes TEXT,
    rein_bonded BOOLEAN DEFAULT FALSE,
    weight_list BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USERS TABLE
CREATE TABLE users (
    id CHAR(8) PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'USER', 'CUSTOMER') NOT NULL DEFAULT 'USER',
    company CHAR(8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_company
        FOREIGN KEY (company) REFERENCES customers(customer_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEQUENCES TABLE (for auto-increment work order numbers)
CREATE TABLE sequences (
    name VARCHAR(50) PRIMARY KEY,
    current_value INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO sequences (name, current_value) VALUES ('work_order', 14076);

-- WORK_ORDERS TABLE
CREATE TABLE work_orders (
    unique_id CHAR(8) PRIMARY KEY,
    work_order INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    captured_by VARCHAR(255),
    status ENUM('DRAFT', 'OPEN', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    order_date DATE,
    customer_id CHAR(8),
    order_number VARCHAR(50),
    product VARCHAR(100),
    product_note TEXT,
    product_requested TEXT,
    order_qty INT DEFAULT 0,
    manufactured INT DEFAULT 0,
    remaining INT AS (order_qty - manufactured) VIRTUAL,
    note TEXT,
    price DECIMAL(12,2),
    last_amend DATETIME,
    user_changed VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_workorders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_workorders_product
        FOREIGN KEY (product) REFERENCES products(size)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_work_order (work_order),
    INDEX idx_status (status),
    INDEX idx_customer (customer_id),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VIEW: work_orders_full (with joined lookup data)
CREATE OR REPLACE VIEW work_orders_full AS
SELECT
    wo.unique_id,
    wo.work_order,
    wo.timestamp,
    wo.captured_by,
    wo.status,
    wo.order_date,
    wo.customer_id,
    c.customer_name,
    c.own_label AS customer_own_label,
    c.courier AS customer_courier,
    wo.order_number,
    wo.product,
    p.product_notes AS product_info,
    p.mount_up,
    p.double_labels,
    p.weight_list,
    wo.product_note,
    wo.product_requested,
    wo.order_qty,
    wo.manufactured,
    wo.remaining,
    wo.note,
    wo.price,
    wo.last_amend,
    wo.user_changed,
    wo.created_at,
    wo.updated_at
FROM work_orders wo
LEFT JOIN customers c ON wo.customer_id = c.customer_id
LEFT JOIN products p ON wo.product = p.size;

-- FUNCTION: Generate 8-char UUID
DELIMITER //
CREATE FUNCTION generate_short_uuid()
RETURNS CHAR(8)
DETERMINISTIC
BEGIN
    RETURN LOWER(SUBSTR(REPLACE(UUID(), '-', ''), 1, 8));
END //
DELIMITER ;

-- TRIGGER: Auto-generate unique_id for work_orders
DELIMITER //
CREATE TRIGGER before_insert_work_orders
BEFORE INSERT ON work_orders
FOR EACH ROW
BEGIN
    IF NEW.unique_id IS NULL OR NEW.unique_id = '' THEN
        SET NEW.unique_id = generate_short_uuid();
    END IF;
    SET NEW.last_amend = NOW();
END //
DELIMITER ;

-- TRIGGER: Update last_amend on work_orders update
DELIMITER //
CREATE TRIGGER before_update_work_orders
BEFORE UPDATE ON work_orders
FOR EACH ROW
BEGIN
    SET NEW.last_amend = NOW();
END //
DELIMITER ;
