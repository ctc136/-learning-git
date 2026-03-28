import React, { useEffect, useState, useCallback } from 'react';
import { getTransactions, getCategories, getAccounts, updateTransaction, deleteTransaction } from '../api.js';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const PAGE_SIZE = 50;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Inline editing
  const [editingCategory, setEditingCategory] = useState(null); // tx id
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, filterCategory, filterAccount, startDate, endDate]);

  const loadMeta = async () => {
    try {
      const [catRes, accRes] = await Promise.all([getCategories(), getAccounts()]);
      setCategories(catRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Failed to load meta:', err);
    }
  };

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      };
      if (filterCategory) params.category_id = filterCategory;
      if (filterAccount) params.account_id = filterAccount;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (search) params.search = search;

      const res = await getTransactions(params);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setError(null);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterAccount, startDate, endDate, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadTransactions();
  };

  const handleCategoryChange = async (txId, newCategoryId) => {
    try {
      await updateTransaction(txId, { category_id: newCategoryId || null });
      setTransactions(prev => prev.map(tx => {
        if (tx.id !== txId) return tx;
        const cat = categories.find(c => c.id === parseInt(newCategoryId));
        return {
          ...tx,
          category_id: newCategoryId ? parseInt(newCategoryId) : null,
          category_name: cat?.name || null,
          category_color: cat?.color || null,
          category_icon: cat?.icon || null
        };
      }));
    } catch (err) {
      alert('Failed to update category');
    }
    setEditingCategory(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      setDeletingId(id);
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      alert('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Transactions</h1>
        <p style={{ color: '#6b7280', marginTop: 2 }}>
          {total} transaction{total !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: 20,
        marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 200px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search description, merchant, notes..."
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Account
              </label>
              <select value={filterAccount} onChange={e => { setFilterAccount(e.target.value); setPage(0); }} style={inputStyle}>
                <option value="">All accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Category
              </label>
              <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(0); }} style={inputStyle}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 130px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Start Date
              </label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(0); }} style={inputStyle} />
            </div>
            <div style={{ flex: '1 1 130px' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                End Date
              </label>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(0); }} style={inputStyle} />
            </div>
            <div>
              <button type="submit" style={btnPrimary}>
                🔍 Search
              </button>
            </div>
            <div>
              <button type="button" onClick={() => {
                setSearch(''); setFilterCategory(''); setFilterAccount('');
                setStartDate(''); setEndDate(''); setPage(0);
              }} style={btnSecondary}>
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, color: '#dc2626', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            No transactions found. Try importing a CSV or OFX file.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Date', 'Description', 'Merchant', 'Amount', 'Category', 'Account', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 12,
                      fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: deletingId === tx.id ? '#fef2f2' : '#fff',
                    transition: 'background 0.15s'
                  }}>
                    <td style={tdStyle}>{tx.date}</td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                        {tx.description}
                      </div>
                      {tx.notes && (
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{tx.notes}</div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 13, color: '#6b7280' }}>
                      {tx.merchant || '—'}
                    </td>
                    <td style={{
                      ...tdStyle,
                      fontWeight: 600,
                      color: tx.amount >= 0 ? '#10b981' : '#ef4444',
                      fontSize: 14
                    }}>
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    <td style={tdStyle}>
                      {editingCategory === tx.id ? (
                        <select
                          autoFocus
                          defaultValue={tx.category_id || ''}
                          onChange={e => handleCategoryChange(tx.id, e.target.value)}
                          onBlur={() => setEditingCategory(null)}
                          style={{ ...inputStyle, minWidth: 150, fontSize: 12 }}
                        >
                          <option value="">Uncategorized</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setEditingCategory(tx.id)}
                          title="Click to change category"
                          style={{
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: 10,
                            fontSize: 12,
                            background: tx.category_color ? tx.category_color + '20' : '#f3f4f6',
                            color: tx.category_color || '#6b7280',
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                        >
                          {tx.category_icon || ''} {tx.category_name || 'Uncategorized'}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#6b7280' }}>
                      {tx.account_name || '—'}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        style={{
                          padding: '4px 10px', background: 'transparent',
                          border: '1px solid #fca5a5', borderRadius: 6,
                          cursor: 'pointer', color: '#ef4444', fontSize: 12
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '16px 20px', borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Page {page + 1} of {totalPages} ({total} total)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ ...btnSecondary, opacity: page === 0 ? 0.5 : 1 }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ ...btnSecondary, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 13,
  color: '#111827',
  outline: 'none',
  background: '#fff'
};

const tdStyle = {
  padding: '12px 16px',
  verticalAlign: 'middle'
};

const btnPrimary = {
  padding: '9px 16px', background: '#6366f1', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#fff',
  fontWeight: 500, whiteSpace: 'nowrap'
};

const btnSecondary = {
  padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151'
};
