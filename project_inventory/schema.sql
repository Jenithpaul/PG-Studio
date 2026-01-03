-- Inventory Management System
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location TEXT
);

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255)
);

CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity_on_hand INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id),
    from_warehouse_id INTEGER REFERENCES warehouses(id),
    to_warehouse_id INTEGER REFERENCES warehouses(id),
    quantity INTEGER NOT NULL,
    movement_type VARCHAR(20) CHECK (movement_type IN ('in', 'out', 'transfer')),
    moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
