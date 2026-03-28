const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const multer = require('multer');
const db = require('../db');

const upload = multer({ storage: multer.memoryStorage() });

function makeHash(date, description, amount) {
  const str = date + '|' + description.trim().toLowerCase() + '|' + Math.abs(amount).toFixed(2);
  return crypto.createHash('md5').update(str).digest('hex');
}

function applyRules(description, amount, merchant) {
  const rules = db.prepare(`
    SELECT r.*, c.id as cat_id
    FROM rules r
    JOIN categories c ON r.category_id = c.id
    ORDER BY r.priority DESC
  `).all();

  for (const rule of rules) {
    let fieldValue = '';
    if (rule.field === 'description') fieldValue = description || '';
    else if (rule.field === 'amount') fieldValue = String(amount);
    else if (rule.field === 'merchant') fieldValue = merchant || '';

    let matched = false;
    try {
      if (rule.match_type === 'contains') {
        matched = fieldValue.toLowerCase().includes(rule.pattern.toLowerCase());
      } else if (rule.match_type === 'starts_with') {
        matched = fieldValue.toLowerCase().startsWith(rule.pattern.toLowerCase());
      } else if (rule.match_type === 'ends_with') {
        matched = fieldValue.toLowerCase().endsWith(rule.pattern.toLowerCase());
      } else if (rule.match_type === 'regex') {
        const re = new RegExp(rule.pattern, 'i');
        matched = re.test(fieldValue);
      }
    } catch (e) {
      // invalid regex, skip
    }

    if (matched) return rule.category_id;
  }
  return null;
}

function parseCSV(buffer) {
  const text = buffer.toString('utf8');
  let records;
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });
  } catch (e) {
    // Try without headers
    records = parse(text, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });
    return [];
  }

  if (!records.length) return [];

  const headers = Object.keys(records[0]).map(h => h.toLowerCase().trim());

  // Detect date column
  const dateCol = Object.keys(records[0]).find(h => {
    const hl = h.toLowerCase();
    return hl.includes('date') || hl === 'posted' || hl === 'transaction date';
  });

  // Detect description column
  const descCol = Object.keys(records[0]).find(h => {
    const hl = h.toLowerCase();
    return hl.includes('description') || hl.includes('memo') || hl.includes('name') ||
           hl.includes('payee') || hl.includes('merchant') || hl.includes('narration');
  });

  // Detect amount columns
  const amountCol = Object.keys(records[0]).find(h => {
    const hl = h.toLowerCase();
    return hl === 'amount' || hl === 'transaction amount' || hl === 'value';
  });

  const debitCol = Object.keys(records[0]).find(h => {
    const hl = h.toLowerCase();
    return hl.includes('debit') || hl.includes('withdrawal') || hl.includes('charge');
  });

  const creditCol = Object.keys(records[0]).find(h => {
    const hl = h.toLowerCase();
    return hl.includes('credit') || hl.includes('deposit') || hl.includes('payment');
  });

  const transactions = [];
  for (const row of records) {
    if (!dateCol || !descCol) continue;

    const dateRaw = row[dateCol];
    if (!dateRaw) continue;

    // Normalize date to YYYY-MM-DD
    let date = dateRaw.trim();
    // Handle MM/DD/YYYY or MM-DD-YYYY
    const mmddyyyy = date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mmddyyyy) {
      date = `${mmddyyyy[3]}-${mmddyyyy[1].padStart(2, '0')}-${mmddyyyy[2].padStart(2, '0')}`;
    }
    // Handle YYYY/MM/DD
    const yyyymmdd = date.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
    if (yyyymmdd) {
      date = `${yyyymmdd[1]}-${yyyymmdd[2]}-${yyyymmdd[3]}`;
    }

    const description = row[descCol] || 'Unknown';
    let amount = 0;

    if (amountCol && row[amountCol] !== undefined && row[amountCol] !== '') {
      amount = parseFloat(String(row[amountCol]).replace(/[$,\s]/g, '')) || 0;
    } else if (debitCol || creditCol) {
      const debit = debitCol ? parseFloat(String(row[debitCol] || '0').replace(/[$,\s]/g, '')) || 0 : 0;
      const credit = creditCol ? parseFloat(String(row[creditCol] || '0').replace(/[$,\s]/g, '')) || 0 : 0;
      // Debits are expenses (negative), credits are income (positive)
      amount = credit - debit;
    }

    if (date && description) {
      transactions.push({ date, description, amount, merchant: description });
    }
  }

  return transactions;
}

function parseOFX(buffer) {
  const text = buffer.toString('utf8');
  const transactions = [];

  // Extract STMTTRN blocks
  const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtRegex.exec(text)) !== null) {
    const block = match[1];

    const dtposted = (block.match(/<DTPOSTED>([^<\n\r]+)/i) || [])[1] || '';
    const name = (block.match(/<NAME>([^<\n\r]+)/i) || [])[1] || '';
    const memo = (block.match(/<MEMO>([^<\n\r]+)/i) || [])[1] || '';
    const trnamt = (block.match(/<TRNAMT>([^<\n\r]+)/i) || [])[1] || '0';

    // Parse date: YYYYMMDD or YYYYMMDDHHMMSS
    let date = dtposted.trim().substring(0, 8);
    if (date.length === 8) {
      date = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
    }

    const description = (name || memo || 'Unknown').trim();
    const amount = parseFloat(trnamt.trim()) || 0;

    if (date && description) {
      transactions.push({ date, description, amount, merchant: name.trim() || description });
    }
  }

  // Also try SGML-style OFX without closing tags
  if (transactions.length === 0) {
    const lines = text.split(/\r?\n/);
    let inTrn = false;
    let current = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '<STMTTRN>') { inTrn = true; current = {}; continue; }
      if (trimmed === '</STMTTRN>') {
        if (inTrn && current.date && current.description) {
          transactions.push(current);
        }
        inTrn = false;
        continue;
      }
      if (!inTrn) continue;

      const dtMatch = trimmed.match(/^<DTPOSTED>(.+)$/i);
      if (dtMatch) {
        let d = dtMatch[1].trim().substring(0, 8);
        current.date = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
      }
      const nameMatch = trimmed.match(/^<NAME>(.+)$/i);
      if (nameMatch) { current.description = nameMatch[1].trim(); current.merchant = nameMatch[1].trim(); }
      const memoMatch = trimmed.match(/^<MEMO>(.+)$/i);
      if (memoMatch && !current.description) { current.description = memoMatch[1].trim(); }
      const amtMatch = trimmed.match(/^<TRNAMT>(.+)$/i);
      if (amtMatch) { current.amount = parseFloat(amtMatch[1].trim()) || 0; }
    }
  }

  return transactions;
}

// GET /api/transactions
router.get('/', (req, res) => {
  try {
    const { account_id, category_id, start_date, end_date, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
             a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (account_id) { query += ' AND t.account_id = ?'; params.push(account_id); }
    if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id); }
    if (start_date) { query += ' AND t.date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND t.date <= ?'; params.push(end_date); }
    if (search) {
      query += ' AND (t.description LIKE ? OR t.merchant LIKE ? OR t.notes LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const countQuery = query.replace(
      'SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon,\n             a.name as account_name',
      'SELECT COUNT(*) as count'
    );
    const total = db.prepare(countQuery).get(...params);

    query += ' ORDER BY t.date DESC, t.imported_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const rows = db.prepare(query).all(...params);
    res.json({ transactions: rows, total: total.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions/import
router.post('/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const accountId = req.body.account_id ? parseInt(req.body.account_id) : null;
    const filename = req.file.originalname.toLowerCase();

    let parsed = [];
    if (filename.endsWith('.ofx') || filename.endsWith('.qfx')) {
      parsed = parseOFX(req.file.buffer);
    } else {
      parsed = parseCSV(req.file.buffer);
    }

    let imported = 0;
    let duplicates = 0;
    let uncategorized = 0;
    const importedTransactions = [];

    const insertTx = db.prepare(`
      INSERT INTO transactions (account_id, date, description, amount, category_id, merchant, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN');
    try {
      for (const tx of parsed) {
        const hash = makeHash(tx.date, tx.description, tx.amount);

        // Check for duplicate
        const existing = db.prepare('SELECT id FROM transactions WHERE hash = ?').get(hash);
        if (existing) { duplicates++; continue; }

        // Auto-categorize
        const categoryId = applyRules(tx.description, tx.amount, tx.merchant);
        if (!categoryId) uncategorized++;

        const result = insertTx.run(
          accountId, tx.date, tx.description, tx.amount,
          categoryId, tx.merchant || null, hash
        );

        const newTx = db.prepare(`
          SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.id = ?
        `).get(result.lastInsertRowid);

        importedTransactions.push(newTx);
        imported++;
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ imported, duplicates, uncategorized, transactions: importedTransactions });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', (req, res) => {
  try {
    const { category_id, notes, merchant } = req.body;
    db.prepare(`
      UPDATE transactions SET category_id = ?, notes = ?, merchant = ?
      WHERE id = ?
    `).run(category_id || null, notes || null, merchant || null, req.params.id);

    const tx = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
