import React from 'react';
import { MUSCLE_COLORS } from '../dataUtils';

export default function NeglectedAlert({ neglected, recentRuns }) {
  const lastLongRun = recentRuns?.find(r => r.miles >= 10) ?? null;
  const daysSinceLongRun = lastLongRun
    ? Math.floor((Date.now() - new Date(lastLongRun.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const showLongRunAlert = daysSinceLongRun !== null && daysSinceLongRun >= 8;

  const longRunBanner = showLongRunAlert ? (
    <div style={{
      marginTop: 12,
      padding: '10px 12px',
      borderRadius: 8,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
        {daysSinceLongRun > 90 ? '90+' : daysSinceLongRun} days since a 10+ mile run
      </span>
    </div>
  ) : null;

  if (neglected.length === 0) {
    return (
      <div className="card" style={{ borderColor: '#14532d' }}>
        <h3 className="card-title">Muscle Coverage</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 20 }}>✓</span>
          <p style={{ color: '#4ade80', margin: 0, fontSize: 14 }}>
            All tracked muscle groups hit within the last 7 days.
          </p>
        </div>
        {longRunBanner}
      </div>
    );
  }

  return (
    <div className="card" style={{ borderColor: '#7c2d12' }}>
      <h3 className="card-title">Neglected Muscles</h3>
      <p className="card-subtitle">Not trained in 7+ days</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {neglected.map(({ muscle, label, daysSince }) => {
          const severity = daysSince >= 21 ? '#ef4444' : daysSince >= 14 ? '#f97316' : '#f59e0b';
          return (
            <div
              key={muscle}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(239,68,68,0.06)',
                border: `1px solid rgba(239,68,68,0.15)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: MUSCLE_COLORS[muscle] || '#64748b',
                  flexShrink: 0,
                }} />
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ color: severity, fontSize: 12, fontWeight: 600 }}>
                {daysSince}d ago
              </span>
            </div>
          );
        })}
      </div>
      {longRunBanner}
    </div>
  );
}
