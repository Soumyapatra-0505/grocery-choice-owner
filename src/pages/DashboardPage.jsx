import React from 'react';
import { Link } from 'react-router-dom';
import { useOwnerData } from '../context/OwnerDataContext';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import {
  Package,
  ShoppingCart,
  Tags,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';

export default function DashboardPage() {
  const {
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    totalCategories,
    totalOrders,
    orders,
    loading,
    error,
    loadInitialData,
    updateStock,
    updateOrderStatus
  } = useOwnerData();

  const getOrderStatusVariant = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'Out for Delivery': return 'info';
      case 'Processing': return 'warning';
      case 'Cancelled': return 'danger';
      default: return 'default';
    }
  };

  const urgentRestockItems = [...outOfStockProducts, ...lowStockProducts];

  return (
    <div>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            Store Overview &amp; Live Metrics
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Real-time MySQL catalog data, inventory health alerts, and fulfillment tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={loadInitialData}
            className="btn btn-outline"
            title="Refresh from MySQL"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <Link to="/inventory" className="btn btn-outline">
            <RefreshCw size={15} />
            <span>Update Stock</span>
          </Link>
          <Link to="/products/add" className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Backend Error Banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 800 }}>Backend Connection Error</div>
              <div style={{ fontSize: '0.85rem' }}>{error}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={loadInitialData}
            className="btn btn-secondary btn-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="owner-card" style={{ padding: '2.5rem 1rem', textAlign: 'center', marginBottom: '2rem' }}>
          <RefreshCw size={32} color="#059669" className="spin" style={{ margin: '0 auto 0.75rem', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Synchronizing dashboard with MySQL database...</div>
        </div>
      )}

      {/* 5 Real KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <StatCard
          title="Total Products"
          value={totalProducts}
          subtitle={`${activeProducts} active items`}
          icon={<Package size={22} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
          trend={{ value: `${activeProducts} published`, isPositive: true }}
        />

        <StatCard
          title="Active Products"
          value={activeProducts}
          subtitle="Customer visible in catalog"
          icon={<CheckCircle2 size={22} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          trend={{ value: 'Live in store', isPositive: true }}
        />

        <StatCard
          title="Total Categories"
          value={totalCategories}
          subtitle="Storefront departments"
          icon={<Tags size={22} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          trend={{ value: 'Active departments', isPositive: true }}
        />

        <StatCard
          title="Low Stock Products"
          value={lowStockProducts.length}
          subtitle="Units between 1 and 10"
          icon={<AlertTriangle size={22} />}
          iconBg="#fffbeb"
          iconColor="#d97706"
          trend={{
            value: lowStockProducts.length > 0 ? 'Needs restock' : 'Optimal',
            isPositive: lowStockProducts.length === 0
          }}
        />

        <StatCard
          title="Out of Stock Products"
          value={outOfStockProducts.length}
          subtitle="0 units in inventory"
          icon={<XCircle size={22} />}
          iconBg="#fff1f2"
          iconColor="#e11d48"
          trend={{
            value: outOfStockProducts.length > 0 ? 'Urgent attention' : 'None',
            isPositive: outOfStockProducts.length === 0
          }}
        />
      </div>

      {/* 2 Column Section: Recent Orders & Urgent Restock List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Urgent Restock List Card (Real Backend Data) */}
        <div className="owner-card">
          <div className="owner-card-header">
            <div className="owner-card-title">
              <AlertTriangle size={18} color="#d97706" />
              <span>Low / Out of Stock Replenishment ({urgentRestockItems.length})</span>
            </div>
            <Link to="/inventory" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Inventory Control</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ padding: '1rem' }}>
            {urgentRestockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, color: '#0f172a' }}>All Inventory Fully Stocked</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                  No items in MySQL are currently at or below the 10 units threshold.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                {urgentRestockItems.slice(0, 6).map((prod) => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: prod.stockQuantity === 0 ? '#fff1f2' : '#f8fafc',
                      border: prod.stockQuantity === 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <img
                        src={prod.imageUrl || prod.image}
                        alt={prod.name}
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          SKU: {prod.sku || 'N/A'} &bull; Units: <strong style={{ color: prod.stockQuantity === 0 ? '#ef4444' : '#d97706' }}>{prod.stockQuantity}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <Badge variant={prod.stockQuantity === 0 ? 'danger' : 'warning'}>
                        {prod.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => updateStock(prod.id, prod.stockQuantity + 20)}
                        className="btn btn-secondary btn-sm"
                        title="Add 20 units via PATCH /api/products/{id}/stock"
                      >
                        +20 Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className="owner-card">
          <div className="owner-card-header">
            <div className="owner-card-title">
              <ShoppingCart size={18} color="#059669" />
              <span>Incoming Customer Orders ({orders.length} active / {totalOrders} total)</span>
            </div>
            <Link to="/orders" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="owner-table-container">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{order.id}</span>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{order.itemsCount} items</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.deliveryLocation}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>
                      ₹{order.total}
                    </td>
                    <td>
                      <Badge variant={getOrderStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Processing">Processing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
