const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "X7s8h8rd.com",
    database: "sevamitra"
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(3000, () => {
    console.log('Server running at http://127.0.0.1:3000');
});

// JWT Secret
const JWT_SECRET = "sevamitra_secret_123"; 

// Middleware: Authenticate JWT
function authenticateToken(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid token" });
        req.user = user; // attach user info
        next();
    });
}

// ========================= AUTH =========================

// Signup
app.post("/api/signup", (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Name, email, and password required" });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 8);

    const sql = "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, phone, hashedPassword], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Signup failed" });
        }
        res.json({ success: true, message: "User registered successfully" });
    });
});

// Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "DB Error" });
        if (results.length === 0) return res.status(400).json({ success: false, message: "User not found" });

        const user = results[0];

        // Compare password
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ success: false, message: "Invalid password" });

        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });

        res.json({ success: true, message: "Login successful", token });
    });
});

// ========================= BOOKINGS =========================

// Booking API (Protected)
app.post("/api/book", authenticateToken, (req, res) => {
    const { service, datetime, address } = req.body;

    if (!service || !datetime || !address) {
        return res.status(400).json({ success: false, message: "All fields required" });
    }

    const sql = "INSERT INTO bookings (user_id, service_id, booking_date, status) VALUES (?, ?, ?, 'pending')";
    db.query(sql, [req.user.id, service, datetime], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "DB Error" });
        }
        res.json({ success: true, message: "Booking created!", bookingId: result.insertId });
    });
});

// ========================= SERVER =========================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});

// -------------------- GET ROUTES --------------------

// 1️⃣ Get all services
app.get('/services', (req, res) => {
  const query = 'SELECT * FROM services';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch services' });
    res.json(results);
  });
});

// 2️⃣ Get bookings for a user
app.get('/bookings/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = `
    SELECT b.id, s.name AS service_name, b.booking_date, b.status
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.user_id = ?`;
  
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch bookings' });
    res.json(results);
  });
});

// 3️⃣ Get earnings for a user (based on their bookings)
app.get('/earnings/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = `
    SELECT e.id, e.amount, e.earned_at, s.name AS service_name
    FROM earnings e
    JOIN bookings b ON e.booking_id = b.id
    JOIN services s ON b.service_id = s.id
    WHERE b.user_id = ?`;
  
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch earnings' });
    res.json(results);
  });
});

// 4️⃣ Get profile for a user
app.get('/profiles/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT * FROM profiles WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch profile' });
    if (results.length > 0) res.json(results[0]);
    else res.json({ message: 'Profile not found' });
  });
});

// Fetch all bookings
app.get('/bookings', (req, res) => {
    const sql = 'SELECT * FROM bookings ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        res.json(results); // send JSON data to client
    });
});

