import React, { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { getDashboard } from '../api.js';

const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6'];

function SummaryCard({ title, value, subtitle, color, icon }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 24px',
      flex: 1,
      minWidth: 180,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginTop: 6 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        <div style={{ fontSize: 28 }}>{icon}</div>
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dashboardRef = useRef(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f5f5f5'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('finance-dashboard.pdf');
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: 16, color: '#dc2626'
        }}>
          {error}
        </div>
      </div>
    );
  }

  const { summary, monthlyData, categorySpending, topCategories, recentTransactions, netWorthHistory } = data;
  const maxSpend = topCategories.length ? topCategories[0].total : 1;

  return (
    <div ref={dashboardRef} style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: 2 }}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadDashboard}
            style={{
              padding: '9px 16px', background: '#fff', border: '1px solid #d1d5db',
              borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={exportPDF}
            style={{
              padding: '9px 16px', background: '#6366f1', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500
            }}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <SummaryCard
          title="Total Income"
          value={formatCurrency(summary.totalIncome)}
          subtitle="This month"
          color="#10b981"
          icon="💵"
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          subtitle="This month"
          color="#ef4444"
          icon="💳"
        />
        <SummaryCard
          title="Net Savings"
          value={formatCurrency(summary.netSavings)}
          subtitle={summary.netSavings >= 0 ? 'On track' : 'Over budget'}
          color={summary.netSavings >= 0 ? '#6366f1' : '#ef4444'}
          icon="🏦"
        />
        <SummaryCard
          title="Transactions"
          value={summary.transactionCount}
          subtitle="This month"
          color="#f59e0b"
          icon="📋"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Income vs Expenses Bar Chart */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '20px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Income vs Expenses (12 months)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Category Pie Chart */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '20px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Spending by Category (this month)
          </h3>
          {categorySpending.filter(c => c.total > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categorySpending.filter(c => c.total > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="total"
                  nameKey="name"
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {categorySpending.filter(c => c.total > 0).map((entry, index) => (
                    <Cell key={entry.id} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              No spending data this month
            </div>
          )}
        </div>
      </div>

      {/* Net Worth Line Chart */}
      {netWorthHistory.length > 1 && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: '20px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Net Worth Over Time
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={netWorthHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Line type="monotone" dataKey="net_worth" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Net Worth" />
              <Line type="monotone" dataKey="assets" stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Assets" />
              <Line type="monotone" dataKey="liabilities" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Liabilities" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Transactions */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Recent Transactions
          </h3>
          {recentTransactions.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
              No transactions yet. Import some to get started!
            </div>
          ) : (
            <div>
              {recentTransactions.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {tx.date}
                      {tx.category_name && (
                        <span style={{
                          marginLeft: 6, padding: '1px 6px', borderRadius: 10,
                          background: (tx.category_color || '#6366f1') + '20',
                          color: tx.category_color || '#6366f1', fontSize: 10
                        }}>
                          {tx.category_icon} {tx.category_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: tx.amount >= 0 ? '#10b981' : '#ef4444',
                    marginLeft: 12
                  }}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Spending Categories */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Top Spending Categories
          </h3>
          {topCategories.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
              No spending data this month
            </div>
          ) : (
            <div>
              {topCategories.map((cat, idx) => (
                <div key={cat.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                      {cat.icon} {cat.name}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8 }}>
                    <div style={{
                      background: cat.color || COLORS[idx % COLORS.length],
                      width: `${Math.min(100, (cat.total / maxSpend) * 100)}%`,
                      height: '100%',
                      borderRadius: 4,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
