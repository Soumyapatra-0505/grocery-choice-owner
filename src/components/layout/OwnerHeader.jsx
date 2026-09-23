import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOwnerData } from '../../context/OwnerDataContext';
import {
  Bell,
  Search,
  Plus,
  ExternalLink,
  Store,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function OwnerHeader() {
  const { lowStockProducts } = useOwnerData();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="owner-header">
      {/* Search Input */}
      <div style={{ position: 'relative', width: '320px' }}>
        <Search
          size={16}
          color="#94a3b8"
          style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Search products, orders, customers..."
          className="form-input"
          style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.85rem' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`);
            }
          }}
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Quick Add Product Button */}
        <Link to="/products/add" className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span>Add Product</span>
        </Link>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowNotifications((p) => !p)}
            aria-label="Notifications"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              position: 'relative'
            }}
          >
            <Bell size={18} />
            {lowStockProducts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}
              >
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '320px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 50,
                padding: '1rem'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#0f172a' }}>
                Stock & System Alerts
              </div>

              {lowStockProducts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {lowStockProducts.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem'
                      }}
                    >
                      <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#92400e' }}>{item.name}</div>
                        <div style={{ color: '#b45309' }}>Only {item.stockCount} units remaining in stock.</div>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/inventory"
                    onClick={() => setShowNotifications(false)}
                    style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', textAlign: 'center', display: 'block', marginTop: '0.25rem' }}
                  >
                    View all in Inventory &rarr;
                  </Link>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle2 size={24} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                  All inventory stock levels are healthy!
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Customer App Link */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          title="Open Customer Storefront"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#059669',
            backgroundColor: '#ecfdf5',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #a7f3d0'
          }}
        >
          <Store size={15} />
          <span>Customer Store</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </header>
  );
}
