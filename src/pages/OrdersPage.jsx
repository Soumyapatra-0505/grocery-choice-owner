import React, { useState } from 'react';
import { useOwnerData } from '../context/OwnerDataContext';
import { orderApi } from '../services/api';
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
  RefreshCw,
  Truck,
  UserPlus
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
  const { orders, updateOrderStatus, assignDeliveryPartner, fetchOrders, loading } = useOwnerData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: '' }
  const [updatingId, setUpdatingId] = useState(null);

  // Delivery partner assignment state
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignError, setAssignError] = useState(null);

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateStr);
    }
  };

  const openAssignModal = async (order, e) => {
    if (e) e.stopPropagation();
    if (order.status !== 'PROCESSING') return;
    setAssignModalOrder(order);
    setSelectedPartnerId(order.assignedDeliveryPartnerId ? String(order.assignedDeliveryPartnerId) : '');
    setAssignError(null);
    setLoadingPartners(true);
    try {
      const partners = await orderApi.getEligibleDeliveryPartners();
      // Display active DELIVERY users
      const activeRiders = (Array.isArray(partners) ? partners : []).filter(
        (p) => (p.role === 'DELIVERY' || !p.role) && (p.status === 'ACTIVE' || !p.status)
      );
      setDeliveryPartners(activeRiders);
    } catch (err) {
      console.error('Failed to load eligible delivery partners:', err);
      setAssignError(err.message || 'Failed to load delivery partners');
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assignModalOrder || !selectedPartnerId) return;
    if (String(selectedPartnerId) === String(assignModalOrder.assignedDeliveryPartnerId)) {
      setAssignError('This delivery partner is already assigned to this order.');
      return;
    }
    try {
      setSubmittingAssign(true);
      setAssignError(null);
      const updated = await assignDeliveryPartner(assignModalOrder.id, Number(selectedPartnerId));
      setFeedback({
        type: 'success',
        message: `Delivery partner assigned to Order #${updated.orderNumber || assignModalOrder.orderNumber}!`
      });
      // If modal is open for this order, update selectedOrder
      if (selectedOrder && selectedOrder.id === assignModalOrder.id) {
        setSelectedOrder(updated);
      }
      setAssignModalOrder(null);
      setTimeout(() => {
        setFeedback((prev) => (prev?.type === 'success' ? null : prev));
      }, 3500);
    } catch (err) {
      console.error('Delivery assignment failed:', err);
      setAssignError(err.message || 'Failed to assign delivery partner.');
    } finally {
      setSubmittingAssign(false);
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
            Inspect customer orders, review item breakdowns, and update delivery fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders()}
          className="btn btn-secondary btn-sm"
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
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            placeholder="Search Order Number, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', overflowX: 'auto', maxWidth: '100%' }}>
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
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: isActive ? '1px solid #059669' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#ecfdf5' : '#ffffff',
                  color: isActive ? '#059669' : '#64748b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Container (Table on Desktop, Cards on Mobile) */}
      <div className="owner-card">
        {/* Desktop Table View */}
        <div className="owner-table-container desktop-only-table">
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

                    {/* Order Status Badge & Assigned Partner */}
                    <td>
                      <Badge variant={getStatusVariant(ord.status)}>
                        {formatStatusLabel(ord.status)}
                      </Badge>
                      {ord.assignedDeliveryPartnerName && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            color: '#059669',
                            fontWeight: 600,
                            marginTop: '0.25rem'
                          }}
                          title={`Assigned Partner: ${ord.assignedDeliveryPartnerName}${ord.assignedDeliveryPartnerPhone ? ' (' + ord.assignedDeliveryPartnerPhone + ')' : ''}`}
                        >
                          <Truck size={12} />
                          <span>{ord.assignedDeliveryPartnerName}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions: Assign Partner (PROCESSING only), View Details & Status Update Select */}
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {ord.status === 'PROCESSING' && (
                          <button
                            type="button"
                            onClick={(e) => openAssignModal(ord, e)}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.3rem 0.55rem',
                              fontSize: '0.75rem',
                              borderColor: '#a7f3d0',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                            title={ord.assignedDeliveryPartnerName ? 'Reassign Delivery Partner' : 'Assign Delivery Partner'}
                          >
                            <Truck size={13} />
                            <span>{ord.assignedDeliveryPartnerName ? 'Reassign' : 'Assign Partner'}</span>
                          </button>
                        )}

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

        {/* Mobile Cards View */}
        <div className="mobile-only-cards" style={{ padding: '0.75rem' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <ShoppingCart size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700, color: '#0f172a' }}>No orders found</div>
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div
                key={ord.id}
                className="mobile-data-card"
                onClick={() => setSelectedOrder(ord)}
                style={{ cursor: 'pointer' }}
              >
                <div className="mobile-data-card-header">
                  <div>
                    <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.92rem', fontFamily: 'monospace' }}>
                      {ord.orderNumber}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                      <Clock size={12} />
                      <span>
                        {ord.createdAt
                          ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(ord.status)}>
                    {formatStatusLabel(ord.status)}
                  </Badge>
                </div>

                <div className="mobile-data-card-body">
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Customer</span>
                    <span className="mobile-data-card-value">{ord.customerName}</span>
                  </div>
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Phone</span>
                    <span className="mobile-data-card-value" style={{ fontWeight: 600, color: '#475569' }}>{ord.customerPhone}</span>
                  </div>
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Total Amount</span>
                    <span className="mobile-data-card-value" style={{ color: '#059669', fontSize: '1rem' }}>
                      ₹{ord.totalAmount !== undefined ? ord.totalAmount : ord.total}
                    </span>
                  </div>
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Payment</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: ord.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                        color: ord.paymentStatus === 'PAID' ? '#065f46' : '#b45309'
                      }}
                    >
                      {ord.paymentStatus || 'PENDING'}
                    </span>
                  </div>
                  {ord.assignedDeliveryPartnerName && (
                    <div className="mobile-data-card-row">
                      <span className="mobile-data-card-label">Rider</span>
                      <span className="mobile-data-card-value" style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Truck size={13} />
                        <span>{ord.assignedDeliveryPartnerName}</span>
                        {ord.assignedDeliveryPartnerPhone && (
                          <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>
                            ({ord.assignedDeliveryPartnerPhone})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mobile-data-card-actions" onClick={(e) => e.stopPropagation()}>
                  {ord.status === 'PROCESSING' && (
                    <button
                      type="button"
                      onClick={(e) => openAssignModal(ord, e)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        minHeight: '38px',
                        color: '#059669',
                        borderColor: '#a7f3d0',
                        backgroundColor: '#ecfdf5',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Truck size={14} />
                      <span>{ord.assignedDeliveryPartnerName ? 'Reassign Rider' : 'Assign Rider'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minHeight: '38px' }}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>

                  <select
                    value={ord.status}
                    disabled={updatingId === ord.id || ord.status === 'CANCELLED' || ord.status === 'DELIVERED'}
                    onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backgroundColor: ord.status === 'CANCELLED' || ord.status === 'DELIVERED' ? '#f1f5f9' : '#ffffff',
                      minHeight: '38px'
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
            ))
          )}
        </div>
      </div>

      {/* Responsive Order Details Modal */}
      {selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '680px', width: '100%', padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Order Details</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.35rem' }}
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.85rem', margin: '1rem 0', backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', marginBottom: '0.3rem' }}>Customer Details</div>
                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.customerEmail}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.customerPhone}</div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={13} color="#059669" /> Delivery Address
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                  {selectedOrder.deliveryAddressText || selectedOrder.deliveryLocation}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem' }}>
                  Slot: <strong>{selectedOrder.deliverySlot || 'Standard'}</strong>
                </div>
              </div>
            </div>

            {/* Delivery Fulfillment & Tracking */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={15} color="#059669" />
                  <span>Delivery Fulfillment</span>
                </div>
                {selectedOrder.status === 'PROCESSING' && (
                  <button
                    type="button"
                    onClick={(e) => openAssignModal(selectedOrder, e)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.75rem',
                      color: '#059669',
                      borderColor: '#a7f3d0',
                      backgroundColor: '#ecfdf5',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <UserPlus size={13} />
                    <span>{selectedOrder.assignedDeliveryPartnerName ? 'Change Partner' : 'Assign Partner'}</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '0.65rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Delivery Partner</span>
                  <span style={{ fontWeight: 700, color: selectedOrder.assignedDeliveryPartnerName ? '#0f172a' : '#94a3b8' }}>
                    {selectedOrder.assignedDeliveryPartnerName || 'Not Assigned'}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Delivery Partner Phone</span>
                  <span style={{ fontWeight: 600, color: selectedOrder.assignedDeliveryPartnerPhone ? '#334155' : '#94a3b8' }}>
                    {selectedOrder.assignedDeliveryPartnerPhone || '—'}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Assigned At</span>
                  <span style={{ color: '#334155' }}>
                    {formatDateTime(selectedOrder.assignedAt)}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Accepted At</span>
                  <span style={{ color: '#334155' }}>
                    {formatDateTime(selectedOrder.acceptedAt)}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Picked Up At</span>
                  <span style={{ color: '#334155' }}>
                    {formatDateTime(selectedOrder.pickedUpAt)}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Delivered At</span>
                  <span style={{ color: '#334155' }}>
                    {formatDateTime(selectedOrder.deliveredAt)}
                  </span>
                </div>
              </div>

              {selectedOrder.deliveryNotes && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                  <span style={{ fontWeight: 600 }}>Delivery Notes: </span>{selectedOrder.deliveryNotes}
                </div>
              )}
            </div>

            {/* Ordered Products Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                Ordered Products ({selectedOrder.items?.length || 0})
              </div>
              <div className="owner-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.65rem', borderRadius: '6px 0 0 6px' }}>Product</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Unit</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Price</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Qty</th>
                      <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.55rem 0.65rem', fontWeight: 600, color: '#0f172a' }}>
                            {item.productName || item.name}
                          </td>
                          <td style={{ padding: '0.55rem 0.45rem', color: '#64748b' }}>
                            {item.unit}
                          </td>
                          <td style={{ padding: '0.55rem 0.45rem', color: '#334155' }}>
                            ₹{item.price}
                          </td>
                          <td style={{ padding: '0.55rem 0.45rem', fontWeight: 700 }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
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
            </div>

            {/* Financial Summary */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{selectedOrder.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Delivery Charge</span>
                <span style={{ fontWeight: 600, color: selectedOrder.deliveryCharge > 0 ? '#0f172a' : '#059669' }}>
                  {selectedOrder.deliveryCharge > 0 ? `₹${selectedOrder.deliveryCharge}` : 'FREE (Order >= ₹500)'}
                </span>
              </div>
              {selectedOrder.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', color: '#059669' }}>
                  <span>Discount</span>
                  <span>-₹{selectedOrder.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                <span>Final Total</span>
                <span style={{ color: '#059669' }}>₹{selectedOrder.totalAmount !== undefined ? selectedOrder.totalAmount : selectedOrder.total}</span>
              </div>
            </div>

            {/* Status & Update in Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.15rem' }}>Status</div>
                <Badge variant={getStatusVariant(selectedOrder.status)}>
                  {formatStatusLabel(selectedOrder.status)}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Change:</span>
                <select
                  value={selectedOrder.status}
                  disabled={updatingId === selectedOrder.id || selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'DELIVERED'}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #059669',
                    fontSize: '0.82rem',
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

      {/* Assign Delivery Partner Modal */}
      {assignModalOrder && (
        <div
          className="modal-overlay"
          onClick={() => !submittingAssign && setAssignModalOrder(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '520px', width: '100%', padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Assign Delivery Partner
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Order #{assignModalOrder.orderNumber} ({formatStatusLabel(assignModalOrder.status)})
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={submittingAssign}
                onClick={() => setAssignModalOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.35rem' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Banner */}
            {assignError && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <AlertCircle size={15} />
                <span>{assignError}</span>
              </div>
            )}

            {/* Content: Partners List */}
            <div style={{ margin: '1rem 0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                Select Active Delivery Partner:
              </div>

              {loadingPartners ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#059669' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading active delivery partners...</div>
                </div>
              ) : deliveryPartners.length === 0 ? (
                <div style={{ padding: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.85rem', textAlign: 'center' }}>
                  <AlertCircle size={24} color="#d97706" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>No Active Delivery Partners Found</div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#b45309' }}>
                    Please add or activate delivery accounts with role <strong>DELIVERY</strong> in Staff Management.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                  {deliveryPartners.map((partner) => {
                    const isSelected = String(selectedPartnerId) === String(partner.id);
                    const isCurrentlyAssigned = String(assignModalOrder.assignedDeliveryPartnerId) === String(partner.id);

                    return (
                      <label
                        key={partner.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.9rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <input
                            type="radio"
                            name="deliveryPartner"
                            value={partner.id}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedPartnerId(partner.id);
                              setAssignError(null);
                            }}
                            style={{ accentColor: '#059669', width: 16, height: 16, cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{partner.fullName}</span>
                              {isCurrentlyAssigned && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 4, backgroundColor: '#dcfce7', color: '#166534' }}>
                                  Current
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.15rem' }}>
                              {partner.phone && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <Phone size={11} /> {partner.phone}
                                </span>
                              )}
                              <span>• {partner.designation || 'Delivery Partner'}</span>
                              {partner.storeHub && <span>• {partner.storeHub}</span>}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                disabled={submittingAssign}
                onClick={() => setAssignModalOrder(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !selectedPartnerId ||
                  String(selectedPartnerId) === String(assignModalOrder.assignedDeliveryPartnerId) ||
                  submittingAssign ||
                  loadingPartners
                }
                onClick={handleConfirmAssignment}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {submittingAssign ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : String(selectedPartnerId) === String(assignModalOrder.assignedDeliveryPartnerId) ? (
                  <span>Already Assigned</span>
                ) : (
                  <>
                    <Truck size={14} />
                    <span>Confirm Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
