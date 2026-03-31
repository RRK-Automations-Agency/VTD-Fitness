const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(session({
  secret: 'vtd-fitness-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// --- AUTH API ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ success: true, role: user.role });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, role: req.session.role });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.session.role === 'admin') next();
  else res.status(403).json({ message: 'Forbidden' });
};

// --- DATA SUBMISSION (Public) ---
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message, type } = req.body;
  const stmt = db.prepare('INSERT INTO contacts (name, email, phone, message, type) VALUES (?, ?, ?, ?, ?)');
  stmt.run(name, email, phone, message, type);
  res.status(201).json({ message: 'Contact saved' });
});

app.post('/api/enroll', (req, res) => {
  const { name, email, phone, course } = req.body;
  const stmt = db.prepare('INSERT INTO enrollments (name, email, phone, course) VALUES (?, ?, ?, ?)');
  stmt.run(name, email, phone, course);
  res.status(201).json({ message: 'Enrollment saved' });
});

app.post('/api/franchise', (req, res) => {
  const { name, email, phone, city, investment } = req.body;
  const stmt = db.prepare('INSERT INTO franchise_applications (name, email, phone, city, investment) VALUES (?, ?, ?, ?, ?)');
  stmt.run(name, email, phone, city, investment);
  res.status(201).json({ message: 'Franchise application saved' });
});

// --- ADMIN / ERP API ---
app.get('/api/admin/submissions', isAdmin, (req, res) => {
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  const enrollments = db.prepare('SELECT * FROM enrollments ORDER BY created_at DESC').all();
  const franchise = db.prepare('SELECT * FROM franchise_applications ORDER BY created_at DESC').all();
  const users = db.prepare('SELECT id, username, role, status, created_at FROM users').all();
  
  res.json({ contacts, enrollments, franchise, users });
});

app.post('/api/admin/action', isAdmin, (req, res) => {
  const { type, id, action } = req.body; // type: 'franchise', 'enrollment', 'user'; action: 'approve', 'delete', 'reject'
  
  if (action === 'delete') {
    let table = '';
    if (type === 'franchise') table = 'franchise_applications';
    if (type === 'enrollment') table = 'enrollments';
    if (type === 'user') table = 'users';
    
    if (table) {
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return res.json({ success: true });
    }
  }

  if (action === 'approve') {
    if (type === 'franchise') {
      const app = db.prepare('SELECT * FROM franchise_applications WHERE id = ?').get(id);
      if (app) {
        db.prepare('UPDATE franchise_applications SET status = "accepted" WHERE id = ?').run(id);
        
        // Auto-create a client user account
        const clientPass = bcrypt.hashSync('client123', 10);
        try {
          db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
            .run(app.email, clientPass, 'client');
        } catch (e) {
          // User might already exist
        }
      }
      return res.json({ success: true });
    }
    if (type === 'enrollment') {
      db.prepare('UPDATE enrollments SET status = "active" WHERE id = ?').run(id);
      return res.json({ success: true });
    }
  }
  
  res.status(400).json({ message: 'Invalid action' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
