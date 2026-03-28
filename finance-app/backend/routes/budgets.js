const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/budgets
router.get('/', (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM, defaults to current month
    let year, mo;
    if (month) {
      [year, mo] = month.split('-');
    } else {
      const now = new Date();
      year = now.getFullYear();
      mo = String(now.getMonth() + 1).padStart(2, '0');
    }
    const monthStart = `${year}-${mo}-01`;
    const monthEnd = `${year}-${mo}-31`;

    const budgets = db.prepare(`
      SELECT c.id, c.name, c.color, c.icon, c.budget_amount, c.type,
             COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as actual_spent
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
        AND t.date >= ? AND t.date <= ?
      WHERE c.type = 'expense'
      GROUP BY c.id
      ORDER BY c.name
    `).all(monthStart, monthEnd);

    res.json(budgets.map(b => ({
      ...b,
      variance: b.budget_amount > 0 ? b.budget_amount - b.actual_spent : null,
      percent: b.budget_amount > 0 ? Math.round((b.actual_spent / b.budget_amount) * 100) : null
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/budgets/:category_id
router.put('/:category_id', (req, res) => {
  try {
    const { budget_amount } = req.body;
    db.prepare('UPDATE categories SET budget_amount = ? WHERE id = ?')
      .run(budget_amount, req.params.category_id);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.category_id);
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
