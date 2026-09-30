import React, { useState } from 'react';
import { useOwnerData } from '../context/OwnerDataContext';
import {
  Plus,
  Package,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export default function CategoriesPage() {
  const {
    categories,
    products,
    loading,
    error,
    loadInitialData,
    addCategory,
    updateCategory,
    deleteCategory
  } = useOwnerData();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteModalCategory, setDeleteModalCategory] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Modal feedback
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormDescription('');
    setFormImageUrl('');
    setFormActive(true);
    setModalError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name || '');
    setFormDescription(cat.description || '');
    setFormImageUrl(cat.imageUrl || '');
    setFormActive(cat.active !== false);
    setModalError('');
  };

  // Submit Add Category (POST /api/categories)
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError('');
      await addCategory({
        name: formName.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        active: formActive
      });
      showSuccess(`Category "${formName.trim()}" created successfully.`);
      setShowAddModal(false);
    } catch (err) {
      setModalError(err.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Category (PUT /api/categories/{id})
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setModalError('');
      await updateCategory(editingCategory.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        active: formActive
      });
      showSuccess(`Category "${formName.trim()}" updated successfully.`);
      setEditingCategory(null);
    } catch (err) {
      setModalError(err.message || 'Failed to update category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Deactivate / Delete Category (DELETE /api/categories/{id})
  const handleDeleteConfirm = async () => {
    if (!deleteModalCategory) return;
    try {
      setSubmitting(true);
      await deleteCategory(deleteModalCategory.id);
      showSuccess(`Category "${deleteModalCategory.name}" deactivated.`);
      setDeleteModalCategory(null);
    } catch (err) {
      alert(`Failed to deactivate category: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Categories &amp; Departments ({categories.length})
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Manage storefront department classifications and organize catalog items with MySQL backend.
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
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add New Category</span>
          </button>
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
        <div className="owner-card" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
          <RefreshCw size={32} color="#059669" className="spin" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 700, color: '#0f172a' }}>Loading categories from database...</div>
        </div>
      )}

      {/* Categories Grid */}
      {!loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '1.25rem'
          }}
        >
          {categories.length === 0 ? (
            <div className="owner-card" style={{ gridColumn: '1 / -1', padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <Package size={38} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>No Categories Found</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Click "Add New Category" above to create your first department.
              </div>
            </div>
          ) : (
            categories.map((cat) => {
              const productCount = products.filter(
                (p) => p.categoryId === cat.id || (p.category && p.category.id === cat.id)
              ).length;

              return (
                <div
                  key={cat.id}
                  className="owner-card"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    border: cat.active === false ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                    opacity: cat.active === false ? 0.75 : 1
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '10px',
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.4rem',
                              flexShrink: 0
                            }}
                          >
                            📦
                          </div>
                        )}

                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                            {cat.name}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                            ID: #{cat.id}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: cat.active !== false ? '#ecfdf5' : '#f1f5f9',
                          color: cat.active !== false ? '#065f46' : '#64748b',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: cat.active !== false ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                        }}
                      >
                        {cat.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {cat.description && (
                      <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        color: '#059669',
                        fontWeight: 700
                      }}
                    >
                      <Package size={14} />
                      <span>{productCount} items linked</span>
                    </div>

                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cat)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.3rem 0.6rem' }}
                        title="Edit category"
                      >
                        <Edit2 size={14} />
                      </button>

                      {cat.active !== false && (
                        <button
                          type="button"
                          onClick={() => setDeleteModalCategory(cat)}
                          className="btn btn-sm"
                          style={{
                            padding: '0.3rem 0.6rem',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fecaca'
                          }}
                          title="Deactivate category"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '1.75rem', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Create New Category
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="addCategoryName">Category Name *</label>
                <input
                  id="addCategoryName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Organic Dairy & Eggs"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (modalError) setModalError('');
                  }}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="addCategoryDesc">Description</label>
                <textarea
                  id="addCategoryDesc"
                  rows={2}
                  className="form-textarea"
                  placeholder="Brief description of products in this category..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#059669' }}
                  />
                  <span>Active immediately in catalog</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '1.75rem', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Edit Category: {editingCategory.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="editCategoryName">Category Name *</label>
                <input
                  id="editCategoryName"
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (modalError) setModalError('');
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editCategoryDesc">Description</label>
                <textarea
                  id="editCategoryDesc"
                  rows={2}
                  className="form-textarea"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#059669' }}
                  />
                  <span>Category is Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingCategory(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Category Modal */}
      {deleteModalCategory && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '1.75rem', maxWidth: '440px' }}>
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
                Deactivate Category?
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Are you sure you want to deactivate <strong>"{deleteModalCategory.name}"</strong>?
                Linked products will remain in the database, but this category will be marked inactive.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeleteModalCategory(null)}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
