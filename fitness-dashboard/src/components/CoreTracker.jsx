import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { differenceInDays } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e1e2e', border: '1px solid #2a2a3a',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
    }}>
      <p style={{ color: '#94a3b8', margin: 0 }}>{label}</p>
      <p style={{ color: '#f59e0b', margin: '4px 0 0', fontWeight: 600 }}>
        {payload[0].value} core set{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default function CoreTracker({ data, lastCoreDate }) {
  const daysSinceCore = lastCoreDate
    ? differenceInDays(new Date(), lastCoreDate)
    : null;

  const alerting = daysSinceCore === null || daysSinceCore >= 5;
  const totalCoreSets = data.reduce((s, d) => s + d.sets, 0);
  const coreWorkoutDays = data.filter((d) => d.sets > 0).length;

  return (
    <div className="card" style={{ borderColor: alerting ? '#7c2d12' : undefined }}>
      <div style={{ marginBottom: 16 }}>
        <h3 className="card-title">Core Tracker</h3>
        <p className="card-subtitle">Core sets logged per workout day — last 90 days</p>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <div>
          <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Total Core Sets</p>
          <p style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700, margin: '2px 0 0' }}>
            {totalCoreSets}
          </p>
        </div>
        <div>
          <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Days w/ Core Work</p>
          <p style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700, margin: '2px 0 0' }}>
            {coreWorkoutDays}
          </p>
        </div>
        <div>
          <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Avg Sets / Core Day</p>
          <p style={{ color: '#f59e0b', fontSize: 22, fontWeight: 700, margin: '2px 0 0' }}>
            {coreWorkoutDays > 0 ? (totalCoreSets / coreWorkoutDays).toFixed(1) : '—'}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 8)}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.08)' }} />
          <Bar dataKey="sets" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.sets > 0 ? '#f59e0b' : '#1e1e2e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p style={{
        color: '#475569', fontSize: 11, marginTop: 12, marginBottom: 0,
        borderTop: '1px solid #1e1e2e', paddingTop: 10,
        lineHeight: 1.5,
      }}>
        Ball Slams and similar explosive work are included as core activity.
        Exercises like planks, dead bugs, and ab wheel would appear here if logged in Hevy.
      </p>
    </div>
  );
}
