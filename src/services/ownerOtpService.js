/**
 * Grocery Choice - Store Owner OTP Authentication Service
 * Connected to Spring Boot Backend API.
 */

import { authApi } from './api';

export const OWNER_OTP_EXPIRY_SECONDS = 300;
export const OWNER_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Normalizes email or mobile number for consistent lookup
 */
export function normalizeOwnerIdentifier(identifier) {
  if (!identifier) return '';
  const trimmed = identifier.trim();
  if (!trimmed.includes('@') && /^\+?[\d\s-]{8,}$/.test(trimmed)) {
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return digitsOnly.slice(2);
    }
    return digitsOnly;
  }
  return trimmed.toLowerCase();
}

/**
 * Validates whether the identifier is a valid 10-digit mobile number or valid email
 */
export function validateOwnerIdentifier(input) {
  if (!input || !input.trim()) {
    return { isValid: false, type: null, error: 'Please enter your email or mobile number' };
  }

  const trimmed = input.trim();

  // Email validation
  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, type: 'email', error: 'Please enter a valid email address' };
    }
    return { isValid: true, type: 'email', normalized: trimmed.toLowerCase(), error: null };
  }

  // Mobile number validation
  const digits = trimmed.replace(/\D/g, '');
  const is10Digit = digits.length === 10 && /^[6-9]\d{9}$/.test(digits);
  const is11Digit = digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1));
  const is12Digit = digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2));

  if (is10Digit || is11Digit || is12Digit) {
    const normalizedMobile = is10Digit ? digits : (is11Digit ? digits.slice(1) : digits.slice(2));
    return { isValid: true, type: 'mobile', normalized: normalizedMobile, error: null };
  }

  return {
    isValid: false,
    type: 'mobile',
    error: 'Please enter a valid 10-digit mobile number (e.g. 9876543210)'
  };
}

/**
 * Dispatches 6-digit OTP via Spring Boot Backend
 */
export async function sendOwnerOtp(rawIdentifier) {
  const validation = validateOwnerIdentifier(rawIdentifier);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    const res = await authApi.sendOtp(rawIdentifier);
    let demoCode = null;
    try {
      const devRes = await authApi.getDevOtp(rawIdentifier);
      if (devRes && devRes.otp) {
        demoCode = devRes.otp;
      }
    } catch {
      // In production dev endpoint is omitted
    }

    return {
      success: true,
      type: res?.type || validation.type,
      identifier: res?.identifier || validation.normalized,
      demoCode: demoCode,
      expiresInSeconds: res?.expiresInSeconds || OWNER_OTP_EXPIRY_SECONDS,
      message: res?.message || `6-digit OTP sent to ${rawIdentifier}`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to send OTP to owner account'
    };
  }
}

/**
 * Verifies the entered 6-digit OTP via Spring Boot Backend
 */
export async function verifyOwnerOtp(rawIdentifier, inputCode) {
  if (!inputCode || typeof inputCode !== 'string' || inputCode.length !== 6 || !/^\d{6}$/.test(inputCode)) {
    return {
      success: false,
      error: 'INVALID_FORMAT',
      message: 'Please enter a complete 6-digit numeric OTP'
    };
  }

  try {
    const res = await authApi.verifyOtp(rawIdentifier, inputCode);
    return {
      success: true,
      message: res?.message || 'OTP verified successfully',
      data: res
    };
  } catch (err) {
    return {
      success: false,
      error: 'VERIFICATION_FAILED',
      message: err.message || 'Invalid or expired OTP'
    };
  }
}

/**
 * Clears active OTP for an identifier
 */
export function clearOwnerOtp(rawIdentifier) {
  // No-op for remote backend OTP
}

/**
 * Helper to inspect active mock OTP for testing/development helper
 */
export async function getActiveOwnerMockOtp(rawIdentifier) {
  try {
    const devRes = await authApi.getDevOtp(rawIdentifier);
    if (devRes && devRes.otp) {
      return { code: devRes.otp, remainingSeconds: 300 };
    }
  } catch {
    // Ignore
  }
  return null;
}
