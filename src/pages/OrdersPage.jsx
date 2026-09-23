import React, { useState } from 'react';
import { useOwnerData } from '../context/OwnerDataContext';
import Badge from '../components/common/Badge';
import {
  ShoppingCart,
  Search,
  MapPin,
  Phone,
  Clock,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Placed', value: 'PLACED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' }
];

export default function OrdersPage() {
  const { orders, updateOrderStatus, fetchOrders, loading } = useOwnerData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: '' }
  const [updatingId, setUpdatingId] = useState(null);

  const filteredOrders = orders.filter((ord) => {
    const s = search.toLowerCase();
    const matchesSearch =
      (ord.orderNumber && ord.orderNumber.toLowerCase().includes(s)) ||
      (String(ord.id).toLowerCase().includes(s)) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(s)) ||
      (ord.customerPhone && ord.customerPhone.includes(s));

    const matchesStatus =
      statusFilter === 'all' ||
      ord.status === statusFilter ||
      ord.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return 'success';
      case 'OUT_FOR_DELIVERY': return 'info';
      case 'PROCESSING': return 'warning';
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'danger';
      case 'PLACED':
      default: return 'default';
    }
  };

  const formatStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      case 'PLACED': return 'Placed';
      case 'CONFIRMED': return 'Confirmed';
      case 'PROCESSING': return 'Processing';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setFeedback(null);
      const updated = await updateOrderStatus(orderId, newStatus);
      setFeedback({
        type: 'success',
        message: `Order #${updated.orderNumber || orderId} status updated to ${formatStatusLabel(newStatus)}!`
      });

      // If modal is open for this order, update selectedOrder
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }

      setTimeout(() => {
        setFeedback((prev) => (prev?.type === 'success' ? null : prev));
      }, 3500);
    } catch (err) {
      console.error('Status update failed:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update order status.'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Customer Orders ({orders.length})
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Inspect customer orders from MySQL, review item breakdowns, and update delivery fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders()}
          className="btn btn-secondary"
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        className="owner-card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search Order Number, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((f) => {
            const count = f.value === 'all'
              ? orders.length
              : orders.filter((o) => o.status === f.value || o.status?.toLowerCase() === f.value.toLowerCase()).length;
            const isActive = statusFilter === f.value;

            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: isActive ? '1px solid #059669' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#ecfdf5' : '#ffffff',
                  color: isActive ? '#059669' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="owner-card">
        <div className="owner-table-container">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <ShoppingCart size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>No orders found</div>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Orders placed through the Customer app will appear here in real time.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedOrder(ord)}
                  >
                    {/* Order Number */}
                    <td>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                        {ord.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {ord.itemsCount || ord.items?.length || 0} items
                      </div>
                    </td>

                    {/* Customer */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                        {ord.customerName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Phone size={12} />
                        <span>{ord.customerPhone}</span>
                      </div>
                    </td>

                    {/* Order Date */}
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} color="#94a3b8" />
                        <span>
                          {ord.createdAt
                            ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{ord.totalAmount !== undefined ? ord.totalAmount : ord.total}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          backgroundColor: ord.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                          color: ord.paymentStatus === 'PAID' ? '#065f46' : '#b45309',
                          border: `1px solid ${ord.paymentStatus === 'PAID' ? '#a7f3d0' : '#fde68a'}`
                        }}
                      >
                        {ord.paymentStatus || 'PENDING'}
                      </span>
                    </td>

                    {/* Order Status Badge */}
                    <td>
                      <Badge variant={getStatusVariant(ord.status)}>
                        {formatStatusLabel(ord.status)}
                      </Badge>
                    </td>

                    {/* Actions: View Details & Status Update Select */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          title="View order details"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        <select
                          value={ord.status}
                          disabled={updatingId === ord.id || ord.status === 'CANCELLED' || ord.status === 'DELIVERED'}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            backgroundColor: ord.status === 'CANCELLED' || ord.status === 'DELIVERED' ? '#f1f5f9' : '#ffffff',
                            cursor: ord.status === 'CANCELLED' || ord.status === 'DELIVERED' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <option value="PLACED">Placed</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '1.75rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Order Details</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', margin: '1.25rem 0', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Customer Details</div>
                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.customerEmail}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.customerPhone}</div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={13} color="#059669" /> Delivery Address
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                  {selectedOrder.deliveryAddressText || selectedOrder.deliveryLocation}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Slot: <strong>{selectedOrder.deliverySlot || 'Standard'}</strong>
                </div>
              </div>
            </div>

            {/* Ordered Products Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                Ordered Products ({selectedOrder.items?.length || 0})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem', borderRadius: '6px 0 0 6px' }}>Product</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Unit</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Price</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Qty</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>
                          {item.productName || item.name}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', color: '#64748b' }}>
                          {item.unit}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', color: '#334155' }}>
                          ₹{item.price}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                          ₹{item.subtotal || (item.price * item.quantity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>
                        No snapshot item details available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{selectedOrder.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Delivery Charge</span>
                <span style={{ fontWeight: 600, color: selectedOrder.deliveryCharge > 0 ? '#0f172a' : '#059669' }}>
                  {selectedOrder.deliveryCharge > 0 ? `₹${selectedOrder.deliveryCharge}` : 'FREE (Order >= ₹500)'}
                </span>
              </div>
              {selectedOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', color: '#059669' }}>
                  <span>Discount</span>
                  <span>-₹{selectedOrder.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid #e2e8f0', fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                <span>Final Total</span>
                <span style={{ color: '#059669' }}>₹{selectedOrder.totalAmount !== undefined ? selectedOrder.totalAmount : selectedOrder.total}</span>
              </div>
            </div>

            {/* Status & Update in Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.2rem' }}>Current Order Status</div>
                <Badge variant={getStatusVariant(selectedOrder.status)}>
                  {formatStatusLabel(selectedOrder.status)}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Update Status:</span>
                <select
                  value={selectedOrder.status}
                  disabled={updatingId === selectedOrder.id || selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'DELIVERED'}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #059669',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="PLACED">Placed</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
