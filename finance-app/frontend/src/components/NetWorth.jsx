import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getNetWorthSnapshots, createSnapshot, updateSnapshot, deleteSnapshot } from '../api.js';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function NetWorth() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New snapshot form
  const [form, setForm] = useState({ date: getTodayDate(), assets: '', liabilities: '' });
  const [saving, setSaving] = useState(false);

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadSnapshots();
  }, []);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const res = await getNetWorthSnapshots();
      setSnapshots(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load net worth data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSnapshot = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    try {
      setSaving(true);
      const res = await createSnapshot({
        date: form.date,
        assets: parseFloat(form.assets) || 0,
        liabilities: parseFloat(form.liabilities) || 0
      });
      setSnapshots(prev => [...prev, res.data].sort((a, b) => a.date.localeCompare(b.date)));
      setForm({ date: getTodayDate(), assets: '', liabilities: '' });
    } catch (err) {
      setError('Failed to save snapshot');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (id) => {
    try {
      const res = await updateSnapshot(id, {
        date: editForm.date,
        assets: parseFloat(editForm.assets) || 0,
        liabilities: parseFloat(editForm.liabilities) || 0
      });
      setSnapshots(prev =>
        prev.map(s => s.id === id ? res.data : s).sort((a, b) => a.date.localeCompare(b.date))
      );
      setEditingId(null);
    } catch (err) {
      setError('Failed to update snapshot');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this snapshot?')) return;
    try {
      await deleteSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError('Failed to delete snapshot');
    }
  };

  // Current values (latest snapshot)
  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const chartData = snapshots.map(s => ({
    date: s.date,
    'Net Worth': Math.round(s.net_worth * 100) / 100,
    'Assets': Math.round(s.assets * 100) / 100,
    'Liabilities': Math.round(s.liabilities * 100) / 100
  }));

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Net Worth</h1>
        <p style={{ color: '#6b7280', marginTop: 2 }}>Track your total assets and liabilities over time</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, color: '#dc2626', marginBottom: 16 }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
        </div>
      )}

      {/* Summary Cards */}
      {latest && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px', background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: '4px solid #10b981' }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Current Assets</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginTop: 4 }}>{formatCurrency(latest.assets)}</div>
          </div>
          <div style={{ flex: '1 1 160px', background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: '4px solid #ef4444' }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Current Liabilities</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginTop: 4 }}>{formatCurrency(latest.liabilities)}</div>
          </div>
          <div style={{ flex: '1 1 160px', background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: `4px solid ${latest.net_worth >= 0 ? '#6366f1' : '#ef4444'}` }}>
            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>Net Worth</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: latest.net_worth >= 0 ? '#6366f1' : '#ef4444', marginTop: 4 }}>
              {formatCurrency(latest.net_worth)}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>as of {latest.date}</div>
          </div>
        </div>
      )}

      {/* Line Chart */}
      {chartData.length > 1 && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: '20px 16px',
          marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Net Worth Over Time
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Net Worth" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Assets" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Liabilities" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
        {/* Add Snapshot Form */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Add Snapshot
          </h3>
          <form onSubmit={handleAddSnapshot}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Total Assets ($)</label>
              <input
                type="number"
                value={form.assets}
                onChange={e => setForm(p => ({ ...p, assets: e.target.value }))}
                placeholder="e.g. 150000"
                style={inputStyle}
                min={0}
                step={100}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Total Liabilities ($)</label>
              <input
                type="number"
                value={form.liabilities}
                onChange={e => setForm(p => ({ ...p, liabilities: e.target.value }))}
                placeholder="e.g. 30000"
                style={inputStyle}
                min={0}
                step={100}
              />
            </div>
            {form.assets && (
              <div style={{
                padding: '10px 12px', background: '#f5f3ff', borderRadius: 8,
                fontSize: 13, color: '#6366f1', marginBottom: 14
              }}>
                Net Worth: {formatCurrency((parseFloat(form.assets) || 0) - (parseFloat(form.liabilities) || 0))}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              style={{ ...btnPrimary, width: '100%', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : '+ Add Snapshot'}
            </button>
          </form>
        </div>

        {/* Snapshots Table */}
        <div style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
              Snapshot History ({snapshots.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : snapshots.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
              No snapshots yet. Add your first one to get started!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Date', 'Assets', 'Liabilities', 'Net Worth', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map(snap => (
                    <tr key={snap.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        {editingId === snap.id ? (
                          <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={{ ...inputStyle, width: 140 }} />
                        ) : (
                          <span style={{ fontSize: 13, color: '#374151' }}>{snap.date}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingId === snap.id ? (
                          <input type="number" value={editForm.assets} onChange={e => setEditForm(p => ({ ...p, assets: e.target.value }))} style={{ ...inputStyle, width: 120 }} />
                        ) : (
                          <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>{formatCurrency(snap.assets)}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingId === snap.id ? (
                          <input type="number" value={editForm.liabilities} onChange={e => setEditForm(p => ({ ...p, liabilities: e.target.value }))} style={{ ...inputStyle, width: 120 }} />
                        ) : (
                          <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }}>{formatCurrency(snap.liabilities)}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingId === snap.id ? (
                          <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>
                            {formatCurrency((parseFloat(editForm.assets) || 0) - (parseFloat(editForm.liabilities) || 0))}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: snap.net_worth >= 0 ? '#6366f1' : '#ef4444' }}>
                            {formatCurrency(snap.net_worth)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {editingId === snap.id ? (
                            <>
                              <button onClick={() => handleEditSave(snap.id)} style={{ ...btnPrimary, padding: '5px 10px', fontSize: 12 }}>Save</button>
                              <button onClick={() => setEditingId(null)} style={{ ...btnSecondary, padding: '5px 10px', fontSize: 12 }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingId(snap.id); setEditForm({ date: snap.date, assets: snap.assets, liabilities: snap.liabilities }); }}
                                style={{ ...btnSecondary, padding: '5px 10px', fontSize: 12 }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(snap.id)}
                                style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', color: '#ef4444', fontSize: 12 }}
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', background: '#fff'
};
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 };
const btnPrimary = {
  padding: '9px 16px', background: '#6366f1', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 500
};
const btnSecondary = {
  padding: '9px 14px', background: '#fff', border: '1px solid #d1d5db',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151'
};
