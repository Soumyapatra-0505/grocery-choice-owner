import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import OwnerHeader from './OwnerHeader';

export default function OwnerLayout() {
  return (
    <div className="owner-app-layout">
      <Sidebar />
      <div className="owner-main-content">
        <OwnerHeader />
        <main className="owner-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
