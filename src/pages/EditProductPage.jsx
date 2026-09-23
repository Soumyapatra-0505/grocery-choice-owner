import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOwnerData } from '../context/OwnerDataContext';
import { productApi } from '../services/api';
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

export default function EditProductPage() {
  const { id } = useParams();
  const { products, categories, editProduct } = useOwnerData();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    categoryId: '',
    imageUrl: '',
    unit: 'PIECE',
    mrp: '',
    sellingPrice: '',
    stockQuantity: '0',
    active: true
  });

  // Load product data either from context products or directly from API
  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setLoading(true);
      setBackendError('');

      // First check context cache
      const cached = products.find((p) => String(p.id) === String(id));
      if (cached) {
        if (isMounted) {
          setFormData({
            name: cached.name || '',
            description: cached.description || '',
            sku: cached.sku || '',
            categoryId: String(cached.categoryId || cached.category?.id || ''),
            imageUrl: cached.imageUrl || cached.image || '',
            unit: cached.unit || 'PIECE',
            mrp: String(cached.mrp !== undefined ? cached.mrp : cached.originalPrice || ''),
            sellingPrice: String(cached.sellingPrice !== undefined ? cached.sellingPrice : cached.discountPrice || ''),
            stockQuantity: String(cached.stockQuantity !== undefined ? cached.stockQuantity : cached.stockCount || 0),
            active: cached.active !== false
          });
          setLoading(false);
        }
        return;
      }

      // Fetch from API
      try {
        const fetched = await productApi.getById(id);
        if (isMounted && fetched) {
          setFormData({
            name: fetched.name || '',
            description: fetched.description || '',
            sku: fetched.sku || '',
            categoryId: String(fetched.category?.id || ''),
            imageUrl: fetched.imageUrl || '',
            unit: fetched.unit || 'PIECE',
            mrp: String(fetched.mrp || ''),
            sellingPrice: String(fetched.sellingPrice || ''),
            stockQuantity: String(fetched.stockQuantity !== undefined ? fetched.stockQuantity : 0),
            active: fetched.active !== false
          });
        }
      } catch (err) {
        if (isMounted) {
          setBackendError(err.message || 'Failed to load product from server.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id, products]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.categoryId) newErrors.categoryId = 'Please select a product category';
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

      await editProduct(id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sku: formData.sku.trim().toUpperCase(),
        categoryId: Number(formData.categoryId),
        imageUrl: formData.imageUrl.trim(),
        unit: formData.unit,
        mrp: Number(formData.mrp),
        sellingPrice: Number(formData.sellingPrice),
        stockQuantity: Number(formData.stockQuantity),
        active: formData.active
      });

      navigate('/products');
    } catch (err) {
      setBackendError(err.message || 'Failed to update product on backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <RefreshCw size={36} color="#059669" className="spin" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Loading Product Details...</h2>
        <p style={{ color: '#64748b' }}>Fetching record from MySQL database.</p>
      </div>
    );
  }

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
          Edit Product: {formData.name}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Update prices, unit descriptions, images, active state, and live inventory levels.
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
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sku" className="form-label">Product SKU *</label>
              <input
                id="sku"
                name="sku"
                type="text"
                className="form-input"
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
                value={formData.categoryId}
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
                value={formData.sellingPrice}
                onChange={handleChange}
              />
              {errors.sellingPrice && <span className="form-error">{errors.sellingPrice}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="stockQuantity" className="form-label">Current Stock Units *</label>
              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                min="0"
                className="form-input"
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
          <div className="form-group">
            <label htmlFor="description" className="form-label">Product Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Active Status Toggle */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: '#059669' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                  Active in Customer Storefront
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  When unchecked, customers will not see this product in search or category pages.
                </div>
              </div>
            </label>
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Update Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
