import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOwnerData } from '../context/OwnerDataContext';
import { ArrowLeft, Check, AlertCircle, RefreshCw } from 'lucide-react';

const UNIT_OPTIONS = [
  { value: 'PIECE', label: 'PIECE — Individual item / piece' },
  { value: 'KG', label: 'KG — Kilogram (kg)' },
  { value: 'GRAM', label: 'GRAM — Grams (g)' },
  { value: 'LITRE', label: 'LITRE — Litre (L)' },
  { value: 'MILLILITRE', label: 'MILLILITRE — Millilitre (ml)' },
  { value: 'PACK', label: 'PACK — Pack / Multipack' },
  { value: 'BOX', label: 'BOX — Carton / Box' },
  { value: 'DOZEN', label: 'DOZEN — Dozen (12 items)' }
];

export default function AddProductPage() {
  const { categories, addProduct } = useOwnerData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    categoryId: categories[0]?.id ? String(categories[0].id) : '',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    unit: 'PIECE',
    mrp: '',
    sellingPrice: '',
    stockQuantity: '25'
  });

  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Derive active category selection
  const selectedCategoryId = formData.categoryId || (categories[0]?.id ? String(categories[0].id) : '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (backendError) {
      setBackendError('');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required and must be unique';
    if (!selectedCategoryId) newErrors.categoryId = 'Please select a product category';
    if (!formData.unit) newErrors.unit = 'Product unit is required';

    const mrpNum = Number(formData.mrp);
    if (!formData.mrp || isNaN(mrpNum) || mrpNum <= 0) {
      newErrors.mrp = 'Enter a valid MRP greater than 0';
    }

    const sellingNum = Number(formData.sellingPrice);
    if (!formData.sellingPrice || isNaN(sellingNum) || sellingNum <= 0) {
      newErrors.sellingPrice = 'Enter a valid selling price greater than 0';
    } else if (mrpNum && sellingNum > mrpNum) {
      newErrors.sellingPrice = 'Selling price cannot exceed MRP';
    }

    const stockNum = Number(formData.stockQuantity);
    if (formData.stockQuantity === '' || isNaN(stockNum) || stockNum < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setBackendError('');

      await addProduct({
        name: formData.name.trim(),
        description: formData.description.trim(),
        sku: formData.sku.trim().toUpperCase(),
        categoryId: Number(selectedCategoryId),
        imageUrl: formData.imageUrl.trim(),
        unit: formData.unit,
        mrp: Number(formData.mrp),
        sellingPrice: Number(formData.sellingPrice),
        stockQuantity: Number(formData.stockQuantity),
        active: true
      });

      // Navigate back to products list
      navigate('/products');
    } catch (err) {
      setBackendError(err.message || 'Failed to create product on backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#059669',
            marginBottom: '0.75rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
          Add New Product
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Create and publish a new grocery item directly to the backend database catalog.
        </p>
      </div>

      {/* Backend Error Banner */}
      {backendError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>{backendError}</span>
        </div>
      )}

      <div className="owner-card">
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          {/* Product Name & SKU */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Product Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Farm Fresh Organic Apples"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sku" className="form-label">Product SKU (Unique identifier) *</label>
              <input
                id="sku"
                name="sku"
                type="text"
                className="form-input"
                placeholder="e.g. FRU-APP-001"
                value={formData.sku}
                onChange={handleChange}
              />
              {errors.sku && <span className="form-error">{errors.sku}</span>}
            </div>
          </div>

          {/* Category & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="categoryId" className="form-label">Category *</label>
              <select
                id="categoryId"
                name="categoryId"
                className="form-select"
                value={selectedCategoryId}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="unit" className="form-label">Packaging Unit *</label>
              <select
                id="unit"
                name="unit"
                className="form-select"
                value={formData.unit}
                onChange={handleChange}
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.unit && <span className="form-error">{errors.unit}</span>}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="mrp" className="form-label">Original MRP (₹) *</label>
              <input
                id="mrp"
                name="mrp"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="150.00"
                value={formData.mrp}
                onChange={handleChange}
              />
              {errors.mrp && <span className="form-error">{errors.mrp}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sellingPrice" className="form-label">Selling Price (₹) *</label>
              <input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="120.00"
                value={formData.sellingPrice}
                onChange={handleChange}
              />
              {errors.sellingPrice && <span className="form-error">{errors.sellingPrice}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="stockQuantity" className="form-label">Stock Quantity *</label>
              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                min="0"
                className="form-input"
                placeholder="25"
                value={formData.stockQuantity}
                onChange={handleChange}
              />
              {errors.stockQuantity && <span className="form-error">{errors.stockQuantity}</span>}
            </div>
          </div>

          {/* Image URL */}
          <div className="form-group">
            <label htmlFor="imageUrl" className="form-label">Product Image URL</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={formData.imageUrl}
                onChange={handleChange}
              />
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="description" className="form-label">Product Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="form-textarea"
              placeholder="Describe freshness, ingredients, origin, or culinary suggestions..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link to="/products" className="btn btn-outline" disabled={submitting}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Create &amp; Publish Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
