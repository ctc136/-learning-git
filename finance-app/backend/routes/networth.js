const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/net-worth
router.get('/', (req, res) => {
  try {
    const snapshots = db.prepare(
      'SELECT * FROM net_worth_snapshots ORDER BY date ASC'
    ).all();
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/net-worth
router.post('/', (req, res) => {
  try {
    const { date, assets, liabilities } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const assetsVal = parseFloat(assets) || 0;
    const liabilitiesVal = parseFloat(liabilities) || 0;
    const net_worth = assetsVal - liabilitiesVal;

    const result = db.prepare(
      'INSERT INTO net_worth_snapshots (date, assets, liabilities, net_worth) VALUES (?, ?, ?, ?)'
    ).run(date, assetsVal, liabilitiesVal, net_worth);

    const snapshot = db.prepare('SELECT * FROM net_worth_snapshots WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/net-worth/:id
router.put('/:id', (req, res) => {
  try {
    const { date, assets, liabilities } = req.body;
    const assetsVal = parseFloat(assets) || 0;
    const liabilitiesVal = parseFloat(liabilities) || 0;
    const net_worth = assetsVal - liabilitiesVal;

    db.prepare(`
      UPDATE net_worth_snapshots SET
        date = COALESCE(?, date),
        assets = ?,
        liabilities = ?,
        net_worth = ?
      WHERE id = ?
    `).run(date, assetsVal, liabilitiesVal, net_worth, req.params.id);

    const snapshot = db.prepare('SELECT * FROM net_worth_snapshots WHERE id = ?').get(req.params.id);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/net-worth/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM net_worth_snapshots WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
