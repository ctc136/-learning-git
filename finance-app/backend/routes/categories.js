const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;
    const monthEnd = `${year}-${month}-31`;

    const categories = db.prepare(`
      SELECT c.*,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_spent_month
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
        AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY c.name
    `).all(monthStart, monthEnd);

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories
router.post('/', (req, res) => {
  try {
    const { name, color = '#6366f1', icon = '💰', type = 'expense', budget_amount = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = db.prepare(
      'INSERT INTO categories (name, color, icon, type, budget_amount) VALUES (?, ?, ?, ?, ?)'
    ).run(name, color, icon, type, budget_amount);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  try {
    const { name, color, icon, type, budget_amount } = req.body;
    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        type = COALESCE(?, type),
        budget_amount = COALESCE(?, budget_amount)
      WHERE id = ?
    `).run(name, color, icon, type, budget_amount, req.params.id);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  try {
    // Null out category_id on transactions first
    db.prepare('UPDATE transactions SET category_id = NULL WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
