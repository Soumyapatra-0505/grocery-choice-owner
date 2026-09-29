import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOwnerAuth } from '../context/OwnerAuthContext';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  Edit2,
  Trash2,
  X,
  Save,
  Camera,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';

/**
 * Formats date string into professional display format: "15 Aug 1985".
 * Returns "Not provided" if date is null, empty, or unparseable.
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'Not provided';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (!isNaN(day) && monthIndex >= 0 && monthIndex < 12 && !isNaN(year)) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr || 'Not provided';
  }
}

export default function ProfilePage() {
  const { owner, logout, updateOwnerProfile } = useOwnerAuth();
  const navigate = useNavigate();

  // Navigation tab state: 'personal' | 'security'
  const [activeTab, setActiveTab] = useState('personal');

  // Edit Personal Information state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: owner?.fullName || owner?.name || '',
    email: owner?.email || '',
    phone: owner?.phone || '',
    gender: owner?.gender || '',
    dateOfBirth: owner?.dateOfBirth ? String(owner.dateOfBirth).split('T')[0] : ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Maximum allowed date for date of birth (cannot be in the future)
  const maxDateOfBirth = new Date().toISOString().split('T')[0];

  // Profile Picture States & Handlers
  const fileInputRef = useRef(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Handle selecting an image file from the device
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setStatusMessage(null);

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size: maximum 2MB
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setImageError(`File size (${sizeMb}MB) exceeds the 2MB limit. Please select a smaller photo.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Generate immediate client-side preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImagePreview(event.target.result);
    };
    reader.onerror = () => {
      setImageError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // Compress to lightweight square thumbnail avatar (160x160, ~15KB) and save
  const handleSaveProfilePicture = async () => {
    if (!selectedImagePreview) return;

    try {
      setIsProcessingImage(true);
      setImageError(null);

      const img = new Image();
      img.src = selectedImagePreview;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Canvas center-crop and resize
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      canvas.width = 160;
      canvas.height = 160;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, startX, startY, size, size, 0, 0, 160, 160);

      // Lightweight compressed avatar data URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      await updateOwnerProfile({ profilePicture: compressedDataUrl });
      setSelectedImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatusMessage({ type: 'success', text: 'Profile picture updated successfully.' });
    } catch (err) {
      console.error('Failed to compress and save avatar:', err);
      setImageError('Unable to process photo. Please try a different image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCancelImagePreview = () => {
    setSelectedImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveProfilePicture = async () => {
    const confirmRemove = window.confirm('Are you sure you want to remove your profile picture and return to the default avatar?');
    if (!confirmRemove) return;

    try {
      await updateOwnerProfile({ profilePicture: null });
      setSelectedImagePreview(null);
      setImageError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatusMessage({ type: 'info', text: 'Profile picture removed. Default avatar restored.' });
    } catch (err) {
      console.error('Failed to remove profile picture:', err);
      setImageError('Unable to remove photo. Please try again.');
    }
  };

  // Personal Info Form Handlers
  const handleStartEdit = () => {
    setProfileForm({
      fullName: owner?.fullName || owner?.name || '',
      email: owner?.email || '',
      phone: owner?.phone || '',
      gender: owner?.gender || '',
      dateOfBirth: owner?.dateOfBirth ? String(owner.dateOfBirth).split('T')[0] : ''
    });
    setProfileErrors({});
    setStatusMessage(null);
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileErrors({});
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateProfileForm = () => {
    const errs = {};
    const trimmedName = profileForm.fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Full Name is required.';
    } else if (trimmedName.length < 2) {
      errs.fullName = 'Full Name must be at least 2 characters.';
    }

    if (profileForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileForm.email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }

    if (profileForm.phone) {
      const cleanPhone = profileForm.phone.replace(/[\s+-]/g, '');
      if (cleanPhone.length < 10) {
        errs.phone = 'Please enter a valid phone number (at least 10 digits).';
      }
    }

    if (profileForm.dateOfBirth) {
      const selectedDate = new Date(profileForm.dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        errs.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      setIsSavingProfile(true);
      await updateOwnerProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        gender: profileForm.gender || '',
        dateOfBirth: profileForm.dateOfBirth || ''
      });
      setIsEditingProfile(false);
      setStatusMessage({ type: 'success', text: 'Owner profile details updated successfully.' });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.data?.message || err.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to sign out of the Grocery Choice Owner Portal?');
    if (!confirmLogout) return;
    logout();
    navigate('/login');
  };

  const currentDisplayAvatar = selectedImagePreview || owner?.profilePicture || null;
  const ownerDisplayName = owner?.fullName || owner?.name || 'Store Owner';
  const ownerInitial = ownerDisplayName.charAt(0).toUpperCase();

  return (
    <div className="profile-page-container">
      <div className="profile-layout-grid">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Owner Profile Navigation Sidebar            */}
        {/* ========================================================= */}
        <aside className="profile-sidebar" aria-label="Owner Profile Navigation">
          <nav className="profile-sidebar-nav" aria-label="Profile Sections">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`profile-nav-item ${activeTab === 'personal' ? 'active' : ''}`}
            >
              <span className="profile-nav-icon"><User size={20} /></span>
              <span className="profile-nav-label">Personal Information</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`profile-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            >
              <span className="profile-nav-icon"><ShieldCheck size={20} /></span>
              <span className="profile-nav-label">Account &amp; Security</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="profile-nav-item profile-nav-item-danger"
            >
              <span className="profile-nav-icon"><LogOut size={20} /></span>
              <span className="profile-nav-label">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Main Profile Content                       */}
        {/* ========================================================= */}
        <main className="profile-main-content">
          {/* Header Card */}
          <div className="profile-header-card">
            <div className="profile-header-user">
              <div
                className="profile-header-avatar"
                title={ownerDisplayName}
              >
                {currentDisplayAvatar ? (
                  <img
                    src={currentDisplayAvatar}
                    alt={ownerDisplayName}
                  />
                ) : (
                  ownerInitial
                )}
              </div>
              <div className="profile-header-info">
                <h1>{ownerDisplayName}</h1>
                <div className="profile-header-meta">
                  <span className="owner-role-pill">
                    <ShieldCheck size={13} />
                    <span>{owner?.role || 'OWNER'}</span>
                  </span>
                  {owner?.email && <span>{owner.email}</span>}
                  {owner?.email && owner?.phone && <span className="profile-header-meta-sep">•</span>}
                  {owner?.phone && <span>{owner.phone}</span>}
                </div>
              </div>
            </div>

            <div className="profile-header-actions">
              {activeTab === 'personal' && !isEditingProfile && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                >
                  <Edit2 size={15} />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.88rem',
                  color: '#ef4444',
                  borderColor: '#fecaca'
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              role="alert"
              style={{
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                backgroundColor: statusMessage.type === 'error' ? '#fef2f2' : '#ecfdf5',
                border: statusMessage.type === 'error' ? '1px solid #fecaca' : '1px solid #a7f3d0',
                color: statusMessage.type === 'error' ? '#991b1b' : '#065f46',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              {statusMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Personal Information & Profile Picture */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile Picture Card */}
              <div className="profile-card">
                <div style={{ marginBottom: '1.25rem' }}>
                  <h2 className="profile-card-title">Profile Picture</h2>
                  <p className="profile-card-subtitle">
                    Upload or update your store owner avatar. Accepted formats: JPEG, PNG, or WebP up to 2MB.
                  </p>
                </div>

                {/* Image Error Alert */}
                {imageError && (
                  <div
                    role="alert"
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{imageError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
                  {/* Avatar Preview Box */}
                  <div style={{ position: 'relative' }}>
                    <div
                      className="avatar-preview-box"
                      style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        backgroundColor: '#f8fafc',
                        border: selectedImagePreview ? '3px solid #059669' : '2px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                    >
                      {currentDisplayAvatar ? (
                        <img
                          src={currentDisplayAvatar}
                          alt="Profile avatar preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            fontSize: '2.25rem',
                            fontWeight: 800
                          }}
                        >
                          {ownerInitial}
                        </div>
                      )}
                    </div>

                    {selectedImagePreview && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Preview
                      </span>
                    )}
                  </div>

                  {/* Actions & File Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      aria-label="Upload profile image"
                    />

                    {!selectedImagePreview ? (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                        >
                          <Camera size={16} />
                          <span>{owner?.profilePicture ? 'Change Picture' : 'Upload Picture'}</span>
                        </button>

                        {owner?.profilePicture && (
                          <button
                            type="button"
                            onClick={handleRemoveProfilePicture}
                            className="btn btn-outline"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.88rem',
                              color: '#ef4444',
                              borderColor: '#fca5a5'
                            }}
                          >
                            <Trash2 size={15} />
                            <span>Remove Picture</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={handleSaveProfilePicture}
                          disabled={isProcessingImage}
                          className="btn btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                        >
                          <Save size={16} />
                          <span>{isProcessingImage ? 'Saving...' : 'Save Picture'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelImagePreview}
                          disabled={isProcessingImage}
                          className="btn btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                        >
                          <X size={15} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}

                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                      Recommended: Square image, at least 300x300 pixels. Maximum file size: 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div>
                    <h2 className="profile-card-title">Personal Information</h2>
                    <p className="profile-card-subtitle">
                      Manage your official store owner identity and contact details.
                    </p>
                  </div>

                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
                    >
                      <Edit2 size={15} />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  /* Two-Column View Mode */
                  <div className="personal-info-grid">
                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <User size={13} color="#059669" />
                        <span>FULL NAME</span>
                      </span>
                      <span className="personal-info-value">
                        {owner?.fullName || owner?.name || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <Mail size={13} color="#059669" />
                        <span>EMAIL ADDRESS</span>
                      </span>
                      <span className="personal-info-value">
                        {owner?.email || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <Phone size={13} color="#059669" />
                        <span>PHONE NUMBER</span>
                      </span>
                      <span className="personal-info-value">
                        {owner?.phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <User size={13} color="#059669" />
                        <span>GENDER</span>
                      </span>
                      <span className={`personal-info-value ${!owner?.gender ? 'empty' : ''}`}>
                        {owner?.gender || 'Not provided'}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <Calendar size={13} color="#059669" />
                        <span>DATE OF BIRTH</span>
                      </span>
                      <span className={`personal-info-value ${!owner?.dateOfBirth ? 'empty' : ''}`}>
                        {formatDisplayDate(owner?.dateOfBirth)}
                      </span>
                    </div>

                    <div className="personal-info-field">
                      <span className="personal-info-label">
                        <ShieldCheck size={13} color="#059669" />
                        <span>ACCOUNT ROLE</span>
                      </span>
                      <span className="personal-info-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#059669', fontWeight: 800 }}>{owner?.role || 'OWNER'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>(Store Administrator)</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Two-Column Edit Form */
                  <form onSubmit={handleSaveProfile} className="profile-edit-form">
                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label className="profile-form-label" htmlFor="owner-fullName">
                          Full Name *
                        </label>
                        <input
                          id="owner-fullName"
                          type="text"
                          name="fullName"
                          value={profileForm.fullName}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.fullName ? 'has-error' : ''}`}
                          placeholder="e.g. Suresh Verma"
                        />
                        {profileErrors.fullName && (
                          <span className="profile-form-error">{profileErrors.fullName}</span>
                        )}
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label" htmlFor="owner-email">
                          Email Address
                        </label>
                        <input
                          id="owner-email"
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.email ? 'has-error' : ''}`}
                          placeholder="e.g. owner@grocerychoice.com"
                        />
                        {profileErrors.email && (
                          <span className="profile-form-error">{profileErrors.email}</span>
                        )}
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label" htmlFor="owner-phone">
                          Phone Number
                        </label>
                        <input
                          id="owner-phone"
                          type="tel"
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.phone ? 'has-error' : ''}`}
                          placeholder="e.g. +91 98765 43210"
                        />
                        {profileErrors.phone && (
                          <span className="profile-form-error">{profileErrors.phone}</span>
                        )}
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label" htmlFor="owner-gender">
                          Gender
                        </label>
                        <select
                          id="owner-gender"
                          name="gender"
                          value={profileForm.gender}
                          onChange={handleProfileFormChange}
                          className="profile-form-select"
                          aria-label="Select Gender"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label" htmlFor="owner-dateOfBirth">
                          Date of Birth
                        </label>
                        <input
                          id="owner-dateOfBirth"
                          type="date"
                          name="dateOfBirth"
                          max={maxDateOfBirth}
                          value={profileForm.dateOfBirth}
                          onChange={handleProfileFormChange}
                          className={`profile-form-input ${profileErrors.dateOfBirth ? 'has-error' : ''}`}
                          aria-label="Date of Birth"
                        />
                        {profileErrors.dateOfBirth && (
                          <span className="profile-form-error">{profileErrors.dateOfBirth}</span>
                        )}
                      </div>
                    </div>

                    <div className="profile-form-actions">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSavingProfile}
                        className="btn btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Save size={16} />
                        <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Account & Security */}
          {activeTab === 'security' && (
            <div className="profile-card">
              <h2 className="profile-card-title">Account &amp; Security</h2>
              <p className="profile-card-subtitle" style={{ marginBottom: '1.5rem' }}>
                Store administrator account details, security authorizations, and session management.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <ShieldCheck size={18} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Store Owner Access &amp; Privileges</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#475569' }}>
                    Your account has full administrator authority over catalog management, pricing, stock levels, orders dispatch, customer records, and sales analytics.
                  </p>
                  <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                    ✓ Full System Administration Permissions Active
                  </div>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <Building2 size={18} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Assigned Store Hub</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#475569' }}>
                    Hub: <strong>{owner?.storeName || 'Grocery Choice - Flagship Hub'}</strong> • Store ID: <strong>#HUB-01</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Status: Online &amp; Open for Fulfillment
                  </p>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3', marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    Session Management
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#be123c' }}>
                    Sign out of your active Grocery Choice Owner session on this device.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn"
                    style={{
                      backgroundColor: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out of Owner Portal</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
