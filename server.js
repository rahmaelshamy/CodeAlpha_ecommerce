const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 5001;
const SECRET_KEY = "secret";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Register
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username,email,password) VALUES (?,?,?)`,
    [username, email, hash],
    function (err) {
      if (err) return res.json({ message: "User exists" });
      res.json({ message: "Registered" });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email=?`, [email], async (err, user) => {
    if (!user) {
      return res.json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY);
    res.json({ token });
  });
});

// Products
app.get("/products", (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    res.json(rows);
  });
});

app.get("/products/:id", (req, res) => {
  db.get(`SELECT * FROM products WHERE id=?`, [req.params.id], (err, row) => {
    res.json(row);
  });
});

// Cart
app.post("/cart", auth, (req, res) => {
  const { product_id, quantity } = req.body;

  db.run(
    `INSERT INTO cart (user_id, product_id, quantity) VALUES (?,?,?)`,
    [req.user.id, product_id, quantity],
    () => res.json({ message: "Added to cart" })
  );
});

app.get("/cart", auth, (req, res) => {
  db.all(
    `SELECT cart.*, products.name, products.price
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE user_id=?`,
    [req.user.id],
    (err, rows) => res.json(rows)
  );
});

// Order
app.post("/order", auth, (req, res) => {
  db.all(`SELECT * FROM cart WHERE user_id=?`, [req.user.id], (err, items) => {
    let total = 0;
    items.forEach(i => total += i.quantity * 100); // simple calc

    db.run(
      `INSERT INTO orders (user_id,total) VALUES (?,?)`,
      [req.user.id, total],
      () => {
        db.run(`DELETE FROM cart WHERE user_id=?`, [req.user.id]);
        res.json({ message: "Order placed" });
      }
    );
  });
});

app.listen(PORT, () => console.log("Server on http://localhost:" + PORT));