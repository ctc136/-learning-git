import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e1e2e', border: '1px solid #2a2a3a',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
    }}>
      <p style={{ color: '#94a3b8', margin: 0 }}>Week of {label}</p>
      <p style={{ color: '#6366f1', margin: '4px 0 0', fontWeight: 600 }}>
        {payload[0].value} mi
      </p>
    </div>
  );
};

export default function StravaSection({ data, status, error }) {
  if (status === 'loading') {
    return (
      <div className="loading-grid">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" />)}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="error-box">
        <strong>Strava Error:</strong> {error}
      </div>
    );
  }

  if (!data) return null;

  const { weeklyMiles, weeklyMilesData = [], recentRuns } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-3">
        {/* Weekly miles bar chart */}
        <div className="card">
          <h3 className="card-title">Weekly Mileage</h3>
          <p className="card-subtitle">Miles per week — last 90 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyMilesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis
                dataKey="week"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(weeklyMilesData.length / 5)}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="miles" radius={[4, 4, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly miles stat */}
        <div className="card">
          <h3 className="card-title">Weekly Miles</h3>
          <p className="card-subtitle">Current week</p>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#6366f1', lineHeight: 1.1, marginTop: 8 }}>
            {weeklyMiles}
          </div>
          <p style={{ color: '#475569', fontSize: 12, marginTop: 6 }}>miles run</p>
        </div>

        {/* Recent runs list */}
        <div className="card">
          <h3 className="card-title">Recent Runs</h3>
          <p className="card-subtitle">Last {recentRuns.length} runs</p>
          {recentRuns.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>No recent runs found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {recentRuns.map((run, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.12)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                      {run.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{run.date}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>{run.miles} mi</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{run.movingTime} min</div>
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
