import React, { useEffect, useState } from 'react';
import { getBudgets, updateBudget } from '../api.js';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function ProgressBar({ percent }) {
  const color = percent > 100 ? '#ef4444' : percent > 80 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 10, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, percent)}%`,
        height: '100%',
        background: color,
        borderRadius: 4,
        transition: 'width 0.4s ease'
      }} />
    </div>
  );
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null); // category id
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, [month]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const res = await getBudgets(month);
      setBudgets(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBudget = (cat) => {
    setEditingBudget(cat.id);
    setEditValue(String(cat.budget_amount || ''));
  };

  const handleSaveBudget = async (catId) => {
    const val = parseFloat(editValue) || 0;
    try {
      setSaving(true);
      await updateBudget(catId, val);
      setBudgets(prev => prev.map(b => {
        if (b.id !== catId) return b;
        const updated = { ...b, budget_amount: val };
        updated.variance = val > 0 ? val - b.actual_spent : null;
        updated.percent = val > 0 ? Math.round((b.actual_spent / val) * 100) : null;
        return updated;
      }));
      setEditingBudget(null);
    } catch (err) {
      setError('Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  const withBudget = budgets.filter(b => b.budget_amount > 0);
  const withoutBudget = budgets.filter(b => b.budget_amount === 0);

  const totalBudget = withBudget.reduce((s, b) => s + b.budget_amount, 0);
  const totalSpent = withBudget.reduce((s, b) => s + b.actual_spent, 0);
  const totalVariance = totalBudget - totalSpent;
  const totalPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Budgets</h1>
          <p style={{ color: '#6b7280', marginTop: 2 }}>Track your spending against monthly budgets</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Month:</label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, color: '#dc2626', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>Loading...</div>
      ) : (
        <>
          {/* Summary Row */}
          {withBudget.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Budget', value: formatCurrency(totalBudget), color: '#6366f1', icon: '🎯' },
                { label: 'Total Spent', value: formatCurrency(totalSpent), color: '#ef4444', icon: '💳' },
                {
                  label: 'Remaining',
                  value: formatCurrency(Math.abs(totalVariance)),
                  subtitle: totalVariance < 0 ? 'Over budget' : 'Under budget',
                  color: totalVariance >= 0 ? '#10b981' : '#ef4444',
                  icon: totalVariance >= 0 ? '✅' : '⚠️'
                },
                { label: 'Overall', value: `${totalPercent}%`, subtitle: 'of budget used', color: '#f59e0b', icon: '📊' }
              ].map(card => (
                <div key={card.label} style={{
                  flex: '1 1 160px', background: '#fff', borderRadius: 12,
                  padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  borderTop: `4px solid ${card.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>{card.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginTop: 4 }}>{card.value}</div>
                      {card.subtitle && <div style={{ fontSize: 11, color: card.color, marginTop: 2 }}>{card.subtitle}</div>}
                    </div>
                    <div style={{ fontSize: 24 }}>{card.icon}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categories with Budget */}
          {withBudget.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 12, padding: 0,
              marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Budget Tracking</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Category', 'Budget', 'Spent', 'Progress', 'Remaining'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withBudget.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: cat.color + '20',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16
                          }}>
                            {cat.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{cat.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {editingBudget === cat.id ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: '#6b7280' }}>$</span>
                            <input
                              type="number"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveBudget(cat.id)}
                              style={{ ...inputStyle, width: 90 }}
                              autoFocus
                              min={0}
                              step={10}
                            />
                            <button onClick={() => handleSaveBudget(cat.id)} disabled={saving} style={{ ...btnPrimary, padding: '5px 10px', fontSize: 12 }}>
                              Save
                            </button>
                            <button onClick={() => setEditingBudget(null)} style={{ ...btnSecondary, padding: '5px 10px', fontSize: 12 }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => handleEditBudget(cat)}
                            style={{ cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151', textDecoration: 'underline dotted' }}
                            title="Click to edit"
                          >
                            {formatCurrency(cat.budget_amount)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                        {formatCurrency(cat.actual_spent)}
                      </td>
                      <td style={{ padding: '14px 16px', minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <ProgressBar percent={cat.percent || 0} />
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 600, minWidth: 36,
                            color: (cat.percent || 0) > 100 ? '#ef4444' : (cat.percent || 0) > 80 ? '#f59e0b' : '#10b981'
                          }}>
                            {cat.percent || 0}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 13, fontWeight: 500,
                          color: (cat.variance || 0) >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {(cat.variance || 0) >= 0 ? '+' : ''}{formatCurrency(cat.variance || 0)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr style={{ background: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111827' }}>Total</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatCurrency(totalBudget)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111827' }}>{formatCurrency(totalSpent)}</td>
                    <td style={{ padding: '12px 16px', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <ProgressBar percent={totalPercent} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>
                          {totalPercent}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: totalVariance >= 0 ? '#10b981' : '#ef4444' }}>
                        {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Categories without budget */}
          {withoutBudget.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 12, padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                  Categories Without Budget
                </h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 20 }}>
                {withoutBudget.map(cat => (
                  <div key={cat.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', background: '#f9fafb', borderRadius: 10,
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{cat.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        Spent: {formatCurrency(cat.actual_spent)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBudgets(prev => prev.map(b => b.id === cat.id ? { ...b, budget_amount: 1 } : b));
                        setTimeout(() => handleEditBudget({ ...cat, budget_amount: 1 }), 50);
                      }}
                      style={{ ...btnPrimary, fontSize: 11, padding: '5px 10px' }}
                    >
                      Set Budget
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {budgets.length === 0 && (
            <div style={{
              background: '#fff', borderRadius: 12, padding: 40,
              textAlign: 'center', color: '#9ca3af',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              No expense categories found. Add categories first.
            </div>
          )}
        </>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', background: '#fff'
};
const btnPrimary = {
  padding: '9px 16px', background: '#6366f1', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 500
};
const btnSecondary = {
  padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151'
};
