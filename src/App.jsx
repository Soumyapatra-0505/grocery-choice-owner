import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { OwnerAuthProvider, useOwnerAuth } from './context/OwnerAuthContext';
import { OwnerDataProvider } from './context/OwnerDataContext';

// Layout
import OwnerLayout from './components/layout/OwnerLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import CategoriesPage from './pages/CategoriesPage';
import InventoryPage from './pages/InventoryPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import StaffManagementPage from './pages/StaffManagementPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, owner } = useOwnerAuth();
  if (!isAuthenticated || !owner || (owner.role !== 'OWNER' && owner.role !== 'ADMIN' && owner.role !== 'STAFF')) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <OwnerAuthProvider>
      <OwnerDataProvider>
        <Router>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Owner Portal Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/add" element={<AddProductPage />} />
              <Route path="products/edit/:id" element={<EditProductPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="staff" element={<StaffManagementPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </OwnerDataProvider>
    </OwnerAuthProvider>
  );
}
