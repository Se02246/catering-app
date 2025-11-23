-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    pieces_per_kg DECIMAL(10, 2),
    min_order_quantity DECIMAL(10, 2) DEFAULT 1,
    order_increment DECIMAL(10, 2) DEFAULT 1,
    show_servings BOOLEAN DEFAULT FALSE,
    servings_per_unit DECIMAL(10, 2),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Caterings Table (Packages)
CREATE TABLE IF NOT EXISTS caterings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    total_price DECIMAL(10, 2), -- Can be calculated or fixed
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Catering Items (Join table for Packages <-> Products)
CREATE TABLE IF NOT EXISTS catering_items (
    id SERIAL PRIMARY KEY,
    catering_id INTEGER REFERENCES caterings(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 2) NOT NULL, -- Quantity in Kg or Units
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin) - VERY INSECURE, FOR DEMO ONLY
INSERT INTO users (username, password_hash) 
VALUES ('admin', 'admin') 
ON CONFLICT (username) DO NOTHING;
