import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
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
        {payload[0].value} workout{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default function WorkoutFrequency({ data }) {
  return (
    <div className="card">
      <h3 className="card-title">Workout Frequency</h3>
      <p className="card-subtitle">Workouts per week — last 90 days</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis
            dataKey="week"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.count >= 3 ? '#6366f1' : entry.count === 2 ? '#8b5cf6' : '#3730a3'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
