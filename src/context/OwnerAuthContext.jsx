import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const OwnerAuthContext = createContext();

const OWNER_STORAGE_KEY = 'grocery_choice_owner_auth';
const OWNER_TOKEN_KEY = 'grocery_choice_owner_token';

/**
 * Retrieves the saved owner avatar from localStorage if available
 */
function getSavedOwnerAvatar(user) {
  if (!user) return null;
  return (
    user.profilePicture ||
    (user.phone && localStorage.getItem(`grocery_choice_owner_avatar_${user.phone}`)) ||
    (user.email && localStorage.getItem(`grocery_choice_owner_avatar_${user.email}`)) ||
    (user.id && localStorage.getItem(`grocery_choice_owner_avatar_${user.id}`)) ||
    localStorage.getItem('grocery_choice_owner_avatar_default') ||
    null
  );
}

export function OwnerAuthProvider({ children }) {
  const [owner, setOwner] = useState(() => {
    try {
      const saved = localStorage.getItem(OWNER_STORAGE_KEY);
      const token = localStorage.getItem(OWNER_TOKEN_KEY);
      if (saved && token) {
        const parsed = JSON.parse(saved);
        const avatar = getSavedOwnerAvatar(parsed);
        return {
          ...parsed,
          profilePicture: avatar,
          avatar
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!owner && !!localStorage.getItem(OWNER_TOKEN_KEY);

  const logout = useCallback(() => {
    setOwner(null);
    try {
      localStorage.removeItem(OWNER_STORAGE_KEY);
      localStorage.removeItem(OWNER_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Sync session on mount
  useEffect(() => {
    const token = localStorage.getItem(OWNER_TOKEN_KEY);
    if (token) {
      authApi.getMe()
        .then((user) => {
          if (user && (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'STAFF')) {
            setOwner((prev) => {
              const savedAvatar = getSavedOwnerAvatar(user) || prev?.profilePicture || null;
              const updated = {
                ...prev,
                id: user.id,
                name: user.fullName || prev?.name || 'Store User',
                fullName: user.fullName || prev?.fullName || 'Store User',
                email: user.email,
                phone: user.phone,
                role: user.role,
                primaryOwner: !!user.primaryOwner,
                status: user.status || 'ACTIVE',
                designation: user.designation || prev?.designation || (user.role === 'OWNER' ? 'Store Owner' : 'Staff'),
                storeHub: user.storeHub || prev?.storeHub || 'Flagship Hub',
                permissions: user.permissions || prev?.permissions || [],
                gender: user.gender !== undefined ? user.gender : (prev?.gender || null),
                dateOfBirth: user.dateOfBirth !== undefined ? user.dateOfBirth : (prev?.dateOfBirth || null),
                storeName: 'Grocery Choice - Flagship Hub',
                profilePicture: savedAvatar,
                avatar: savedAvatar
              };
              localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          } else {
            // Role is CUSTOMER or invalid -> clear owner session
            logout();
          }
        })
        .catch((err) => {
          // Token invalid or expired - only clear session on explicit 401/403
          if (err && (err.status === 401 || err.status === 403)) {
            logout();
          } else {
            console.debug('Owner session sync note:', err?.message);
          }
        });
    }
  }, [logout]);

  const login = async (identifier, password) => {
    if (!identifier || !password) {
      return { success: false, error: 'Please enter both email/mobile and password' };
    }

    try {
      const data = await authApi.login(identifier, password);
      if (data && data.token && data.user) {
        if (data.user.role !== 'OWNER' && data.user.role !== 'ADMIN' && data.user.role !== 'STAFF') {
          return { success: false, error: 'Access restricted to store staff, managers, and owners.' };
        }

        const savedAvatar = getSavedOwnerAvatar(data.user);
        const userObj = {
          id: data.user.id,
          name: data.user.fullName || 'Store User',
          fullName: data.user.fullName || 'Store User',
          email: data.user.email,
          phone: data.user.phone,
          gender: data.user.gender || null,
          dateOfBirth: data.user.dateOfBirth || null,
          role: data.user.role,
          primaryOwner: !!data.user.primaryOwner,
          status: data.user.status || 'ACTIVE',
          designation: data.user.designation || (data.user.role === 'OWNER' ? 'Store Owner' : 'Staff'),
          storeHub: data.user.storeHub || 'Flagship Hub',
          permissions: data.user.permissions || [],
          storeName: 'Grocery Choice - Flagship Hub',
          authMethod: 'password',
          profilePicture: savedAvatar,
          avatar: savedAvatar
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
      if (authResult.user.role !== 'OWNER' && authResult.user.role !== 'ADMIN' && authResult.user.role !== 'STAFF') {
        return { success: false, error: 'Access restricted to store staff, managers, and owners.' };
      }

      const savedAvatar = getSavedOwnerAvatar(authResult.user);
      const userObj = {
        id: authResult.user.id,
        name: authResult.user.fullName || 'Store User',
        fullName: authResult.user.fullName || 'Store User',
        email: authResult.user.email,
        phone: authResult.user.phone,
        gender: authResult.user.gender || null,
        dateOfBirth: authResult.user.dateOfBirth || null,
        role: authResult.user.role,
        primaryOwner: !!authResult.user.primaryOwner,
        status: authResult.user.status || 'ACTIVE',
        designation: authResult.user.designation || (authResult.user.role === 'OWNER' ? 'Store Owner' : 'Staff'),
        storeHub: authResult.user.storeHub || 'Flagship Hub',
        permissions: authResult.user.permissions || [],
        storeName: 'Grocery Choice - Flagship Hub',
        authMethod: 'otp',
        profilePicture: savedAvatar,
        avatar: savedAvatar
      };

      localStorage.setItem(OWNER_TOKEN_KEY, authResult.token);
      localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(userObj));
      setOwner(userObj);
      return { success: true, user: userObj };
    }

    return { success: false, error: 'Invalid authentication response' };
  };

  const updateOwnerProfile = async (updatedFields) => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(OWNER_TOKEN_KEY) : null;
      if (token) {
        const payload = {};
        if (updatedFields.fullName !== undefined) payload.fullName = updatedFields.fullName;
        if (updatedFields.email !== undefined) payload.email = updatedFields.email;
        if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
        if (updatedFields.gender !== undefined) payload.gender = updatedFields.gender;
        if (updatedFields.dateOfBirth !== undefined) payload.dateOfBirth = updatedFields.dateOfBirth;

        if (Object.keys(payload).length > 0) {
          try {
            await authApi.updateProfile(payload);
          } catch (apiErr) {
            if (apiErr.status && apiErr.status >= 400 && apiErr.status < 500 && !apiErr.isNetworkError) {
              throw apiErr;
            }
            console.debug('Backend owner profile sync note:', apiErr.message);
          }
        }
      }
    } catch (err) {
      if (err.status && err.status >= 400 && err.status < 500 && !err.isNetworkError) {
        throw err;
      }
      console.debug('Backend owner profile sync note:', err.message);
    }

    setOwner((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        ...updatedFields,
        name: updatedFields.fullName || prev.name,
        fullName: updatedFields.fullName || prev.fullName
      };

      if (updatedFields.profilePicture !== undefined) {
        const avatarKeys = [
          prev.phone && `grocery_choice_owner_avatar_${prev.phone}`,
          prev.email && `grocery_choice_owner_avatar_${prev.email}`,
          prev.id && `grocery_choice_owner_avatar_${prev.id}`,
          'grocery_choice_owner_avatar_default'
        ].filter(Boolean);

        if (updatedFields.profilePicture) {
          avatarKeys.forEach((key) => {
            try {
              localStorage.setItem(key, updatedFields.profilePicture);
            } catch (e) {
              console.error('Failed to store owner avatar in localStorage', e);
            }
          });
          updated.avatar = updatedFields.profilePicture;
        } else {
          avatarKeys.forEach((key) => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.error('Failed to remove owner avatar from localStorage', e);
            }
          });
          updated.profilePicture = null;
          updated.avatar = null;
        }
      }

      try {
        localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to sync updated owner to localStorage', e);
      }
      return updated;
    });
  };

  return (
    <OwnerAuthContext.Provider
      value={{
        owner,
        isAuthenticated,
        login,
        loginWithOtp,
        logout,
        updateOwnerProfile
      }}
    >
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
