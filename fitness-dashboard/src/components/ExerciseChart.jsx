import React, { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const METRICS = [
  { key: 'volume', label: 'Volume (lbs)', color: '#6366f1', yAxis: 'left', type: 'bar' },
  { key: 'maxWeight', label: 'Max Weight (lbs)', color: '#f59e0b', yAxis: 'right', type: 'line' },
  { key: 'totalReps', label: 'Total Reps', color: '#10b981', yAxis: 'right', type: 'line' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e1e2e', border: '1px solid #2a2a3a',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <p style={{ color: '#94a3b8', margin: '0 0 6px', fontSize: 12 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0', fontWeight: 500 }}>
          {p.name}: <span style={{ color: '#e2e8f0' }}>
            {p.dataKey === 'volume'
              ? `${p.value.toLocaleString()} lbs`
              : p.dataKey === 'maxWeight'
              ? `${p.value} lbs`
              : `${p.value} reps`}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function ExerciseChart({ name, data }) {
  const [hidden, setHidden] = useState(new Set());

  const toggle = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (!data || data.length === 0) {
    return (
      <div className="card exercise-card">
        <h3 className="card-title" style={{ fontSize: 15 }}>{name}</h3>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ color: '#475569', fontSize: 13, textAlign: 'center' }}>
            No data in last 90 days
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card exercise-card">
      <div style={{ marginBottom: 12 }}>
        <h3 className="card-title" style={{ fontSize: 15 }}>{name}</h3>
        <p className="card-subtitle" style={{ fontSize: 11 }}>
          {data.length} session{data.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggle(m.key)}
            style={{
              padding: '3px 9px', borderRadius: 20, border: `1px solid ${m.color}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 500,
              background: hidden.has(m.key) ? 'transparent' : m.color + '22',
              color: hidden.has(m.key) ? '#475569' : m.color,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />

          {!hidden.has('volume') && (
            <Bar
              yAxisId="left"
              dataKey="volume"
              name="Volume"
              fill="#6366f1"
              fillOpacity={0.7}
              radius={[3, 3, 0, 0]}
            />
          )}
          {!hidden.has('maxWeight') && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="maxWeight"
              name="Max Weight"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
              activeDot={{ r: 5 }}
            />
          )}
          {!hidden.has('totalReps') && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalReps"
              name="Total Reps"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 5 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
