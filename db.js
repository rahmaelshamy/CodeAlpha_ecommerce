const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./ecommerce.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      price REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      quantity INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert sample products (only once)
  db.run(`
    INSERT INTO products (name, description, price)
    SELECT 'Laptop', 'Powerful laptop', 15000
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Laptop')
  `);

  db.run(`
    INSERT INTO products (name, description, price)
    SELECT 'Phone', 'Smartphone', 8000
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Phone')
  `);

  db.run(`
    INSERT INTO products (name, description, price)
    SELECT 'Headphones', 'Wireless headphones', 1200
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Headphones')
  `);
});

module.exports = db;