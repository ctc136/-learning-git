const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });
app.set('upload', upload);

// Routes
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/rules', require('./routes/rules'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/net-worth', require('./routes/networth'));

// Dashboard endpoint
app.get('/api/dashboard', (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = `${currentYear}-${currentMonth}-01`;
    const monthEnd = `${currentYear}-${currentMonth}-31`;

    // Total income this month
    const totalIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE date >= ? AND date <= ? AND amount > 0
    `).get(monthStart, monthEnd);

    // Total expenses this month
    const totalExpenses = db.prepare(`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions
      WHERE date >= ? AND date <= ? AND amount < 0
    `).get(monthStart, monthEnd);

    // Transaction count this month
    const txCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE date >= ? AND date <= ?
    `).get(monthStart, monthEnd);

    // Monthly income vs expenses (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const start = `${yr}-${mo}-01`;
      const end = `${yr}-${mo}-31`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      const inc = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions WHERE date >= ? AND date <= ? AND amount > 0
      `).get(start, end);

      const exp = db.prepare(`
        SELECT COALESCE(SUM(ABS(amount)), 0) as total
        FROM transactions WHERE date >= ? AND date <= ? AND amount < 0
      `).get(start, end);

      monthlyData.push({
        month: label,
        income: Math.round(inc.total * 100) / 100,
        expenses: Math.round(exp.total * 100) / 100
      });
    }

    // Spending by category this month
    const categorySpending = db.prepare(`
      SELECT c.id, c.name, c.color, c.icon,
             COALESCE(SUM(ABS(t.amount)), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
        AND t.date >= ? AND t.date <= ? AND t.amount < 0
      WHERE c.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
    `).all(monthStart, monthEnd);

    // Top spending categories
    const topCategories = categorySpending.filter(c => c.total > 0).slice(0, 5);

    // Recent transactions
    const recentTransactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color,
             c.icon as category_icon, a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      ORDER BY t.date DESC, t.imported_at DESC
      LIMIT 10
    `).all();

    // Net worth snapshots for chart
    const netWorthHistory = db.prepare(`
      SELECT * FROM net_worth_snapshots ORDER BY date ASC LIMIT 24
    `).all();

    // Budget vs actual
    const budgetData = db.prepare(`
      SELECT c.id, c.name, c.color, c.icon, c.budget_amount,
             COALESCE(SUM(ABS(t.amount)), 0) as actual_spent
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
        AND t.date >= ? AND t.date <= ? AND t.amount < 0
      WHERE c.type = 'expense' AND c.budget_amount > 0
      GROUP BY c.id
      ORDER BY c.name
    `).all(monthStart, monthEnd);

    res.json({
      summary: {
        totalIncome: Math.round(totalIncome.total * 100) / 100,
        totalExpenses: Math.round(totalExpenses.total * 100) / 100,
        netSavings: Math.round((totalIncome.total - totalExpenses.total) * 100) / 100,
        transactionCount: txCount.count
      },
      monthlyData,
      categorySpending,
      topCategories,
      recentTransactions,
      netWorthHistory,
      budgetData
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Finance backend running on http://localhost:${PORT}`);
});
