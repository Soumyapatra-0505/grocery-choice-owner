import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo';
import { useOwnerAuth } from '../../context/OwnerAuthContext';
import { useOwnerData } from '../../context/OwnerDataContext';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Tags,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { owner, logout } = useOwnerAuth();
  const { lowStockProducts, orders } = useOwnerData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={19} />, end: true },
    { to: '/products', label: 'Products', icon: <Package size={19} /> },
    { to: '/products/add', label: 'Add Product', icon: <PlusCircle size={19} /> },
    { to: '/categories', label: 'Categories', icon: <Tags size={19} /> },
    {
      to: '/inventory',
      label: 'Inventory',
      icon: <Boxes size={19} />,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} low` : null,
      badgeColor: '#ef4444'
    },
    {
      to: '/orders',
      label: 'Orders',
      icon: <ShoppingCart size={19} />,
      badge: orders.length ? `${orders.length}` : null
    },
    { to: '/customers', label: 'Customers', icon: <Users size={19} /> },
    { to: '/reports', label: 'Reports', icon: <BarChart3 size={19} /> }
  ];

  return (
    <aside className="owner-sidebar">
      {/* Brand Header */}
      <div
        style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <Logo size="sm" />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.75rem',
            color: '#34d399',
            backgroundColor: 'rgba(5, 150, 105, 0.15)',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            fontWeight: 700,
            border: '1px solid rgba(52, 211, 153, 0.25)'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
          <span>Live Store Active</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: isActive ? '#ffffff' : '#94a3b8',
              backgroundColor: isActive ? '#065f46' : 'transparent',
              transition: 'all 0.15s ease',
              border: isActive ? '1px solid #059669' : '1px solid transparent'
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {item.icon}
              <span className="sidebar-text-hide">{item.label}</span>
            </div>

            {item.badge && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  backgroundColor: item.badgeColor || '#059669',
                  color: '#ffffff',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px'
                }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Owner Profile & Logout */}
      <div
        style={{
          padding: '1.25rem 1rem',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#0b1324',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              flexShrink: 0
            }}
          >
            {owner?.name ? owner.name.charAt(0) : 'O'}
          </div>
          <div className="sidebar-text-hide" style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {owner?.name || 'Store Owner'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {owner?.role || 'Manager'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          title="Sign out of Owner Portal"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
