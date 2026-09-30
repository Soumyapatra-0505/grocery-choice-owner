import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useOwnerData } from '../context/OwnerDataContext';
import Badge from '../components/common/Badge';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  RefreshCw,
  Boxes,
  CheckCircle2,
  X
} from 'lucide-react';

export default function ProductsPage() {
  const {
    products,
    categories,
    loading,
    error,
    loadInitialData,
    deleteProduct,
    updateStock,
    searchProducts,
    filterByCategory,
    editProduct
  } = useOwnerData();

  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in_stock, low_stock, out_of_stock
  const [activeFilter, setActiveFilter] = useState('all'); // all, active, inactive

  // Modals state
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [newStockInput, setNewStockInput] = useState('');
  const [stockModalError, setStockModalError] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Success Feedback state
  const [successMessage, setSuccessMessage] = useState('');

  // Trigger initial search if provided via query params
  useEffect(() => {
    if (initialSearch) {
      searchProducts(initialSearch).catch(() => {});
    }
  }, [initialSearch, searchProducts]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // Search handler (uses GET /api/products/search?query=)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSelectedCategory('all');
    searchProducts(searchQuery).catch(() => {});
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    searchProducts('').catch(() => {});
  };

  // Category change handler (uses GET /api/products/category/{id})
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setSearchQuery('');
    filterByCategory(catId).catch(() => {});
  };

  // Delete / Deactivate Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteModalProduct) return;
    try {
      await deleteProduct(deleteModalProduct.id);
      showSuccess(`Product "${deleteModalProduct.name}" deactivated successfully.`);
      setDeleteModalProduct(null);
    } catch (err) {
      alert(`Failed to deactivate product: ${err.message}`);
    }
  };

  // Reactivate handler
  const handleReactivate = async (product) => {
    try {
      await editProduct(product.id, {
        name: product.name,
        description: product.description,
        sku: product.sku,
        categoryId: product.categoryId || (product.category && product.category.id),
        imageUrl: product.imageUrl || product.image,
        unit: product.unit,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        active: true
      });
      showSuccess(`Product "${product.name}" reactivated successfully.`);
    } catch (err) {
      alert(`Failed to reactivate product: ${err.message}`);
    }
  };

  // Quick Stock stepper click
  const handleQuickStockChange = async (productId, currentStock, delta) => {
    const nextVal = Math.max(0, currentStock + delta);
    try {
      await updateStock(productId, nextVal);
    } catch (err) {
      alert(`Failed to update stock: ${err.message}`);
    }
  };

  // Open Stock Modal
  const handleOpenStockModal = (product) => {
    setStockModalProduct(product);
    setNewStockInput(String(product.stockQuantity));
    setStockModalError('');
  };

  // Submit dedicated Stock Modal
  const handleStockModalSubmit = async (e) => {
    e.preventDefault();
    const count = parseInt(newStockInput, 10);
    if (isNaN(count) || count < 0) {
      setStockModalError('Stock count must be a non-negative number.');
      return;
    }

    try {
      setIsUpdatingStock(true);
      await updateStock(stockModalProduct.id, count);
      showSuccess(`Updated inventory for "${stockModalProduct.name}" to ${count} units.`);
      setStockModalProduct(null);
    } catch (err) {
      setStockModalError(err.message || 'Failed to update stock.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // In-memory Filtered list based on current selects
  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'active' && p.active === false) return false;
    if (activeFilter === 'inactive' && p.active !== false) return false;

    if (stockFilter === 'in_stock' && p.stockQuantity <= 10) return false;
    if (stockFilter === 'low_stock' && (p.stockQuantity === 0 || p.stockQuantity > 10)) return false;
    if (stockFilter === 'out_of_stock' && p.stockQuantity > 0) return false;

    return true;
  });

  return (
    <div>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Products Catalog ({filteredProducts.length})
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Manage catalog items, pricing, package units, and live inventory availability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadInitialData}
            className="btn btn-outline btn-sm"
            title="Refresh from MySQL"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <Link to="/products/add" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
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
          <span>{successMessage}</span>
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

      {/* Filter and Search Bar */}
      <div
        className="owner-card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2.5rem' : '1rem', width: '100%' }}
            placeholder="Search by title, SKU, or description... (Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex'
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Category Filter */}
        <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <select
            className="form-select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt; 10)</option>
            <option value="low_stock">Low Stock (1-10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>

        {/* Active / Inactive Filter */}
        <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
          <select
            className="form-select"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="owner-card" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
          <RefreshCw size={32} color="#059669" className="spin" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Loading products from server...</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>Communicating with Spring Boot REST API</div>
        </div>
      )}

      {/* Products Display (Table on Desktop, Cards on Mobile) */}
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
                  <th>Selling Price</th>
                  <th>MRP</th>
                  <th>Stock Quantity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                      <Package size={38} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>No products found</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all' || activeFilter !== 'all'
                          ? 'Try clearing your search query or filter selection.'
                          : 'Your database does not have any products yet. Click "Add New Product" to create one.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <img
                            src={product.imageUrl || product.image}
                            alt={product.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              SKU: <code style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{product.sku || 'N/A'}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px'
                          }}
                        >
                          {product.categoryName}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                          {product.unit}
                        </span>
                      </td>

                      <td style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                        ₹{product.sellingPrice}
                      </td>

                      <td style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.88rem' }}>
                        ₹{product.mrp}
                      </td>

                      {/* Stock stepper & quick count */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(product.id, product.stockQuantity, -1)}
                            disabled={product.stockQuantity <= 0}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: product.stockQuantity <= 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              opacity: product.stockQuantity <= 0 ? 0.3 : 1
                            }}
                            title="Decrease stock by 1"
                          >
                            <MinusCircle size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStockModal(product)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: product.stockQuantity === 0 ? '#ef4444' : product.stockQuantity <= 10 ? '#d97706' : '#059669',
                              cursor: 'pointer'
                            }}
                            title="Click to update stock"
                          >
                            {product.stockQuantity}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(product.id, product.stockQuantity, 1)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#059669',
                              cursor: 'pointer',
                              display: 'flex'
                            }}
                            title="Increase stock by 1"
                          >
                            <PlusCircle size={17} />
                          </button>
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                          <Badge
                            variant={
                              product.active === false
                                ? 'default'
                                : product.stockQuantity === 0
                                ? 'danger'
                                : product.stockQuantity <= 10
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {product.active === false
                              ? 'Inactive'
                              : product.stockQuantity === 0
                              ? 'Out of Stock'
                              : product.stockQuantity <= 10
                              ? 'Low Stock'
                              : 'In Stock'}
                          </Badge>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenStockModal(product)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.55rem' }}
                            title="Dedicated stock update"
                          >
                            <Boxes size={15} />
                          </button>

                          <Link
                            to={`/products/edit/${product.id}`}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.55rem' }}
                            title="Edit product details"
                          >
                            <Edit2 size={15} />
                          </Link>

                          {product.active === false ? (
                            <button
                              type="button"
                              onClick={() => handleReactivate(product)}
                              className="btn btn-sm"
                              style={{
                                padding: '0.35rem 0.55rem',
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0'
                              }}
                              title="Reactivate product"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteModalProduct(product)}
                              className="btn btn-sm"
                              style={{
                                padding: '0.35rem 0.55rem',
                                backgroundColor: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca'
                              }}
                              title="Deactivate product"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
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
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <Package size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, color: '#0f172a' }}>No products found</div>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="mobile-data-card">
                  <div className="mobile-data-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <img
                        src={product.imageUrl || product.image}
                        alt={product.name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <span>SKU: {product.sku || 'N/A'}</span>
                          <span>&bull;</span>
                          <span>{product.unit}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant={
                        product.active === false
                          ? 'default'
                          : product.stockQuantity === 0
                          ? 'danger'
                          : product.stockQuantity <= 10
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {product.active === false
                        ? 'Inactive'
                        : product.stockQuantity === 0
                        ? 'Out of Stock'
                        : product.stockQuantity <= 10
                        ? `${product.stockQuantity} Left`
                        : `${product.stockQuantity} In Stock`}
                    </Badge>
                  </div>

                  <div className="mobile-data-card-body">
                    <div className="mobile-data-card-row">
                      <span className="mobile-data-card-label">Category</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', backgroundColor: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        {product.categoryName}
                      </span>
                    </div>

                    <div className="mobile-data-card-row">
                      <span className="mobile-data-card-label">Price</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                          ₹{product.sellingPrice}
                        </span>
                        <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.82rem' }}>
                          ₹{product.mrp}
                        </span>
                      </div>
                    </div>

                    <div className="mobile-data-card-row">
                      <span className="mobile-data-card-label">Stock Stepper</span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(product.id, product.stockQuantity, -1)}
                          disabled={product.stockQuantity <= 0}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#475569',
                            cursor: product.stockQuantity <= 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            opacity: product.stockQuantity <= 0 ? 0.3 : 1
                          }}
                          aria-label="Decrease stock"
                        >
                          <MinusCircle size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenStockModal(product)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '0.2rem 0.6rem',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: product.stockQuantity === 0 ? '#ef4444' : product.stockQuantity <= 10 ? '#d97706' : '#059669',
                            cursor: 'pointer',
                            minWidth: '40px',
                            textAlign: 'center'
                          }}
                        >
                          {product.stockQuantity}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(product.id, product.stockQuantity, 1)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#059669',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px'
                          }}
                          aria-label="Increase stock"
                        >
                          <PlusCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-data-card-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenStockModal(product)}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, minHeight: '38px' }}
                    >
                      <Boxes size={14} />
                      <span>Stock</span>
                    </button>

                    <Link
                      to={`/products/edit/${product.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, minHeight: '38px' }}
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </Link>

                    {product.active === false ? (
                      <button
                        type="button"
                        onClick={() => handleReactivate(product)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          minHeight: '38px'
                        }}
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteModalProduct(product)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#ef4444', minHeight: '38px', padding: '0.35rem 0.65rem' }}
                        title="Deactivate"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dedicated Stock Update Modal */}
      {stockModalProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '1.5rem', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Boxes size={20} color="#059669" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Update Product Stock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStockModalProduct(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.35rem' }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockModalSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  {stockModalProduct.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  SKU: {stockModalProduct.sku} | Unit: {stockModalProduct.unit}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Current Inventory:</span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                  {stockModalProduct.stockQuantity} units
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modalStockQuantity">
                  New Stock Quantity *
                </label>
                <input
                  id="modalStockQuantity"
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="Enter updated unit count"
                  value={newStockInput}
                  onChange={(e) => {
                    setNewStockInput(e.target.value);
                    if (stockModalError) setStockModalError('');
                  }}
                  autoFocus
                  required
                />
                {stockModalError && <span className="form-error">{stockModalError}</span>}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStockModalProduct(null)}
                  disabled={isUpdatingStock}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdatingStock}
                  style={{ flex: 1 }}
                >
                  {isUpdatingStock ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Confirmation Modal */}
      {deleteModalProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '1.5rem', maxWidth: '440px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#fef2f2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <AlertCircle size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Deactivate Product?
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Are you sure you want to deactivate <strong>"{deleteModalProduct.name}"</strong>?
                This will soft-delete the item from active customer storefront displays while preserving database history.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteModalProduct(null)}
                style={{ flex: 1, minWidth: '120px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                style={{ flex: 1, minWidth: '120px' }}
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
