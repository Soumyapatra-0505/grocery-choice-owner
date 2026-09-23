import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const dimensions = {
    sm: { width: 32, height: 32, fontSize: '1.05rem', badgeSize: '0.65rem' },
    md: { width: 38, height: 38, fontSize: '1.25rem', badgeSize: '0.68rem' },
    lg: { width: 48, height: 48, fontSize: '1.5rem', badgeSize: '0.75rem' }
  }[size] || { width: 38, height: 38, fontSize: '1.25rem', badgeSize: '0.68rem' };

  return (
    <div
      className={`logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
        userSelect: 'none'
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={dimensions.width}
        height={dimensions.height}
        fill="none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(5, 150, 105, 0.25))', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ownerBagGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="ownerLeafGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Bag Base */}
        <rect x="4" y="14" width="40" height="30" rx="9" fill="url(#ownerBagGrad)" />

        {/* Handle */}
        <path
          d="M15 16 V11 C15 6.02944 19.0294 2 24 2 C28.9706 2 33 6.02944 33 11 V16"
          stroke="#064e3b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Monogram G */}
        <path
          d="M28 24 C26.8 22.5 24.8 21.5 22.5 21.5 C18.3579 21.5 15 24.8579 15 29 C15 33.1421 18.3579 36.5 22.5 36.5 C26.2 36.5 29.3 33.8 29.9 30.2 H23"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Leaf */}
        <path d="M30 6 C30 6 36 7 36 13 C31 13 30 6 30 6 Z" fill="url(#ownerLeafGrad)" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: dimensions.fontSize, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Grocery
          </span>
          <span style={{ fontSize: dimensions.fontSize, fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em' }}>
            Choice
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
          <span
            style={{
              fontSize: dimensions.badgeSize,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#a7f3d0',
              backgroundColor: 'rgba(5, 150, 105, 0.3)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}
          >
            Owner Portal
          </span>
        </div>
      </div>
    </div>
  );
}
