import React, { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Transactions from './components/Transactions.jsx';
import Import from './components/Import.jsx';
import CategoryEditor from './components/CategoryEditor.jsx';
import Budgets from './components/Budgets.jsx';
import NetWorth from './components/NetWorth.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'transactions', label: 'Transactions', icon: '💳' },
  { id: 'import', label: 'Import', icon: '📥' },
  { id: 'categories', label: 'Categories', icon: '🏷️' },
  { id: 'budgets', label: 'Budgets', icon: '🎯' },
  { id: 'networth', label: 'Net Worth', icon: '📈' },
];

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'import': return <Import />;
      case 'categories': return <CategoryEditor />;
      case 'budgets': return <Budgets />;
      case 'networth': return <NetWorth />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: 220,
        background: '#1e1e2e',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.2)'
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>
            💰 FinanceApp
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            Personal Finance Tracker
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                background: activeView === item.id
                  ? 'rgba(99,102,241,0.2)'
                  : 'transparent',
                border: 'none',
                borderLeft: activeView === item.id
                  ? '3px solid #6366f1'
                  : '3px solid transparent',
                color: activeView === item.id ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeView === item.id ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.25)'
        }}>
          v1.0.0 — Offline
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        background: '#f5f5f5',
        overflow: 'auto'
      }}>
        {renderView()}
      </div>
    </div>
  );
}
