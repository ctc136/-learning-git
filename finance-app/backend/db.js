const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'finance.db'));

// Enable WAL mode and foreign keys via SQL (node:sqlite has no .pragma())
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '💰',
    budget_amount REAL DEFAULT 0,
    type TEXT DEFAULT 'expense'
  );

  CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    pattern TEXT NOT NULL,
    match_type TEXT DEFAULT 'contains',
    field TEXT DEFAULT 'description',
    priority INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    merchant TEXT,
    notes TEXT,
    hash TEXT UNIQUE,
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS net_worth_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    assets REAL DEFAULT 0,
    liabilities REAL DEFAULT 0,
    net_worth REAL DEFAULT 0
  );
`);

// Seed default categories if none exist
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (categoryCount.count === 0) {
  const insertCategory = db.prepare(
    'INSERT INTO categories (name, color, icon, type) VALUES (?, ?, ?, ?)'
  );
  db.exec('BEGIN');
  try {
    insertCategory.run('Food & Dining', '#f59e0b', '🍔', 'expense');
    insertCategory.run('Transportation', '#3b82f6', '🚗', 'expense');
    insertCategory.run('Shopping', '#8b5cf6', '🛍️', 'expense');
    insertCategory.run('Entertainment', '#ec4899', '🎬', 'expense');
    insertCategory.run('Bills & Utilities', '#6366f1', '💡', 'expense');
    insertCategory.run('Healthcare', '#10b981', '🏥', 'expense');
    insertCategory.run('Travel', '#14b8a6', '✈️', 'expense');
    insertCategory.run('Income', '#22c55e', '💵', 'income');
    insertCategory.run('Transfer', '#94a3b8', '🔄', 'expense');
    insertCategory.run('Other', '#64748b', '💰', 'expense');
    db.exec('COMMIT');
    console.log('Seeded default categories');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = db;
