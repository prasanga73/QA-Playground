import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProfilePage = () => {
  const { updateProfile, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.user) {
          const u = response.data.user;
          setName(u.name || '');
          setEmail(u.email || '');
          setRole(u.role || 'user');
          setUserId(u.id);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [showError]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) {
      return;
    }

    if (!userId) {
      showError('User ID not available');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put(`/users/${userId}`, {
        name: name.trim(),
        email: email.trim(),
      });

      if (response.data.success && response.data.user) {
        updateProfile(response.data.user);
        showSuccess('Profile updated successfully!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile';
      setApiError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showSuccess('You have been logged out.');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="state-container" data-testid="profile-loading">
        <div className="spinner"></div>
        <p className="state-text">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="page-container" data-testid="profile-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">User Profile</h1>
          <p className="page-subtitle">View and manage your account credentials and role</p>
        </div>
      </header>

      <div className="profile-layout">
        <div className="profile-card" data-testid="profile-card">
          <div className="profile-badge-header">
            <div className="avatar-placeholder">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-header-meta">
              <h2 className="profile-user-name">{name || 'User'}</h2>
              <div className="profile-role-wrapper">
                <span className="role-label">Role:</span>
                <span
                  className={`badge ${role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}`}
                  data-testid="profile-role"
                >
                  {role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="alert alert-danger" data-testid="profile-error">
              <svg className="alert-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="profile-form" noValidate>
            <div className="form-group">
              <label htmlFor="profile-name-input" className="form-label">
                Full Name
              </label>
              <input
                id="profile-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                data-testid="profile-name"
                placeholder="Enter full name"
              />
              {errors.name && (
                <span className="field-error-message" data-testid="profile-name-error">
                  {errors.name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="profile-email-input" className="form-label">
                Email Address
              </label>
              <input
                id="profile-email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                data-testid="profile-email"
                placeholder="Enter email address"
              />
              {errors.email && (
                <span className="field-error-message" data-testid="profile-email-error">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="profile-actions-row">
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary btn-lg"
                data-testid="profile-save"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline-danger btn-lg"
                data-testid="profile-logout"
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
