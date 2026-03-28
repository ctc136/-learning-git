import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#1e1e2e', border: '1px solid #2a2a3a',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
    }}>
      <p style={{ color: d.color, margin: 0, fontWeight: 600 }}>{d.label}</p>
      <p style={{ color: '#e2e8f0', margin: '4px 0 0' }}>
        {d.volume.toLocaleString()} lbs total volume
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function VolumeChart({ data }) {
  const [view, setView] = useState('donut');
  const top = data.slice(0, 8);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 className="card-title">Volume by Muscle Group</h3>
          <p className="card-subtitle">Total lbs lifted per muscle — last 90 days</p>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          {['donut', 'bar'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500,
                background: view === v ? '#6366f1' : '#1e1e2e',
                color: view === v ? '#fff' : '#64748b',
              }}
            >
              {v === 'donut' ? 'Donut' : 'Bar'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        {view === 'donut' ? (
          <PieChart>
            <Pie
              data={top}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              dataKey="volume"
              nameKey="label"
              labelLine={false}
              label={renderCustomLabel}
            >
              {top.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry) => (
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{entry.payload.label}</span>
              )}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        ) : (
          <BarChart data={top} layout="vertical" margin={{ top: 0, right: 16, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={78}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
              {top.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
