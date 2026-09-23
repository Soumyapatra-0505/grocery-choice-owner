import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOwnerAuth } from '../context/OwnerAuthContext';
import Logo from '../assets/Logo';
import {
  sendOwnerOtp,
  verifyOwnerOtp,
  validateOwnerIdentifier,
  clearOwnerOtp,
  OWNER_RESEND_COOLDOWN_SECONDS
} from '../services/ownerOtpService';
import {
  ShieldCheck,
  Lock,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  Sparkles,
  RefreshCw,
  Edit2
} from 'lucide-react';

export default function LoginPage() {
  // Login method: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState('password');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow states: 'input' | 'otp'
  const [otpStep, setOtpStep] = useState('input');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [demoOtp, setDemoOtp] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');

  // Status & validation states
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WebOTP API state
  const webOtpAbortRef = useRef(null);

  // 6 OTP box input refs
  const inputRefs = useRef([]);

  const { login, loginWithOtp } = useOwnerAuth();
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // Countdown Timer Effect for OTP Resend
  // -------------------------------------------------------------
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // -------------------------------------------------------------
  // Verify OTP Handler
  // -------------------------------------------------------------
  const handleVerifyOtp = useCallback(async (codeToVerify = null) => {
    const code = typeof codeToVerify === 'string' ? codeToVerify : otpDigits.join('');
    setError('');

    if (code.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOwnerOtp(identifier, code);
    setIsSubmitting(false);

    if (result.success) {
      if (webOtpAbortRef.current) {
        try {
          webOtpAbortRef.current.abort();
        } catch {
          // Ignore
        }
        webOtpAbortRef.current = null;
      }

      loginWithOtp(result.data);
      navigate('/');
    } else {
      setError(result.message);
    }
  }, [identifier, loginWithOtp, navigate, otpDigits]);

  const handleVerifyRef = useRef(handleVerifyOtp);
  useEffect(() => {
    handleVerifyRef.current = handleVerifyOtp;
  }, [handleVerifyOtp]);

  // -------------------------------------------------------------
  // WebOTP API: Auto-read SMS OTP on supported mobile browsers
  // -------------------------------------------------------------
  useEffect(() => {
    const isMobile = !identifier.includes('@') && /^\+?[\d\s-]{8,}$/.test(identifier);
    if (loginMethod !== 'otp' || otpStep !== 'otp' || !isMobile) {
      return;
    }

    if (typeof window !== 'undefined' && 'OTPCredential' in window && navigator.credentials) {
      const abortController = new AbortController();
      webOtpAbortRef.current = abortController;

      navigator.credentials
        .get({
          otp: { transport: ['sms'] },
          signal: abortController.signal
        })
        .then((otpCredential) => {
          if (otpCredential && otpCredential.code) {
            const digits = otpCredential.code.trim().replace(/\D/g, '').slice(0, 6);
            if (digits.length === 6) {
              const newDigits = digits.split('');
              setOtpDigits(newDigits);
              handleVerifyRef.current(digits);
            }
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.debug('WebOTP auto-read omitted:', err.message);
          }
        });

      return () => {
        if (webOtpAbortRef.current) {
          try {
            webOtpAbortRef.current.abort();
          } catch {
            // Ignore
          }
          webOtpAbortRef.current = null;
        }
      };
    }
  }, [loginMethod, otpStep, identifier]);

  // -------------------------------------------------------------
  // Password Login Submit Handler
  // -------------------------------------------------------------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validation = validateOwnerIdentifier(identifier);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (!password || !password.trim()) {
      setError('Please enter your owner account password');
      return;
    }

    setIsSubmitting(true);
    const res = await login(identifier, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  // -------------------------------------------------------------
  // OTP Flow: Send OTP Handler
  // -------------------------------------------------------------
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMessage('');

    const validation = validateOwnerIdentifier(identifier);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    const result = await sendOwnerOtp(identifier);
    setIsSubmitting(false);

    if (result.success) {
      setDemoOtp(result.demoCode);
      setOtpStep('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(OWNER_RESEND_COOLDOWN_SECONDS);
      setInfoMessage(result.message);

      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 50);
    } else {
      setError(result.error || 'Failed to send OTP.');
    }
  };

  // -------------------------------------------------------------
  // OTP Flow: Resend OTP Handler
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    const result = await sendOwnerOtp(identifier);
    setIsSubmitting(false);

    if (result.success) {
      setDemoOtp(result.demoCode);
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(OWNER_RESEND_COOLDOWN_SECONDS);
      setInfoMessage(`New OTP sent to ${result.type === 'mobile' ? '+91 ' + result.identifier : result.identifier}`);

      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } else {
      setError(result.error || 'Failed to resend OTP.');
    }
  };

  // -------------------------------------------------------------
  // OTP Flow: Change Identifier Handler
  // -------------------------------------------------------------
  const handleChangeIdentifier = () => {
    if (webOtpAbortRef.current) {
      try {
        webOtpAbortRef.current.abort();
      } catch {
        // Ignore
      }
      webOtpAbortRef.current = null;
    }
    clearOwnerOtp(identifier);
    setOtpStep('input');
    setError('');
    setInfoMessage('');
    setDemoOtp(null);
    setOtpDigits(['', '', '', '', '', '']);
  };

  // -------------------------------------------------------------
  // OTP Input Field Handlers
  // -------------------------------------------------------------
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (error) setError('');

    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    const fullCode = updated.join('');
    if (fullCode.length === 6 && !updated.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
        e.preventDefault();
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      e.preventDefault();
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const digitsOnly = pasted.replace(/\D/g, '').slice(0, 6);

    if (!digitsOnly) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < digitsOnly.length; i++) {
      newDigits[i] = digitsOnly[i];
    }
    setOtpDigits(newDigits);
    if (error) setError('');

    const nextIndex = Math.min(digitsOnly.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }

    if (digitsOnly.length === 6) {
      handleVerifyOtp(digitsOnly);
    }
  };

  // Demo auto-fill helpers
  const handleAutoFillDemoOtp = () => {
    if (demoOtp && demoOtp.length === 6) {
      setOtpDigits(demoOtp.split(''));
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
      handleVerifyOtp(demoOtp);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsSubmitting(true);
    const res = await login('owner@grocerychoice.com', 'Admin@123');
    setIsSubmitting(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Quick demo login failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundImage:
          'radial-gradient(circle at top right, rgba(5, 150, 105, 0.15), transparent 50%), radial-gradient(circle at bottom left, rgba(15, 118, 110, 0.2), transparent 50%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Card Header */}
        <div
          style={{
            backgroundColor: '#0b1324',
            padding: '2.5rem 2rem 2rem',
            textAlign: 'center',
            borderBottom: '1px solid #1e293b'
          }}
        >
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Logo size="lg" />
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Grocery Choice
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Owner Login
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Sign in to manage catalog, monitor stock &amp; fulfill orders
          </p>
        </div>

        {/* Card Body */}
        <div style={{ padding: '2rem' }}>
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                border: '1px solid #fecaca',
                fontWeight: 600
              }}
            >
              {error}
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && otpStep === 'otp' && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                marginBottom: '1.25rem',
                border: '1px solid #a7f3d0',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              {infoMessage}
            </div>
          )}

          {/* When in OTP verification step */}
          {loginMethod === 'otp' && otpStep === 'otp' ? (
            <div>
              {/* Recipient Display Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  marginBottom: '1.25rem',
                  fontSize: '0.88rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {identifier.includes('@') ? <Mail size={16} color="#059669" /> : <Smartphone size={16} color="#059669" />}
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={handleChangeIdentifier}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Change email or mobile number"
                >
                  <Edit2 size={13} />
                  <span>Change</span>
                </button>
              </div>

              {/* 6 Digit Input Grid */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="owner-otp-0"
                  style={{
                    display: 'block',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '0.5rem',
                    textAlign: 'center'
                  }}
                >
                  Enter 6-digit OTP
                </label>

                <div
                  className="owner-otp-grid"
                  onPaste={handlePaste}
                  role="group"
                  aria-label="6-Digit Owner OTP Code"
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`owner-otp-${index}`}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`owner-otp-box ${digit ? 'has-value' : ''} ${error ? 'is-invalid' : ''}`}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Digit ${index + 1} of 6`}
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.84rem',
                  color: '#64748b',
                  marginBottom: '1.5rem'
                }}
              >
                {resendTimer > 0 ? (
                  <span>
                    Resend OTP in <strong style={{ color: '#0f172a' }}>{resendTimer} seconds</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    disabled={isSubmitting}
                  >
                    <RefreshCw size={13} />
                    <span>Resend OTP</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleChangeIdentifier}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Change email/mobile
                </button>
              </div>

              {/* Verify OTP Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
                disabled={isSubmitting || otpDigits.join('').length < 6}
              >
                <ShieldCheck size={16} />
                <span>{isSubmitting ? 'Verifying OTP...' : 'Verify OTP'}</span>
              </button>

              {/* Prototype Demo OTP Helper Card */}
              {demoOtp && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#ecfdf5',
                    border: '1px dashed #059669',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <KeyRound size={14} />
                      <span>Prototype Demo OTP:</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.15em', marginTop: '2px' }}>
                      {demoOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDemoOtp}
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                    title="Click to auto-fill and test verify instantly"
                  >
                    <Sparkles size={12} />
                    <span>Auto-Fill</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Input / Selection Form */
            <div>
              {/* 1. Email / Mobile Number Input */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="owner-identifier" style={{ fontWeight: 700 }}>
                  Email / Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  {identifier.includes('@') ? (
                    <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  ) : (
                    <Smartphone size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                  <input
                    id="owner-identifier"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="name@grocerychoice.com or 10-digit mobile"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* 2. Login Method Selector: Password or OTP */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 700 }}>
                  Login Method:
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: loginMethod === 'password' ? 700 : 500,
                      color: loginMethod === 'password' ? '#0f172a' : '#64748b'
                    }}
                  >
                    <input
                      type="radio"
                      name="ownerLoginMethod"
                      value="password"
                      checked={loginMethod === 'password'}
                      onChange={() => {
                        setLoginMethod('password');
                        setError('');
                        setOtpStep('input');
                      }}
                      style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                    />
                    <span>Password</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: loginMethod === 'otp' ? 700 : 500,
                      color: loginMethod === 'otp' ? '#0f172a' : '#64748b'
                    }}
                  >
                    <input
                      type="radio"
                      name="ownerLoginMethod"
                      value="otp"
                      checked={loginMethod === 'otp'}
                      onChange={() => {
                        setLoginMethod('otp');
                        setError('');
                      }}
                      style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                    />
                    <span>OTP</span>
                  </label>
                </div>
              </div>

              {/* 3. Password Login Mode */}
              {loginMethod === 'password' && (
                <form onSubmit={handlePasswordSubmit} noValidate>
                  {/* Password Field with Visibility Toggle Button */}
                  <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                    <label className="form-label" htmlFor="owner-password" style={{ fontWeight: 700 }}>
                      Password
                    </label>
                    <div className="password-input-wrapper">
                      <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        id="owner-password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="••••••••••••••••"
                        autoComplete="current-password"
                      />
                      {/* Password Visibility Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="password-toggle-btn"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Authenticating...' : 'Login'}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}

              {/* 4. OTP Login Mode (Send OTP step) */}
              {loginMethod === 'otp' && otpStep === 'input' && (
                <form onSubmit={handleSendOtp} noValidate>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Sending OTP...' : 'Send OTP'}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* QUICK DEMO LOGIN BUTTON (FOR LOCAL EVALUATION)          */}
          {/* ======================================================= */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem' }}
            >
              <ShieldCheck size={16} />
              <span>Instant Demo Owner Login</span>
            </button>
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
            Grocery Choice Portal Prototype • Phase 1
          </div>
        </div>
      </div>
    </div>
  );
}
