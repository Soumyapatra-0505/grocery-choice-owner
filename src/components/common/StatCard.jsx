import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = '#ecfdf5',
  iconColor = '#059669',
  trend = null, // e.g. { value: '+12%', isPositive: true }
  className = ''
}) {
  return (
    <div
      className={`owner-card ${className}`}
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.25rem' }}>
            {value}
          </div>
        </div>

        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
        {subtitle && (
          <span style={{ color: '#64748b', fontWeight: 500 }}>
            {subtitle}
          </span>
        )}

        {trend && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 700,
              color: trend.isPositive ? '#059669' : '#dc2626'
            }}
          >
            {trend.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
