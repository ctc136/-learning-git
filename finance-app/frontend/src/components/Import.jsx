import React, { useState, useEffect, useRef } from 'react';
import { importTransactions, getAccounts, createAccount } from '../api.js';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function Import() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('checking');
  const [showNewAccount, setShowNewAccount] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await getAccounts();
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const handleFileInput = (e) => {
    const selected = e.target.files[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (f) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.ofx') && !name.endsWith('.qfx')) {
      setError('Please upload a .csv, .ofx, or .qfx file');
      return;
    }
    setFile(f);
    setError(null);
    setResults(null);
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    try {
      const res = await createAccount({ name: newAccountName.trim(), type: newAccountType });
      setAccounts(prev => [...prev, res.data]);
      setSelectedAccount(String(res.data.id));
      setNewAccountName('');
      setShowNewAccount(false);
    } catch (err) {
      setError('Failed to create account: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      if (selectedAccount) formData.append('account_id', selectedAccount);

      const res = await importTransactions(formData);
      setResults(res.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('Import failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Import Transactions</h1>
        <p style={{ color: '#6b7280', marginTop: 2 }}>Upload your bank statements in CSV or OFX format</p>
      </div>

      {/* Account Selector */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: 20,
        marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 14 }}>
          Select Account
        </h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              style={inputStyle}
            >
              <option value="">No account (unassigned)</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowNewAccount(!showNewAccount)}
            style={btnSecondary}
          >
            {showNewAccount ? 'Cancel' : '+ New Account'}
          </button>
        </div>

        {showNewAccount && (
          <div style={{
            marginTop: 14, padding: 14, background: '#f9fafb',
            borderRadius: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end'
          }}>
            <div style={{ flex: '2 1 160px' }}>
              <label style={labelStyle}>Account Name</label>
              <input
                type="text"
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
                placeholder="e.g. Chase Checking"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '1 1 130px' }}>
              <label style={labelStyle}>Type</label>
              <select value={newAccountType} onChange={e => setNewAccountType(e.target.value)} style={inputStyle}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <button onClick={handleCreateAccount} style={btnPrimary}>
              Create Account
            </button>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#6366f1' : file ? '#10b981' : '#d1d5db'}`,
          borderRadius: 12,
          padding: '48px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#eef2ff' : file ? '#f0fdf4' : '#fff',
          marginBottom: 20,
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.ofx,.qfx"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {file ? '✅' : dragging ? '📂' : '📥'}
        </div>
        {file ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{file.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {(file.size / 1024).toFixed(1)} KB — Click to change file
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>
              {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              Supports .csv, .ofx, .qfx files
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 8, padding: 12, color: '#dc2626', marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {file && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              ...btnPrimary,
              width: '100%',
              padding: '14px',
              fontSize: 15,
              opacity: uploading ? 0.7 : 1
            }}
          >
            {uploading ? '⏳ Importing...' : '📤 Import Transactions'}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Import Results
          </h3>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ ...resultCard, borderColor: '#10b981' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{results.imported}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Imported</div>
            </div>
            <div style={{ ...resultCard, borderColor: '#f59e0b' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{results.duplicates}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Duplicates Skipped</div>
            </div>
            <div style={{ ...resultCard, borderColor: '#6366f1' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>{results.uncategorized}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Uncategorized</div>
            </div>
          </div>

          {results.transactions.length > 0 && (
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                Preview (first {Math.min(20, results.transactions.length)} transactions)
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {['Date', 'Description', 'Amount', 'Category'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.transactions.slice(0, 20).map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px' }}>{tx.date}</td>
                        <td style={{ padding: '8px 12px', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description}
                        </td>
                        <td style={{ padding: '8px 12px', color: tx.amount >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {tx.category_name ? (
                            <span style={{
                              padding: '2px 8px', borderRadius: 10, fontSize: 11,
                              background: (tx.category_color || '#6366f1') + '20',
                              color: tx.category_color || '#6366f1'
                            }}>
                              {tx.category_icon} {tx.category_name}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: 11 }}>Uncategorized</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 14 }}>
          Supported Formats
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>CSV Files</h4>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              Standard CSV exports from most banks. The importer auto-detects columns for date, description, and amount.
            </p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginTop: 6 }}>
              Supported column names: <code>date</code>, <code>description</code>, <code>memo</code>, <code>amount</code>, <code>debit</code>, <code>credit</code>
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>OFX / QFX Files</h4>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              Open Financial Exchange format used by most US banks and financial institutions. Export from your bank's website.
            </p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginTop: 6 }}>
              Compatible with Quicken, Mint, and most US bank exports.
            </p>
          </div>
        </div>
        <div style={{
          marginTop: 16, padding: 12, background: '#eff6ff',
          borderRadius: 8, borderLeft: '3px solid #3b82f6'
        }}>
          <p style={{ fontSize: 12, color: '#1d4ed8' }}>
            <strong>Duplicate Detection:</strong> The importer automatically skips transactions already in the database, so it's safe to re-import the same file.
          </p>
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
const resultCard = {
  flex: '1 1 100px', background: '#f9fafb', borderRadius: 10,
  padding: '16px 20px', textAlign: 'center', borderTop: '3px solid #ccc',
  minWidth: 100
};
