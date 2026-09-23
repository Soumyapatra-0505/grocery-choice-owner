import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const OwnerAuthContext = createContext();

const OWNER_STORAGE_KEY = 'grocery_choice_owner_auth';
const OWNER_TOKEN_KEY = 'grocery_choice_owner_token';

export function OwnerAuthProvider({ children }) {
  const [owner, setOwner] = useState(() => {
    try {
      const saved = localStorage.getItem(OWNER_STORAGE_KEY);
      const token = localStorage.getItem(OWNER_TOKEN_KEY);
      return saved && token ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!owner && !!localStorage.getItem(OWNER_TOKEN_KEY);

  // Sync session on mount
  useEffect(() => {
    const token = localStorage.getItem(OWNER_TOKEN_KEY);
    if (token) {
      authApi.getMe()
        .then((user) => {
          if (user && (user.role === 'OWNER' || user.role === 'ADMIN')) {
            setOwner((prev) => {
              const updated = {
                ...prev,
                id: user.id,
                name: user.fullName || prev?.name || 'Suresh Verma',
                fullName: user.fullName || prev?.fullName || 'Suresh Verma',
                email: user.email,
                phone: user.phone,
                role: user.role,
                storeName: 'Grocery Choice - Flagship Hub',
                avatar: prev?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
              };
              localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          } else {
            // Role is CUSTOMER or invalid -> clear owner session
            logout();
          }
        })
        .catch(() => {
          // Token invalid or expired
          logout();
        });
    }
  }, []);

  const login = async (identifier, password) => {
    if (!identifier || !password) {
      return { success: false, error: 'Please enter both email/mobile and password' };
    }

    try {
      const data = await authApi.login(identifier, password);
      if (data && data.token && data.user) {
        if (data.user.role !== 'OWNER' && data.user.role !== 'ADMIN') {
          return { success: false, error: 'Access restricted to store owners and managers.' };
        }

        const userObj = {
          id: data.user.id,
          name: data.user.fullName || 'Suresh Verma',
          fullName: data.user.fullName || 'Suresh Verma',
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          storeName: 'Grocery Choice - Flagship Hub',
          authMethod: 'password',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
        };

        localStorage.setItem(OWNER_TOKEN_KEY, data.token);
        localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(userObj));
        setOwner(userObj);
        return { success: true, user: userObj };
      }
      return { success: false, error: 'Authentication failed. Please check your credentials.' };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Invalid credentials or server unavailable.'
      };
    }
  };

  const loginWithOtp = (authResult) => {
    // Check if real authResult from verifyOtp endpoint
    if (authResult && authResult.token && authResult.user) {
      if (authResult.user.role !== 'OWNER' && authResult.user.role !== 'ADMIN') {
        return { success: false, error: 'Access restricted to store owners and managers.' };
      }

      const userObj = {
        id: authResult.user.id,
        name: authResult.user.fullName || 'Suresh Verma',
        fullName: authResult.user.fullName || 'Suresh Verma',
        email: authResult.user.email,
        phone: authResult.user.phone,
        role: authResult.user.role,
        storeName: 'Grocery Choice - Flagship Hub',
        authMethod: 'otp',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'
      };

      localStorage.setItem(OWNER_TOKEN_KEY, authResult.token);
      localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(userObj));
      setOwner(userObj);
      return { success: true, user: userObj };
    }

    return { success: false, error: 'Invalid authentication response' };
  };

  const logout = () => {
    setOwner(null);
    try {
      localStorage.removeItem(OWNER_STORAGE_KEY);
      localStorage.removeItem(OWNER_TOKEN_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <OwnerAuthContext.Provider value={{ owner, isAuthenticated, login, loginWithOtp, logout }}>
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  const context = useContext(OwnerAuthContext);
  if (!context) {
    throw new Error('useOwnerAuth must be used within an OwnerAuthProvider');
  }
  return context;
}
