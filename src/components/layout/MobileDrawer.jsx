import React, { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  User,
  LogOut,
  X,
  Store,
  ExternalLink
} from 'lucide-react';

export default function MobileDrawer({ isOpen, onClose }) {
  const { owner, logout } = useOwnerAuth();
  const { lowStockProducts, orders } = useOwnerData();
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
    { to: '/products', label: 'Products', icon: <Package size={20} /> },
    { to: '/products/add', label: 'Add Product', icon: <PlusCircle size={20} /> },
    { to: '/categories', label: 'Categories', icon: <Tags size={20} /> },
    {
      to: '/inventory',
      label: 'Inventory',
      icon: <Boxes size={20} />,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} low` : null,
      badgeColor: '#ef4444'
    },
    {
      to: '/orders',
      label: 'Orders',
      icon: <ShoppingCart size={20} />,
      badge: orders.length ? `${orders.length}` : null
    },
    { to: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { to: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { to: '/staff', label: 'Staff Management', icon: <ShieldCheck size={20} /> },
    { to: '/profile', label: 'Profile', icon: <User size={20} /> }
  ];

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-root" aria-modal="true" role="dialog">
      {/* Backdrop Overlay */}
      <div
        className="mobile-drawer-backdrop"
        onClick={onClose}
        aria-label="Close navigation drawer"
      />

      {/* Drawer Container */}
      <aside className="mobile-drawer-panel">
        {/* Drawer Header with Branding & Close Button */}
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Logo size="sm" />
            <button
              type="button"
              onClick={onClose}
              className="mobile-drawer-close-btn"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mobile-drawer-live-pill">
            <span className="live-dot" />
            <span>Live Store Active</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="mobile-drawer-nav">
          <div className="mobile-drawer-section-title">Store Management</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `mobile-drawer-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="mobile-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className="mobile-nav-badge"
                  style={{ backgroundColor: item.badgeColor || '#059669' }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Quick link to Customer Store */}
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #1e293b' }}>
            <a
              href={import.meta.env.VITE_CUSTOMER_STORE_URL || import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:5173'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="mobile-drawer-external-link"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Store size={18} color="#34d399" />
                <span>Customer Storefront</span>
              </div>
              <ExternalLink size={14} color="#64748b" />
            </a>
          </div>
        </nav>

        {/* Footer: Owner Profile & Sign Out */}
        <div className="mobile-drawer-footer">
          <Link
            to="/profile"
            onClick={onClose}
            className="mobile-drawer-user-info"
            title="View Profile"
          >
            <div className="mobile-drawer-avatar">
              {owner?.profilePicture ? (
                <img src={owner.profilePicture} alt="Avatar" />
              ) : (
                (owner?.fullName || owner?.name || 'O').charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="mobile-drawer-user-name">
                {owner?.fullName || owner?.name || 'Store User'}
              </div>
              <div className="mobile-drawer-user-role">
                {owner?.primaryOwner ? 'Primary Owner' : (owner?.designation || owner?.role || 'Staff')}
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="mobile-drawer-logout-btn"
            title="Sign out of Owner Portal"
            aria-label="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </div>
  );
}
