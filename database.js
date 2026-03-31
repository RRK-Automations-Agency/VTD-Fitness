let db;

try {
  const Database = require('better-sqlite3');
  const path = require('path');
  const dbPath = path.join(__dirname, 'vtd_fitness.db');
  
  // Only attempt to open if not on Vercel or if we have write access (unlikely on Vercel)
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Initialize tables with FULL final schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      course TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS franchise_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      investment TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      job_title TEXT NOT NULL,
      experience INTEGER,
      resume TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      idea TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("DB: Initialized tables.");

  // Seed Admin User (password: admin123)
  const bcrypt = require('bcryptjs');
  const adminPass = bcrypt.hashSync('admin123', 10);
  try {
    db.prepare('INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)').run('admin', adminPass, 'admin', 'active');
  } catch (e) {
    // Admin already exists
  }

} catch (err) {
  console.warn("DB WARNING: Could not initialize SQLite (Normal for Vercel/Serverless). Using Mock DB.");
  
  // Mock Database Object to prevent crashes
  db = {
    prepare: () => ({
      get: () => null,
      all: () => [],
      run: () => ({ changes: 0 })
    }),
    exec: () => {},
    pragma: () => {}
  };
}

module.exports = db;
