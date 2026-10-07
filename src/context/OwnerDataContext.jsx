import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { productApi, categoryApi, orderApi } from '../services/api';

const OwnerDataContext = createContext();

// Initial Mock Customers (for the prototype customers workflow)
const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Aarav Patel',
    email: 'aarav.patel@example.com',
    phone: '+91 98231 45678',
    totalOrders: 14,
    totalSpent: 12850,
    joinedDate: '2026-01-15'
  },
  {
    id: 'cust-2',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@example.com',
    phone: '+91 97412 88901',
    totalOrders: 28,
    totalSpent: 34600,
    joinedDate: '2025-11-20'
  },
  {
    id: 'cust-3',
    name: 'Vikram Malhotra',
    email: 'vikram.m@example.com',
    phone: '+91 99887 11223',
    totalOrders: 9,
    totalSpent: 8450,
    joinedDate: '2026-02-01'
  },
  {
    id: 'cust-4',
    name: 'Meera Nambiar',
    email: 'meera.nambiar@example.com',
    phone: '+91 91234 56789',
    totalOrders: 19,
    totalSpent: 21300,
    joinedDate: '2025-12-10'
  },
  {
    id: 'cust-5',
    name: 'Karan Mehra',
    email: 'karan.m@example.com',
    phone: '+91 93456 78901',
    totalOrders: 4,
    totalSpent: 2890,
    joinedDate: '2026-04-18'
  }
];

/**
 * Normalizes product record from backend into Owner Portal compatible model.
 */
function normalizeProduct(p) {
  if (!p) return null;
  const stockCount = p.stockQuantity !== undefined && p.stockQuantity !== null ? Number(p.stockQuantity) : 0;
  const stockStatus = stockCount === 0 ? 'out_of_stock' : stockCount <= 10 ? 'low_stock' : 'in_stock';

  return {
    ...p,
    id: p.id,
    name: p.name,
    description: p.description || '',
    sku: p.sku || '',
    category: p.category?.name || (typeof p.category === 'string' ? p.category : 'General'),
    categoryId: p.category?.id || p.categoryId || null,
    categoryName: p.category?.name || (typeof p.category === 'string' ? p.category : 'General'),
    price: p.sellingPrice ? Number(p.sellingPrice) : 0,
    mrp: p.mrp ? Number(p.mrp) : 0,
    sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : 0,
    stockQuantity: stockCount,
    stockCount,
    stockStatus,
    unit: p.unit || 'PIECE',
    image: p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    imageUrl: p.imageUrl || '',
    active: p.active !== false
  };
}

/**
 * Normalizes category object from Spring Boot backend.
 */
function normalizeCategory(c) {
  if (!c) return null;
  return {
    ...c,
    id: c.id,
    name: c.name,
    description: c.description || '',
    imageUrl: c.imageUrl || '',
    active: c.active !== false,
    slug: c.name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-')
  };
}

/**
 * Normalizes order object from Spring Boot backend.
 */
function normalizeOrder(o) {
  if (!o) return null;
  const items = Array.isArray(o.items) ? o.items : [];
  const itemsCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalAmount = Number(o.totalAmount !== undefined ? o.totalAmount : o.total || 0);

  return {
    ...o,
    id: o.id,
    orderNumber: o.orderNumber || (typeof o.id === 'string' ? o.id : `GC-ORD-${o.id}`),
    customerName: o.customerName || (o.user?.fullName) || 'Rahul Sharma',
    customerEmail: o.customerEmail || (o.user?.email) || 'customer@grocerychoice.com',
    customerPhone: o.customerPhone || (o.user?.phone) || '+91 98765 43210',
    deliveryLocation: o.deliveryAddressText || 'Standard Delivery Address',
    deliveryAddressText: o.deliveryAddressText || 'Standard Delivery Address',
    assignedDeliveryPartnerId: o.assignedDeliveryPartnerId || null,
    assignedDeliveryPartnerName: o.assignedDeliveryPartnerName || null,
    assignedDeliveryPartnerPhone: o.assignedDeliveryPartnerPhone || null,
    assignedAt: o.assignedAt || null,
    acceptedAt: o.acceptedAt || null,
    pickedUpAt: o.pickedUpAt || null,
    deliveredAt: o.deliveredAt || null,
    deliveryNotes: o.deliveryNotes || null,
    deliveryOtpVerified: !!o.deliveryOtpVerified,
    codCollected: !!o.codCollected,
    codCollectedAt: o.codCollectedAt || null,
    items,
    itemsCount,
    subtotal: Number(o.subtotal || 0),
    deliveryCharge: Number(o.deliveryCharge || 0),
    discount: Number(o.discount || 0),
    total: totalAmount,
    totalAmount,
    status: o.status || 'PLACED',
    paymentStatus: o.paymentStatus || 'PENDING',
    paymentMethod: o.paymentMethod || 'Cash on Delivery',
    deliverySlot: o.deliverySlot || 'Standard Delivery (30-45 mins)',
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: o.updatedAt || o.createdAt
  };
}

export function OwnerDataProvider({ children }) {
  // Live backend states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [customers] = useState(INITIAL_CUSTOMERS);

  // Fetch all categories from backend
  const fetchCategories = useCallback(async () => {
    try {
      const rawCategories = await categoryApi.getAll();
      const normalized = (Array.isArray(rawCategories) ? rawCategories : []).map(normalizeCategory);
      setCategories(normalized);
      return normalized;
    } catch (err) {
      console.error('Error fetching categories from backend:', err);
      throw err;
    }
  }, []);

  // Fetch all products from backend
  const fetchProducts = useCallback(async () => {
    try {
      const rawProducts = await productApi.getAll();
      const normalized = (Array.isArray(rawProducts) ? rawProducts : []).map(normalizeProduct);
      setProducts(normalized);
      return normalized;
    } catch (err) {
      console.error('Error fetching products from backend:', err);
      throw err;
    }
  }, []);

  // Fetch all orders from backend
  const fetchOrders = useCallback(async (status) => {
    try {
      let rawOrders;
      if (status && status !== 'all' && status !== 'ALL') {
        rawOrders = await orderApi.getByStatus(status.toUpperCase());
      } else {
        rawOrders = await orderApi.getAll();
      }
      const normalized = (Array.isArray(rawOrders) ? rawOrders : []).map(normalizeOrder);
      setOrders(normalized);
      return normalized;
    } catch (err) {
      console.error('Error fetching orders from backend:', err);
      throw err;
    }
  }, []);

  // Initial load of Categories, Products and Orders from backend
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCategories(), fetchProducts(), fetchOrders()]);
    } catch (err) {
      setError(err.message || 'Unable to connect to Grocery Choice server.');
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchProducts, fetchOrders]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      let cats, prods, ords;
      try {
        [cats, prods, ords] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll(),
          orderApi.getAll()
        ]);
        if (!ignore) {
          setCategories((Array.isArray(cats) ? cats : []).map(normalizeCategory));
          setProducts((Array.isArray(prods) ? prods : []).map(normalizeProduct));
          setOrders((Array.isArray(ords) ? ords : []).map(normalizeOrder));
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to connect to Grocery Choice server.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Products CRUD
  const addProduct = async (productData) => {
    try {
      const payload = {
        name: productData.name,
        description: productData.description || '',
        sku: productData.sku,
        categoryId: Number(productData.categoryId),
        imageUrl: productData.imageUrl || productData.image || '',
        unit: productData.unit,
        mrp: Number(productData.mrp || productData.originalPrice),
        sellingPrice: Number(productData.sellingPrice || productData.discountPrice),
        stockQuantity: Number(productData.stockQuantity !== undefined ? productData.stockQuantity : productData.stockCount || 0),
        active: productData.active !== undefined ? productData.active : true
      };

      const created = await productApi.create(payload);
      const normalized = normalizeProduct(created);
      setProducts((prev) => [normalized, ...prev.filter((p) => p.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      console.error('Failed to create product:', err);
      throw err;
    }
  };

  const editProduct = async (id, updatedData) => {
    try {
      const payload = {
        name: updatedData.name,
        description: updatedData.description,
        sku: updatedData.sku,
        categoryId: Number(updatedData.categoryId),
        imageUrl: updatedData.imageUrl || updatedData.image,
        unit: updatedData.unit,
        mrp: Number(updatedData.mrp !== undefined ? updatedData.mrp : updatedData.originalPrice),
        sellingPrice: Number(updatedData.sellingPrice !== undefined ? updatedData.sellingPrice : updatedData.discountPrice),
        stockQuantity: Number(updatedData.stockQuantity !== undefined ? updatedData.stockQuantity : updatedData.stockCount),
        active: updatedData.active !== undefined ? updatedData.active : true
      };

      const updated = await productApi.update(id, payload);
      const normalized = normalizeProduct(updated);
      setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? normalized : p)));
      return normalized;
    } catch (err) {
      console.error('Failed to update product:', err);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productApi.delete(id);
      // Soft-delete: update local state or remove from list
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err) {
      console.error('Failed to delete/deactivate product:', err);
      throw err;
    }
  };

  const updateStock = async (id, newStockQuantity) => {
    const count = Math.max(0, Number(newStockQuantity));
    try {
      const updated = await productApi.updateStock(id, count);
      const normalized = normalizeProduct(updated);
      setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? normalized : p)));
      return normalized;
    } catch (err) {
      console.error('Failed to update stock:', err);
      throw err;
    }
  };

  const searchProducts = async (query) => {
    if (!query || !query.trim()) {
      return await fetchProducts();
    }
    try {
      setLoading(true);
      setError(null);
      const results = await productApi.search(query.trim());
      const normalized = (Array.isArray(results) ? results : []).map(normalizeProduct);
      setProducts(normalized);
      return normalized;
    } catch (err) {
      console.error('Error searching products:', err);
      setError(err.message || 'Unable to connect to Grocery Choice server.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = async (categoryId) => {
    if (!categoryId || categoryId === 'all') {
      return await fetchProducts();
    }
    try {
      setLoading(true);
      setError(null);
      const results = await productApi.getByCategory(categoryId);
      const normalized = (Array.isArray(results) ? results : []).map(normalizeProduct);
      setProducts(normalized);
      return normalized;
    } catch (err) {
      console.error('Error filtering products by category:', err);
      setError(err.message || 'Unable to connect to Grocery Choice server.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Categories CRUD
  const addCategory = async (categoryData) => {
    try {
      const payload = {
        name: categoryData.name.trim(),
        description: categoryData.description || '',
        imageUrl: categoryData.imageUrl || '',
        active: categoryData.active !== undefined ? categoryData.active : true
      };

      const created = await categoryApi.create(payload);
      const normalized = normalizeCategory(created);
      setCategories((prev) => [...prev, normalized]);
      return normalized;
    } catch (err) {
      console.warn('Category creation notice:', err.message);
      throw err;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const payload = {
        name: categoryData.name.trim(),
        description: categoryData.description || '',
        imageUrl: categoryData.imageUrl || '',
        active: categoryData.active !== undefined ? categoryData.active : true
      };

      const updated = await categoryApi.update(id, payload);
      const normalized = normalizeCategory(updated);
      setCategories((prev) => prev.map((c) => (String(c.id) === String(id) ? normalized : c)));
      return normalized;
    } catch (err) {
      console.error('Failed to update category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await categoryApi.delete(id);
      // Soft-delete removes it from active categories or refreshes list
      setCategories((prev) => prev.filter((c) => String(c.id) !== String(id)));
    } catch (err) {
      console.error('Failed to delete/deactivate category:', err);
      throw err;
    }
  };

  // Orders CRUD
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updated = await orderApi.updateStatus(orderId, newStatus);
      const normalized = normalizeOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? normalized : o))
      );
      // Refresh products if stock changed (e.g. cancellation restores stock)
      fetchProducts().catch(console.error);
      return normalized;
    } catch (err) {
      console.error('Failed to update order status on server:', err);
      throw err;
    }
  };

  const assignDeliveryPartner = async (orderId, deliveryUserId) => {
    try {
      const updated = await orderApi.assignDeliveryPartner(orderId, deliveryUserId);
      const normalized = normalizeOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? normalized : o))
      );
      return normalized;
    } catch (err) {
      console.error('Failed to assign delivery partner on server:', err);
      throw err;
    }
  };

  // Real backend metrics calculations
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active !== false).length;
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= 10 && p.stockQuantity > 0);
  }, [products]);
  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.stockQuantity === 0);
  }, [products]);
  const totalCategories = categories.length;

  const totalOrders = orders.length;
  const todaySales = orders.reduce((sum, ord) => sum + (ord.totalAmount || ord.total || 0), 0);

  return (
    <OwnerDataContext.Provider
      value={{
        products,
        categories,
        orders,
        customers,
        loading,
        error,
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalCategories,
        totalOrders,
        todaySales,
        fetchProducts,
        fetchCategories,
        fetchOrders,
        loadInitialData,
        addProduct,
        editProduct,
        deleteProduct,
        updateStock,
        searchProducts,
        filterByCategory,
        addCategory,
        updateCategory,
        deleteCategory,
        updateOrderStatus,
        assignDeliveryPartner
      }}
    >
      {children}
    </OwnerDataContext.Provider>
  );
}

export function useOwnerData() {
  const context = useContext(OwnerDataContext);
  if (!context) {
    throw new Error('useOwnerData must be used within an OwnerDataProvider');
  }
  return context;
}
