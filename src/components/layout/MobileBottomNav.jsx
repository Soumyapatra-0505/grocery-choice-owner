import React from 'react';
import { NavLink } from 'react-router-dom';
import { useOwnerData } from '../../context/OwnerDataContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ShieldCheck,
  Menu
} from 'lucide-react';

export default function MobileBottomNav({ onOpenMore }) {
  const { lowStockProducts, orders } = useOwnerData();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile primary navigation">
      {/* 1. Dashboard */}
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <div className="mobile-bottom-nav-icon-wrapper">
          <LayoutDashboard size={20} />
        </div>
        <span className="mobile-bottom-nav-label">Dashboard</span>
      </NavLink>

      {/* 2. Orders */}
      <NavLink
        to="/orders"
        className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <div className="mobile-bottom-nav-icon-wrapper">
          <ShoppingCart size={20} />
          {orders.length > 0 && (
            <span className="mobile-bottom-nav-badge">
              {orders.length > 99 ? '99+' : orders.length}
            </span>
          )}
        </div>
        <span className="mobile-bottom-nav-label">Orders</span>
      </NavLink>

      {/* 3. Inventory */}
      <NavLink
        to="/inventory"
        className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <div className="mobile-bottom-nav-icon-wrapper">
          <Boxes size={20} />
          {lowStockProducts.length > 0 && (
            <span className="mobile-bottom-nav-badge badge-warning">
              {lowStockProducts.length > 99 ? '99+' : lowStockProducts.length}
            </span>
          )}
        </div>
        <span className="mobile-bottom-nav-label">Inventory</span>
      </NavLink>

      {/* 4. Staff Management */}
      <NavLink
        to="/staff"
        className={({ isActive }) => `mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <div className="mobile-bottom-nav-icon-wrapper">
          <ShieldCheck size={20} />
        </div>
        <span className="mobile-bottom-nav-label">Staff</span>
      </NavLink>

      {/* 5. More Menu (Triggers Slide-in Drawer) */}
      <button
        type="button"
        onClick={onOpenMore}
        className="mobile-bottom-nav-item"
        aria-label="More navigation items"
      >
        <div className="mobile-bottom-nav-icon-wrapper">
          <Menu size={20} />
        </div>
        <span className="mobile-bottom-nav-label">More</span>
      </button>
    </nav>
  );
}
