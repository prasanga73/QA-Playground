import React, { useState, useRef } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ProtectedRoute passes the page the user originally asked for; send them back there after sign-in
const getRedirectPath = (from) => {
  if (!from?.pathname || from.pathname === '/login') return '/products';
  return `${from.pathname}${from.search || ''}${from.hash || ''}`;
};

export const LoginPage = () => {
  const { isAuthenticated, login, register } = useAuth();
  const { showSuccess } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getRedirectPath(location.state?.from);

  // 'login' or 'register'
  const [authMode, setAuthMode] = useState('login');
  useDocumentTitle(authMode === 'login' ? 'Sign in' : 'Create account');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // Error and UI states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ name: false, email: false, password: false, captcha: false });
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs for auto-focusing on validation failure
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // If already authenticated, redirect
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // ==========================================
  // INTERNAL VALIDATION RULES
  // ==========================================
  const validateName = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return 'Name is required';
    }
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    return '';
  };

  const validateEmail = (val) => {
    const trimmed = (val || '').trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    // Names are valid sign-in identifiers too, so allow the characters they use
    const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9 ._'-]*$/;

    if (!trimmed) {
      return authMode === 'login' ? 'Email or username is required' : 'Email is required';
    }
    // Internal max length 254 enforcement
    if (trimmed.length > 254) {
      return 'Email cannot exceed 254 characters';
    }
    // Registration always creates an email-addressed account; sign-in takes either form
    if (authMode === 'login' && !trimmed.includes('@')) {
      if (trimmed.length < 2 || !usernameRegex.test(trimmed)) {
        return 'Invalid email or username';
      }
      return '';
    }
    if (!emailRegex.test(trimmed)) {
      return 'Invalid email format';
    }
    return '';
  };

  const validatePassword = (val) => {
    if (!val) {
      return 'Password is required';
    }
    // Strength rules apply when choosing a password, not when presenting an existing
    // one: enforcing them on sign-in rejects accounts whose password predates them.
    if (authMode === 'register') {
      // Internal 8 to 20 length enforcement
      if (val.length < 8) {
        return 'Password must be at least 8 characters';
      }
      if (val.length > 20) {
        return 'Password cannot exceed 20 characters';
      }
      const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/;
      if (!passwordComplexityRegex.test(val)) {
        return 'Password must include uppercase, lowercase, number, and special character';
      }
    }
    return '';
  };

  // Switch between Login and Register modes
  const switchMode = (newMode) => {
    setAuthMode(newMode);
    setErrors({});
    setTouched({ name: false, email: false, password: false, captcha: false });
    setApiError('');
  };

  // ==========================================
  // PROGRESSIVE UX EVENT HANDLERS
  // ==========================================
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (apiError) setApiError('');
    if (touched.name || errors.name) {
      setErrors((prev) => ({ ...prev, name: validateName(val) }));
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (apiError) setApiError('');
    if (touched.email || errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (apiError) setApiError('');
    if (touched.password || errors.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(val) }));
    }
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setErrors((prev) => ({ ...prev, name: validateName(name) }));
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  };

  const handleCaptchaToggle = () => {
    if (captchaChecked || captchaLoading) return;
    setCaptchaLoading(true);
    setErrors((prev) => ({ ...prev, captcha: '' }));

    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaChecked(true);
      setTouched((prev) => ({ ...prev, captcha: true }));
    }, 500);
  };

  // ==========================================
  // FORM SUBMISSION (LOGIN & REGISTER)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Mark all fields touched
    setTouched({ name: true, email: true, password: true, captcha: true });

    const newErrors = {};
    if (authMode === 'register') {
      const nameErr = validateName(name);
      if (nameErr) newErrors.name = nameErr;
    }

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) newErrors.password = passErr;

    setErrors(newErrors);

    // Focus first invalid field
    if (authMode === 'register' && newErrors.name) {
      nameInputRef.current?.focus();
      return;
    }
    if (newErrors.email) {
      emailInputRef.current?.focus();
      return;
    }
    if (newErrors.password) {
      passwordInputRef.current?.focus();
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const identifier = authMode === 'login' ? email.trim() : cleanEmail;
    const cleanPassword = password;

    setIsSubmitting(true);
    try {
      if (authMode === 'register') {
        // Register new account
        await register(name.trim(), cleanEmail, cleanPassword);
        showSuccess('Account created successfully! Welcome to QA Playground.');
        navigate(redirectTo, { replace: true });
      } else {
        // Login existing account
        await login(identifier, cleanPassword);
        showSuccess('Welcome back! Login successful.');
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      // Handle duplicate email (409 Conflict)
      if (status === 409 || data?.errorCode === 'DUPLICATE_EMAIL') {
        const duplicateMsg = 'Email already registered. Please sign in or use a different email.';
        setApiError(duplicateMsg);
        setErrors((prev) => ({ ...prev, email: 'Email already in use' }));
        emailInputRef.current?.focus();
      } else {
        const message = data?.message || (authMode === 'register' ? 'Registration failed. Please check your details.' : 'Login failed. Please check your credentials.');
        setApiError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick helper to fill test credentials for QA tests
  const fillQuickCredentials = (eUser, ePass) => {
    if (authMode !== 'login') setAuthMode('login');
    setEmail(eUser);
    setPassword(ePass);
    setErrors({});
    setApiError('');
    setTouched({ name: false, email: true, password: true, captcha: true });
    setCaptchaChecked(true);
  };

  return (
    <div className="auth-page-container">
      {/* Theme Toggle Button */}
      <div className="auth-theme-toggle-container">
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          data-testid="theme-toggle"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <div className="auth-card" data-testid="login-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 className="auth-title">
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="auth-subtitle">
            {authMode === 'login'
              ? 'Sign in to access your QA Playground environment'
              : 'Register your account to get started'}
          </p>
        </div>

        {/* General Error Alert Area */}
        {apiError && (
          <div className="alert alert-danger" data-testid="login-error" role="alert">
            <svg className="alert-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ flex: 1 }}>{apiError}</span>
            <button
              type="button"
              onClick={() => setApiError('')}
              className="alert-dismiss-btn"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Field: Full Name (shown only in Register mode) */}
          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                ref={nameInputRef}
                id="name"
                type="text"
                value={name}
                maxLength={100}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                disabled={isSubmitting}
                placeholder="e.g. John Doe"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                data-testid="register-name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <span id="name-error" className="field-error-message" data-testid="register-name-error" role="alert">
                  {errors.name}
                </span>
              )}
            </div>
          )}

          {/* Field: Email Address (or Username) */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {authMode === 'login' ? 'Email or Username' : 'Email Address'}
            </label>
            <input
              ref={emailInputRef}
              id="email"
              type={authMode === 'login' ? 'text' : 'email'}
              value={email}
              maxLength={254}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              disabled={isSubmitting}
              placeholder={authMode === 'login' ? 'e.g. user@test.com or admin' : 'e.g. user@test.com'}
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              data-testid="login-email"
              autoComplete="username email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" className="field-error-message" data-testid="login-email-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Field: Password with Show/Hide Toggle */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                ref={passwordInputRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                maxLength={authMode === 'login' ? undefined : 20}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                disabled={isSubmitting}
                placeholder={authMode === 'login' ? 'Enter your password' : '8 to 20 characters'}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                data-testid="login-password"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="login-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span id="password-error" className="field-error-message" data-testid="login-password-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          {/* CAPTCHA Widget */}
          <div className="form-group">
            <button
              type="button"
              className={`captcha-card-widget ${captchaChecked ? 'captcha-verified' : ''}`}
              onClick={handleCaptchaToggle}
              data-testid="login-captcha"
              disabled={isSubmitting || captchaChecked}
              aria-label="CAPTCHA verification"
            >
              <div className="captcha-checkbox-box">
                {captchaLoading ? (
                  <span className="spinner-sm"></span>
                ) : captchaChecked ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : null}
              </div>
              <span className="captcha-text">
                {captchaChecked ? 'Verification passed' : "I'm not a robot (CAPTCHA)"}
              </span>
              <span className="captcha-badge">SECURE</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-block btn-lg"
            data-testid="login-submit"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-sm"></span> {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              authMode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Switch Mode: Create Account / Sign In */}
        <div className="auth-footer-prompt">
          {authMode === 'login' ? (
            <>
              <span>Don't have an account?</span>{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('register')}
                data-testid="create-account-link"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('login')}
                data-testid="switch-to-login"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Quick Credentials Seeder for QA Testing (Login mode only) */}
        {authMode === 'login' && (
          <div className="auth-seed-hints" data-testid="quick-credentials">
            <p className="seed-hints-title">Pre-configured Test Credentials</p>
            <div className="seed-buttons-row">
              <button
                type="button"
                className="badge-btn"
                onClick={() => fillQuickCredentials('admin@test.com', 'Admin@123')}
                data-testid="fill-admin-creds"
              >
                <strong>Admin:</strong> admin@test.com / Admin@123
              </button>
              <button
                type="button"
                className="badge-btn"
                onClick={() => fillQuickCredentials('user@test.com', 'User@123')}
                data-testid="fill-user-creds"
              >
                <strong>User:</strong> user@test.com / User@123
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
