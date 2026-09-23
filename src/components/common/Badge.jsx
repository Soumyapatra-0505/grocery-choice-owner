import React from 'react';

export default function Badge({ variant = 'default', children, className = '', size = 'md' }) {
  const styles = {
    success: {
      backgroundColor: '#ecfdf5',
      color: '#065f46',
      border: '1px solid #a7f3d0'
    },
    warning: {
      backgroundColor: '#fffbeb',
      color: '#92400e',
      border: '1px solid #fde68a'
    },
    danger: {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    info: {
      backgroundColor: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe'
    },
    default: {
      backgroundColor: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0'
    }
  }[variant] || {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0'
  };

  const padding = size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.65rem';
  const fontSize = size === 'sm' ? '0.72rem' : '0.78rem';

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: '6px',
        textTransform: 'capitalize',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        ...styles
      }}
    >
      {children}
    </span>
  );
}
