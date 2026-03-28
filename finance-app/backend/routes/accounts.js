const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/accounts
router.get('/', (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT a.*, COUNT(t.id) as transaction_count
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      GROUP BY a.id
      ORDER BY a.name
    `).all();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts
router.post('/', (req, res) => {
  try {
    const { name, type = 'checking', balance = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = db.prepare(
      'INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)'
    ).run(name, type, balance);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id
router.put('/:id', (req, res) => {
  try {
    const { name, type, balance } = req.body;
    db.prepare(`
      UPDATE accounts SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        balance = COALESCE(?, balance)
      WHERE id = ?
    `).run(name, type, balance, req.params.id);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('UPDATE transactions SET account_id = NULL WHERE account_id = ?').run(req.params.id);
    db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
