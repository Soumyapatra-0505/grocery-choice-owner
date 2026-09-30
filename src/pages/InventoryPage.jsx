import React, { useState } from 'react';
import { useOwnerData } from '../context/OwnerDataContext';
import Badge from '../components/common/Badge';
import {
  Boxes,
  Search,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function InventoryPage() {
  const {
    products,
    updateStock,
    lowStockProducts,
    loading,
    error,
    loadInitialData
  } = useOwnerData();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low_stock, out_of_stock, in_stock
  const [successToast, setSuccessToast] = useState('');

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast('');
    }, 3000);
  };

  const handleStockUpdate = async (productId, productName, newCount) => {
    const validCount = Math.max(0, Number(newCount));
    try {
      await updateStock(productId, validCount);
      showToast(`Updated stock for "${productName}" to ${validCount} units.`);
    } catch (err) {
      alert(`Stock update failed: ${err.message}`);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(search.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    if (filter === 'low_stock') {
      return matchesSearch && p.stockQuantity <= 10 && p.stockQuantity > 0;
    }
    if (filter === 'out_of_stock') {
      return matchesSearch && p.stockQuantity === 0;
    }
    if (filter === 'in_stock') {
      return matchesSearch && p.stockQuantity > 10;
    }
    return matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Inventory &amp; Stock Levels
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Monitor real-time warehouse stock counts and replenish low inventory items.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadInitialData}
            className="btn btn-outline btn-sm"
            title="Refresh from MySQL"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>

          {lowStockProducts.length > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <AlertTriangle size={15} color="#d97706" />
              <span>{lowStockProducts.length} items need restock</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Banner */}
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
            gap: '1rem',
            flexWrap: 'wrap'
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
            placeholder="Search inventory by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', overflowX: 'auto', maxWidth: '100%' }}>
          {[
            { id: 'all', label: `All (${products.length})` },
            { id: 'low_stock', label: `Low Stock (1-10)` },
            { id: 'out_of_stock', label: `Out of Stock (0)` },
            { id: 'in_stock', label: `In Stock (>10)` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: filter === tab.id ? '1px solid #059669' : '1px solid #e2e8f0',
                backgroundColor: filter === tab.id ? '#ecfdf5' : '#ffffff',
                color: filter === tab.id ? '#059669' : '#64748b',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="owner-card" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
          <RefreshCw size={32} color="#059669" className="spin" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Loading inventory counts from database...</div>
        </div>
      )}

      {/* Inventory Container (Table on Desktop, Cards on Mobile) */}
      {!loading && (
        <div className="owner-card">
          {/* Desktop Table View */}
          <div className="owner-table-container desktop-only-table">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Product &amp; SKU</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Current Units</th>
                  <th>Status</th>
                  <th>Quick Restock (+Units)</th>
                  <th style={{ textAlign: 'right' }}>Set Exact Count</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                      <Boxes size={38} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>No matching inventory records found</div>
                      <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>Try clearing filters or search terms.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={prod.imageUrl || prod.image}
                            alt={prod.name}
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              SKU: <code>{prod.sku || 'N/A'}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {prod.categoryName}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          {prod.unit}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: prod.stockQuantity === 0 ? '#ef4444' : prod.stockQuantity <= 10 ? '#d97706' : '#059669'
                          }}
                        >
                          {prod.stockQuantity} units
                        </span>
                      </td>

                      <td>
                        <Badge
                          variant={
                            prod.stockQuantity === 0
                              ? 'danger'
                              : prod.stockQuantity <= 10
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {prod.stockQuantity === 0
                            ? 'Out of Stock'
                            : prod.stockQuantity <= 10
                            ? 'Low Stock'
                            : 'In Stock'}
                        </Badge>
                      </td>

                      {/* Quick Restock Buttons */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(prod.id, prod.name, prod.stockQuantity + 10)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(prod.id, prod.name, prod.stockQuantity + 25)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Add 25 units"
                          >
                            +25
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockUpdate(prod.id, prod.name, prod.stockQuantity + 50)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Add 50 units"
                          >
                            +50
                          </button>
                        </div>
                      </td>

                      {/* Set Exact Count */}
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          value={prod.stockQuantity}
                          onChange={(e) => handleStockUpdate(prod.id, prod.name, e.target.value)}
                          style={{
                            width: '70px',
                            textAlign: 'center',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontWeight: 700,
                            fontSize: '0.88rem'
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-only-cards" style={{ padding: '0.75rem' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <Boxes size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, color: '#0f172a' }}>No matching inventory records found</div>
              </div>
            ) : (
              filtered.map((prod) => (
                <div key={prod.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <img
                        src={prod.imageUrl || prod.image}
                        alt={prod.name}
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                          SKU: {prod.sku || 'N/A'} &bull; {prod.categoryName}
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        prod.stockQuantity === 0
                          ? 'danger'
                          : prod.stockQuantity <= 10
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {prod.stockQuantity === 0
                        ? 'Out of Stock'
                        : prod.stockQuantity <= 10
                        ? 'Low Stock'
                        : 'In Stock'}
                    </Badge>
                  </div>

                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-row">
                      <span className="mobile-data-card-label">Current Stock</span>
                      <span
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: prod.stockQuantity === 0 ? '#ef4444' : prod.stockQuantity <= 10 ? '#d97706' : '#059669'
                        }}
                      >
                        {prod.stockQuantity} {prod.unit || 'units'}
                      </span>
                    </div>

                    <div className="mobile-data-card-row" style={{ alignItems: 'center' }}>
                      <span className="mobile-data-card-label">Quick Restock</span>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(prod.id, prod.name, prod.stockQuantity + 10)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '34px' }}
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(prod.id, prod.name, prod.stockQuantity + 25)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '34px' }}
                        >
                          +25
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(prod.id, prod.name, prod.stockQuantity + 50)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '34px' }}
                        >
                          +50
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-data-card-actions" style={{ justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Set Exact Units:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="number"
                        min="0"
                        defaultValue={prod.stockQuantity}
                        id={`exact-stock-${prod.id}`}
                        style={{
                          width: '70px',
                          textAlign: 'center',
                          padding: '0.35rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          height: '36px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`exact-stock-${prod.id}`);
                          if (input) handleStockUpdate(prod.id, prod.name, input.value);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ minHeight: '36px', padding: '0.35rem 0.75rem' }}
                      >
                        Set
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
