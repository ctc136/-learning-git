const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/rules
router.get('/', (req, res) => {
  try {
    const rules = db.prepare(`
      SELECT r.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      ORDER BY r.priority DESC, r.id ASC
    `).all();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rules
router.post('/', (req, res) => {
  try {
    const { category_id, pattern, match_type = 'contains', field = 'description', priority = 0 } = req.body;
    if (!category_id || !pattern) {
      return res.status(400).json({ error: 'category_id and pattern are required' });
    }

    const result = db.prepare(`
      INSERT INTO rules (category_id, pattern, match_type, field, priority)
      VALUES (?, ?, ?, ?, ?)
    `).run(category_id, pattern, match_type, field, priority);

    const rule = db.prepare(`
      SELECT r.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rules/reorder
router.put('/reorder', (req, res) => {
  try {
    const updates = req.body; // array of {id, priority}
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected array' });

    const updateStmt = db.prepare('UPDATE rules SET priority = ? WHERE id = ?');
    db.exec('BEGIN');
    try {
      for (const item of updates) {
        updateStmt.run(item.priority, item.id);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rules/:id
router.put('/:id', (req, res) => {
  try {
    const { category_id, pattern, match_type, field, priority } = req.body;
    db.prepare(`
      UPDATE rules SET
        category_id = COALESCE(?, category_id),
        pattern = COALESCE(?, pattern),
        match_type = COALESCE(?, match_type),
        field = COALESCE(?, field),
        priority = COALESCE(?, priority)
      WHERE id = ?
    `).run(category_id, pattern, match_type, field, priority, req.params.id);

    const rule = db.prepare(`
      SELECT r.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM rules r
      JOIN categories c ON r.category_id = c.id
      WHERE r.id = ?
    `).get(req.params.id);

    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rules/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM rules WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
