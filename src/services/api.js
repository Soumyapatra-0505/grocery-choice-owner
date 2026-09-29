/**
 * Grocery Choice - Owner Portal API Service Layer
 * Centralized API client for communicating with the Spring Boot backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Standardized HTTP request wrapper with uniform error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  };

  let token = typeof localStorage !== 'undefined' ? localStorage.getItem('grocery_choice_owner_token') : null;

  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text ? { message: text } : null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Server error: ${response.status} ${response.statusText}`;
      const err = new Error(errorMessage);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkErr = new Error('Unable to connect to Grocery Choice server.');
      networkErr.isNetworkError = true;
      networkErr.status = 0;
      throw networkErr;
    }
    throw error;
  }
}

/**
 * Category API Endpoints
 * GET    /api/categories
 * GET    /api/categories/{id}
 * POST   /api/categories
 * PUT    /api/categories/{id}
 * DELETE /api/categories/{id}
 */
export const categoryApi = {
  getAll: () => request('/api/categories'),
  getById: (id) => request(`/api/categories/${id}`),
  create: (data) =>
    request('/api/categories', {
      method: 'POST',
      body: data
    }),
  update: (id, data) =>
    request(`/api/categories/${id}`, {
      method: 'PUT',
      body: data
    }),
  delete: (id) =>
    request(`/api/categories/${id}`, {
      method: 'DELETE'
    })
};

/**
 * Product API Endpoints
 * GET    /api/products
 * GET    /api/products/{id}
 * POST   /api/products
 * PUT    /api/products/{id}
 * DELETE /api/products/{id}
 * GET    /api/products/category/{categoryId}
 * GET    /api/products/search?query={query}
 * PATCH  /api/products/{id}/stock
 */
export const productApi = {
  getAll: () => request('/api/products'),
  getById: (id) => request(`/api/products/${id}`),
  create: (data) =>
    request('/api/products', {
      method: 'POST',
      body: data
    }),
  update: (id, data) =>
    request(`/api/products/${id}`, {
      method: 'PUT',
      body: data
    }),
  delete: (id) =>
    request(`/api/products/${id}`, {
      method: 'DELETE'
    }),
  getByCategory: (categoryId) => request(`/api/products/category/${categoryId}`),
  search: (query) => request(`/api/products/search?query=${encodeURIComponent(query)}`),
  updateStock: (id, stockQuantity) =>
    request(`/api/products/${id}/stock`, {
      method: 'PATCH',
      body: { stockQuantity: Number(stockQuantity) }
    })
};

/**
 * Order API Endpoints
 * GET    /api/orders
 * GET    /api/orders/status/{status}
 * GET    /api/orders/{id}
 * GET    /api/orders/number/{orderNumber}
 * PATCH  /api/orders/{id}/status
 * POST   /api/orders/{id}/cancel
 */
export const orderApi = {
  getAll: () => request('/api/orders'),
  getByStatus: (status) => request(`/api/orders/status/${status}`),
  getById: (id) => request(`/api/orders/${id}`),
  getByNumber: (orderNumber) => request(`/api/orders/number/${encodeURIComponent(orderNumber)}`),
  updateStatus: (id, status) =>
    request(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: { status }
    }),
  cancel: (id) =>
    request(`/api/orders/${id}/cancel`, {
      method: 'POST'
    })
};

/**
 * Authentication API Endpoints
 * POST /api/auth/owner/login
 * POST /api/auth/owner/send-otp
 * POST /api/auth/owner/verify-otp
 * GET  /api/auth/dev-otp/{identifier}
 * GET  /api/auth/me
 */
export const authApi = {
  login: (identifier, password) =>
    request('/api/auth/owner/login', {
      method: 'POST',
      body: { identifier, password }
    }),
  sendOtp: (identifier) =>
    request('/api/auth/owner/send-otp', {
      method: 'POST',
      body: { identifier }
    }),
  verifyOtp: (identifier, otp) =>
    request('/api/auth/owner/verify-otp', {
      method: 'POST',
      body: { identifier, otp }
    }),
  getDevOtp: (identifier) =>
    request(`/api/auth/dev-otp/${encodeURIComponent(identifier)}`),
  getMe: () => request('/api/auth/me'),
  updateProfile: (profileData) =>
    request('/api/auth/me', {
      method: 'PUT',
      body: profileData
    })
};

/**
 * Staff Management API Endpoints
 */
export const staffApi = {
  getAll: () => request('/api/staff'),
  getById: (id) => request(`/api/staff/${id}`),
  create: (data) =>
    request('/api/staff', {
      method: 'POST',
      body: data
    }),
  update: (id, data) =>
    request(`/api/staff/${id}`, {
      method: 'PUT',
      body: data
    }),
  updateContact: (id, data) =>
    request(`/api/staff/${id}/contact`, {
      method: 'PUT',
      body: data
    }),
  changeRole: (id, role) =>
    request(`/api/staff/${id}/role`, {
      method: 'PATCH',
      body: { role }
    }),
  changeStatus: (id, status) =>
    request(`/api/staff/${id}/status`, {
      method: 'PATCH',
      body: { status }
    }),
  changeDesignation: (id, designation) =>
    request(`/api/staff/${id}/designation`, {
      method: 'PATCH',
      body: { designation }
    }),
  updatePermissions: (id, permissions) =>
    request(`/api/staff/${id}/permissions`, {
      method: 'PATCH',
      body: { permissions }
    }),
  remove: (id) =>
    request(`/api/staff/${id}`, {
      method: 'DELETE'
    })
};

/**
 * Ownership Management API Endpoints
 */
export const ownershipApi = {
  getPrimaryOwner: () => request('/api/ownership/primary-owner'),
  getEligibleOwners: () => request('/api/ownership/eligible-owners'),
  transfer: (data) =>
    request('/api/ownership/transfer', {
      method: 'POST',
      body: data
    }),
  getAuditLogs: () => request('/api/ownership/audit-logs')
};

/**
 * Business Designations API Endpoints
 */
export const designationApi = {
  getAll: () => request('/api/designations'),
  create: (data) =>
    request('/api/designations', {
      method: 'POST',
      body: data
    }),
  update: (id, data) =>
    request(`/api/designations/${id}`, {
      method: 'PUT',
      body: data
    }),
  delete: (id) =>
    request(`/api/designations/${id}`, {
      method: 'DELETE'
    })
};

export { API_BASE_URL };
export default {
  categoryApi,
  productApi,
  orderApi,
  authApi,
  staffApi,
  ownershipApi,
  designationApi,
  API_BASE_URL
};
