import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOwnerData } from '../../context/OwnerDataContext';
import { useOwnerAuth } from '../../context/OwnerAuthContext';
import Logo from '../../assets/Logo';
import {
  Bell,
  Search,
  Plus,
  ExternalLink,
  Store,
  AlertTriangle,
  CheckCircle2,
  Menu
} from 'lucide-react';

export default function OwnerHeader({ onOpenMobileDrawer }) {
  const { lowStockProducts } = useOwnerData();
  const { owner } = useOwnerAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const notificationRef = useRef(null);
  const bellButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);

  // Close notifications panel on outside click or Escape key press
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event) => {
      const isInsideContainer = notificationRef.current && notificationRef.current.contains(event.target);
      const isInsideButton = bellButtonRef.current && bellButtonRef.current.contains(event.target);
      const isInsidePanel = notificationPanelRef.current && notificationPanelRef.current.contains(event.target);

      if (!isInsideContainer && !isInsideButton && !isInsidePanel) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const ownerFirstName = owner?.fullName ? owner.fullName.split(' ')[0] : (owner?.name ? owner.name.split(' ')[0] : 'Owner');
  const ownerInitial = (owner?.fullName || owner?.name || 'O').charAt(0).toUpperCase();

  return (
    <header className="owner-header">
      {/* Left side: Mobile Hamburger + Brand Logo (Mobile only) + Desktop Search */}
      <div className="owner-header-left">
        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="mobile-hamburger-btn"
          aria-label="Open navigation menu"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Branding (visible only on mobile/tablet when sidebar is hidden) */}
        <div className="mobile-header-brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Logo size="sm" />
          </Link>
        </div>

        {/* Desktop Search Input (hidden on mobile) */}
        <div className="owner-header-search">
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="form-input"
            style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.85rem', width: '100%' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right side Actions */}
      <div className="owner-header-actions">
        {/* Quick Add Product Button (Desktop/Tablet) */}
        <Link to="/products/add" className="btn btn-primary btn-sm header-add-product-btn">
          <Plus size={16} />
          <span>Add Product</span>
        </Link>

        {/* Notifications Dropdown (Mobile + Desktop) */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button
            ref={bellButtonRef}
            type="button"
            onClick={() => setShowNotifications((p) => !p)}
            aria-label="Notifications"
            className="owner-header-icon-btn"
            title="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {lowStockProducts.length > 0 && (
              <span className="owner-header-bell-badge">
                {lowStockProducts.length > 99 ? '99+' : lowStockProducts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div ref={notificationPanelRef} className="owner-header-notification-popover">
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#0f172a' }}>
                Stock &amp; System Alerts
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

        {/* View Customer App Link (Desktop only) */}
        <a
          href={import.meta.env.VITE_CUSTOMER_STORE_URL || import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:5173'}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Customer Storefront"
          className="header-customer-store-btn"
        >
          <Store size={15} />
          <span>Customer Store</span>
          <ExternalLink size={13} />
        </a>

        {/* Owner Profile Account Button (Mobile + Desktop) */}
        <Link
          to="/profile"
          className="owner-header-user-btn"
          aria-label="Owner Profile"
          title={`Owner Profile: ${owner?.fullName || owner?.name || 'Store Owner'}`}
        >
          <div className="owner-header-avatar">
            {owner?.profilePicture ? (
              <img src={owner.profilePicture} alt={ownerFirstName} />
            ) : (
              <span>{ownerInitial}</span>
            )}
          </div>
          <span className="owner-header-user-name">{ownerFirstName}</span>
        </Link>
      </div>
    </header>
  );
}
