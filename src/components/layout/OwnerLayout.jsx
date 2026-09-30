import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import OwnerHeader from './OwnerHeader';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';

export default function OwnerLayout() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer when route changes (React 19 recommended pattern)
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsMobileDrawerOpen(false);
  }

  return (
    <div className="owner-app-layout">
      {/* Desktop Sidebar (visible on >= 1024px) */}
      <Sidebar />

      {/* Mobile Navigation Drawer (slide-in on < 1024px) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main App Container */}
      <div className="owner-main-content">
        <OwnerHeader
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        />

        <main className="owner-page-body">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (visible on < 1024px) */}
        <MobileBottomNav
          onOpenMore={() => setIsMobileDrawerOpen(true)}
        />
      </div>
    </div>
  );
}
