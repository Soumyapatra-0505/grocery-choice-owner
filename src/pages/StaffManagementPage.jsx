import React, { useState, useEffect, useCallback } from 'react';
import { useOwnerAuth } from '../context/OwnerAuthContext';
import { staffApi, ownershipApi, designationApi } from '../services/api';
import {
  Users,
  Shield,
  ShieldCheck,
  Crown,
  Briefcase,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  History,
  ArrowRightLeft,
  UserX,
  UserCheck,
  Info
} from 'lucide-react';

export default function StaffManagementPage() {
  const { owner } = useOwnerAuth();

  // Active Tab: 'directory' | 'designations' | 'ownership' | 'audit'
  const [activeTab, setActiveTab] = useState('directory');

  // Data states
  const [staffList, setStaffList] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [primaryOwner, setPrimaryOwner] = useState(null);
  const [eligibleOwners, setEligibleOwners] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Directory filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [roleChangeStaff, setRoleChangeStaff] = useState(null);
  const [newRoleSelection, setNewRoleSelection] = useState('STAFF');
  const [designationChangeStaff, setDesignationChangeStaff] = useState(null);
  const [newDesignationSelection, setNewDesignationSelection] = useState('');
  const [revokeStaff, setRevokeStaff] = useState(null);

  // Designation modals
  const [showAddDesignationModal, setShowAddDesignationModal] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [designationFormTitle, setDesignationFormTitle] = useState('');
  const [designationFormDesc, setDesignationFormDesc] = useState('');

  // Ownership transfer state
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState('');
  const [previousOwnerRole, setPreviousOwnerRole] = useState('OWNER');
  const [transferKeyword, setTransferKeyword] = useState('');
  const [transferPassword, setTransferPassword] = useState('');
  const [transferSubmitting, setSubmittingTransfer] = useState(false);

  // Form states for Add Staff
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('STAFF');
  const [formDesignation, setFormDesignation] = useState('');
  const [formStoreHub, setFormStoreHub] = useState('Flagship Hub');
  const [formPassword, setFormPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Contact Edit Modal states
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isPrimaryOwner = !!owner?.primaryOwner;
  const isOwner = owner?.role === 'OWNER';
  const isAdmin = owner?.role === 'ADMIN';

  // Authorization check for editing contact details of a user
  const canEditPerson = useCallback((person) => {
    if (!owner || !person) return false;
    if (owner.role === 'STAFF' || owner.role === 'CUSTOMER') return false;
    // Primary Owner target: only Primary Owner can edit themselves
    if (person.primaryOwner) {
      return isPrimaryOwner;
    }
    // OWNER target (non-primary)
    if (person.role === 'OWNER') {
      if (isAdmin) return false;
      if (isOwner && !isPrimaryOwner && owner.id !== person.id) return false;
      return true;
    }
    // ADMIN target
    if (person.role === 'ADMIN') {
      if (isPrimaryOwner || isOwner) return true;
      if (isAdmin) {
        return owner.id === person.id || owner.permissions?.includes('MANAGE_ADMINS');
      }
      return false;
    }
    // STAFF target
    if (person.role === 'STAFF') {
      return isPrimaryOwner || isOwner || isAdmin || owner.permissions?.includes('MANAGE_STAFF');
    }
    return isPrimaryOwner;
  }, [owner, isPrimaryOwner, isOwner, isAdmin]);

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Load staff data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [staffData, desigData, poData, auditData] = await Promise.all([
        staffApi.getAll().catch(() => []),
        designationApi.getAll().catch(() => []),
        ownershipApi.getPrimaryOwner().catch(() => null),
        ownershipApi.getAuditLogs().catch(() => [])
      ]);

      setStaffList(Array.isArray(staffData) ? staffData : []);
      setDesignations(Array.isArray(desigData) ? desigData : []);
      setPrimaryOwner(poData);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);

      // Filter eligible owners (active OWNER accounts that are not primary owner)
      if (Array.isArray(staffData)) {
        const eligible = staffData.filter(
          (s) => s.role === 'OWNER' && !s.primaryOwner && s.status === 'ACTIVE'
        );
        setEligibleOwners(eligible);
        if (eligible.length > 0 && !selectedNewOwnerId) {
          setSelectedNewOwnerId(String(eligible[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load staff management data:', err);
      setError(err.message || 'Failed to load staff records');
    } finally {
      setLoading(false);
    }
  }, [selectedNewOwnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Add Staff submission
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim() || !formEmail.trim() || !formRole) {
      setFormError('Full name, email, and system role are required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        fullName: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || null,
        role: formRole,
        designation: formDesignation.trim() || null,
        storeHub: formStoreHub.trim() || 'Flagship Hub',
        status: 'ACTIVE',
        password: formPassword.trim() || null
      };

      await staffApi.create(payload);
      showNotification(`Staff member ${payload.fullName} added successfully.`);
      setShowAddStaffModal(false);
      resetAddForm();
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to add staff member.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('STAFF');
    setFormDesignation('');
    setFormStoreHub('Flagship Hub');
    setFormPassword('');
    setFormError('');
  };

  // Handle Edit Staff Contact submission
  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      await staffApi.updateContact(editingStaff.id, {
        fullName: editingStaff.fullName?.trim(),
        email: editingStaff.email?.trim() || null,
        phone: editingStaff.phone?.trim() || null,
        designation: editingStaff.designation?.trim() || null,
        storeHub: editingStaff.storeHub?.trim() || null
      });
      showNotification(`Updated contact details for ${editingStaff.fullName}.`);
      setEditingStaff(null);
      await loadData();
    } catch (err) {
      console.error('Contact update error:', err);
      setEditError(err.message || 'Failed to update contact details.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Role Change submission
  const handleRoleChangeSubmit = async () => {
    if (!roleChangeStaff) return;
    try {
      await staffApi.changeRole(roleChangeStaff.id, newRoleSelection);
      showNotification(`Role changed to ${newRoleSelection} for ${roleChangeStaff.fullName}.`);
      setRoleChangeStaff(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to change system role.');
    }
  };

  // Handle Designation Change submission
  const handleDesignationChangeSubmit = async () => {
    if (!designationChangeStaff) return;
    try {
      await staffApi.changeDesignation(designationChangeStaff.id, newDesignationSelection);
      showNotification(`Designation updated for ${designationChangeStaff.fullName}.`);
      setDesignationChangeStaff(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to change designation.');
    }
  };

  // Handle Status Toggle (Enable / Disable)
  const handleToggleStatus = async (staffMember) => {
    const newStatus = staffMember.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'Enable' : 'Disable';
    if (!window.confirm(`Are you sure you want to ${actionLabel.toLowerCase()} the account for ${staffMember.fullName}?`)) {
      return;
    }
    try {
      await staffApi.changeStatus(staffMember.id, newStatus);
      showNotification(`Account ${actionLabel.toLowerCase()}d for ${staffMember.fullName}.`);
      await loadData();
    } catch (err) {
      alert(err.message || `Failed to ${actionLabel.toLowerCase()} account.`);
    }
  };

  // Handle Revoke Staff Access
  const handleRevokeAccess = async () => {
    if (!revokeStaff) return;
    try {
      await staffApi.remove(revokeStaff.id);
      showNotification(`Staff access revoked for ${revokeStaff.fullName}. Account restored to Customer.`);
      setRevokeStaff(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to revoke staff access.');
    }
  };

  // Handle Designation Create/Edit
  const handleSaveDesignation = async (e) => {
    e.preventDefault();
    if (!designationFormTitle.trim()) return;
    try {
      if (editingDesignation) {
        await designationApi.update(editingDesignation.id, {
          title: designationFormTitle.trim(),
          description: designationFormDesc.trim() || null
        });
        showNotification(`Designation '${designationFormTitle}' updated.`);
      } else {
        await designationApi.create({
          title: designationFormTitle.trim(),
          description: designationFormDesc.trim() || null
        });
        showNotification(`Designation '${designationFormTitle}' created.`);
      }
      setShowAddDesignationModal(false);
      setEditingDesignation(null);
      setDesignationFormTitle('');
      setDesignationFormDesc('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save designation.');
    }
  };

  const handleDeleteDesignation = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete designation '${title}'?`)) return;
    try {
      await designationApi.delete(id);
      showNotification(`Designation '${title}' deleted.`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete designation.');
    }
  };

  // Handle Primary Ownership Transfer
  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!selectedNewOwnerId) {
      alert('Please select an eligible OWNER account to receive Primary Ownership.');
      return;
    }
    if (transferKeyword.trim().toUpperCase() !== 'TRANSFER') {
      alert('You must type the confirmation keyword "TRANSFER" in all caps.');
      return;
    }

    const selectedOwnerObj = eligibleOwners.find((o) => String(o.id) === String(selectedNewOwnerId));
    const confirmMsg = `WARNING: You are about to transfer Primary Ownership of Grocery Choice to ${selectedOwnerObj?.fullName || 'the selected owner'}.\n\nYour new role will be: ${previousOwnerRole}.\n\nThis transaction cannot be undone. Are you sure you want to proceed?`;
    if (!window.confirm(confirmMsg)) return;

    setSubmittingTransfer(true);
    try {
      const res = await ownershipApi.transfer({
        newPrimaryOwnerId: Number(selectedNewOwnerId),
        previousOwnerNewRole: previousOwnerRole,
        confirmKeyword: 'TRANSFER',
        currentOwnerPassword: transferPassword.trim() || null
      });

      showNotification(res.message || 'Primary Ownership successfully transferred!');
      setTransferKeyword('');
      setTransferPassword('');
      await loadData();
      // Reload page to refresh owner auth context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Ownership transfer failed.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.designation?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              margin: 0
            }}
          >
            <ShieldCheck size={28} color="#059669" />
            <span>Staff & Ownership Management</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Manage store owners, administrators, store managers, roles, business designations, and ownership succession.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadData}
            title="Refresh records"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setShowAddStaffModal(true);
            }}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {successMessage && (
        <div
          role="status"
          style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <AlertTriangle size={18} color="#ef4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.2rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: activeTab === 'directory' ? '#059669' : '#64748b',
            borderBottom: activeTab === 'directory' ? '3px solid #059669' : '3px solid transparent',
            marginBottom: '-2px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={17} />
          <span>Staff Directory ({staffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('designations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.2rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: activeTab === 'designations' ? '#059669' : '#64748b',
            borderBottom: activeTab === 'designations' ? '3px solid #059669' : '3px solid transparent',
            marginBottom: '-2px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Briefcase size={17} />
          <span>Designations ({designations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ownership')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.2rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: activeTab === 'ownership' ? '#d97706' : '#64748b',
            borderBottom: activeTab === 'ownership' ? '3px solid #d97706' : '3px solid transparent',
            marginBottom: '-2px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Crown size={17} color={activeTab === 'ownership' ? '#d97706' : '#64748b'} />
          <span>Ownership Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.2rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: activeTab === 'audit' ? '#059669' : '#64748b',
            borderBottom: activeTab === 'audit' ? '3px solid #059669' : '3px solid transparent',
            marginBottom: '-2px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={17} />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: STAFF DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === 'directory' && (
        <div>
          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div className="owner-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Personnel
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                {staffList.length}
              </div>
            </div>

            <div className="owner-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Store Owners
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#9333ea', marginTop: '0.25rem' }}>
                {staffList.filter((s) => s.role === 'OWNER').length}
              </div>
            </div>

            <div className="owner-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Admins / Managers
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
                {staffList.filter((s) => s.role === 'ADMIN').length}
              </div>
            </div>

            <div className="owner-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Operational Staff
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                {staffList.filter((s) => s.role === 'STAFF').length}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            className="owner-card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search staff by name, email, phone, or designation..."
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="owner-card">
            <div className="owner-table-container">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Contact Info</th>
                    <th>System Role</th>
                    <th>Business Designation</th>
                    <th>Store / Hub</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Loading staff members...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No staff members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((person) => {
                      const isPO = !!person.primaryOwner;
                      return (
                        <tr key={person.id} style={{ opacity: person.status === 'DISABLED' ? 0.6 : 1 }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  backgroundColor: isPO ? '#f59e0b' : person.role === 'OWNER' ? '#9333ea' : person.role === 'ADMIN' ? '#2563eb' : '#059669',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.95rem',
                                  flexShrink: 0
                                }}
                              >
                                {isPO ? <Crown size={19} /> : person.fullName?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span>{person.fullName}</span>
                                  {isPO && (
                                    <span
                                      title="Primary Owner of Grocery Choice"
                                      style={{
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        backgroundColor: '#fef3c7',
                                        color: '#92400e',
                                        padding: '0.15rem 0.45rem',
                                        borderRadius: '9999px',
                                        border: '1px solid #fde68a',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.2rem'
                                      }}
                                    >
                                      <Crown size={11} /> Primary Owner
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID #{person.id}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{person.email}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{person.phone || 'No phone'}</div>
                          </td>

                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                backgroundColor: isPO ? '#fef3c7' : person.role === 'OWNER' ? '#f3e8ff' : person.role === 'ADMIN' ? '#dbeafe' : '#ccfbf1',
                                color: isPO ? '#92400e' : person.role === 'OWNER' ? '#7e22ce' : person.role === 'ADMIN' ? '#1d4ed8' : '#0f766e',
                                border: isPO ? '1px solid #fde68a' : person.role === 'OWNER' ? '1px solid #e9d5ff' : person.role === 'ADMIN' ? '1px solid #bfdbfe' : '1px solid #99f6e4'
                              }}
                            >
                              {person.role}
                            </span>
                          </td>

                          <td>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#334155',
                                backgroundColor: '#f1f5f9',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '6px'
                              }}
                            >
                              {person.designation || 'Not Assigned'}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                              {person.storeHub || 'Flagship Hub'}
                            </span>
                          </td>

                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: person.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                color: person.status === 'ACTIVE' ? '#15803d' : '#b91c1c'
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: person.status === 'ACTIVE' ? '#16a34a' : '#dc2626'
                                }}
                              />
                              {person.status}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {/* Edit details */}
                              {canEditPerson(person) && (
                                <button
                                  type="button"
                                  title="Edit contact information"
                                  onClick={() => {
                                    setEditError('');
                                    setEditingStaff({ ...person });
                                  }}
                                  style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.55rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: '#334155'
                                  }}
                                >
                                  <Edit2 size={13} /> Edit
                                </button>
                              )}

                              {/* Change Role (blocked for Primary Owner) */}
                              {!isPO && (
                                <button
                                  type="button"
                                  title="Change system role"
                                  onClick={() => {
                                    setRoleChangeStaff(person);
                                    setNewRoleSelection(person.role);
                                  }}
                                  style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.55rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: '#4338ca'
                                  }}
                                >
                                  <Shield size={13} /> Role
                                </button>
                              )}

                              {/* Change Designation */}
                              <button
                                type="button"
                                title="Change business designation"
                                onClick={() => {
                                  setDesignationChangeStaff(person);
                                  setNewDesignationSelection(person.designation || '');
                                }}
                                style={{
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.55rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#0369a1'
                                }}
                              >
                                <Briefcase size={13} /> Title
                              </button>

                              {/* Toggle Status (cannot disable Primary Owner or self) */}
                              {!isPO && person.id !== owner?.id && (
                                <button
                                  type="button"
                                  title={person.status === 'ACTIVE' ? 'Disable account' : 'Enable account'}
                                  onClick={() => handleToggleStatus(person)}
                                  style={{
                                    backgroundColor: person.status === 'ACTIVE' ? '#fff1f2' : '#f0fdf4',
                                    border: person.status === 'ACTIVE' ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.55rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: person.status === 'ACTIVE' ? '#be123c' : '#15803d'
                                  }}
                                >
                                  {person.status === 'ACTIVE' ? <UserX size={13} /> : <UserCheck size={13} />}
                                  {person.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                                </button>
                              )}

                              {/* Revoke Access (blocked for Primary Owner) */}
                              {!isPO && (
                                <button
                                  type="button"
                                  title="Revoke staff access (restores account to customer)"
                                  onClick={() => setRevokeStaff(person)}
                                  style={{
                                    backgroundColor: '#fff1f2',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.55rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: '#b91c1c'
                                  }}
                                >
                                  <Trash2 size={13} /> Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BUSINESS DESIGNATIONS */}
      {/* ======================================================== */}
      {activeTab === 'designations' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Store Business Designations
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Define business job titles independently from system security roles.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingDesignation(null);
                setDesignationFormTitle('');
                setDesignationFormDesc('');
                setShowAddDesignationModal(true);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>Add Designation</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1rem'
            }}
          >
            {designations.map((desig) => {
              const assignedCount = staffList.filter((s) => s.designation === desig.title).length;
              return (
                <div key={desig.id} className="owner-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {desig.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDesignation(desig);
                          setDesignationFormTitle(desig.title);
                          setDesignationFormDesc(desig.description || '');
                          setShowAddDesignationModal(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.2rem' }}
                        title="Edit designation"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDesignation(desig.id, desig.title)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                        title="Delete designation"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#64748b', minHeight: '36px', margin: '0.25rem 0 0.85rem 0' }}>
                    {desig.description || 'No description provided.'}
                  </p>

                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: '#475569',
                      fontWeight: 600
                    }}
                  >
                    <span>Staff Assigned:</span>
                    <span
                      style={{
                        backgroundColor: assignedCount > 0 ? '#e0f2fe' : '#f1f5f9',
                        color: assignedCount > 0 ? '#0284c7' : '#64748b',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontWeight: 800
                      }}
                    >
                      {assignedCount} members
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: OWNERSHIP MANAGEMENT & TRANSFER */}
      {/* ======================================================== */}
      {activeTab === 'ownership' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Current Primary Owner Banner */}
          <div
            className="owner-card"
            style={{
              padding: '1.75rem',
              backgroundColor: '#fffbeb',
              border: '2px solid #fde68a',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Crown size={30} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                    Active Head of Business
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#78350f', margin: '0.15rem 0' }}>
                  {primaryOwner?.fullName || 'Suresh Verma'}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                  {primaryOwner?.email} • {primaryOwner?.phone || 'No phone'} • Designation:{' '}
                  <strong>{primaryOwner?.designation || 'Store Owner'}</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #fef3c7',
                fontSize: '0.82rem',
                color: '#78350f',
                maxWidth: '340px'
              }}
            >
              The <strong>Primary Owner</strong> retains final authority over all store assets, co-owners, role promotions, and succession.
            </div>
          </div>

          {/* Transfer Primary Ownership Form */}
          <div className="owner-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <ArrowRightLeft size={22} color="#d97706" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Transfer Primary Ownership
              </h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
              If you are stepping down or handing over the business, transfer Primary Ownership to another active <strong>OWNER</strong>.
              Your account and login will remain intact, without sharing credentials.
            </p>

            {/* Strict Warning Banner */}
            <div
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                gap: '0.85rem'
              }}
            >
              <AlertTriangle size={24} color="#e11d48" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#9f1239' }}>
                  Irreversible Security Notice
                </h4>
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#be123c', lineHeight: 1.5 }}>
                  This action transfers Primary Ownership of Grocery Choice. The selected account will become the new Primary Owner with full ownership governance authority.
                  Exactly one Primary Owner will exist after this atomic transaction.
                </p>
              </div>
            </div>

            {eligibleOwners.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: '#64748b'
                }}
              >
                <Info size={24} color="#64748b" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ fontWeight: 700, margin: 0 }}>No eligible OWNER accounts available.</p>
                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  To transfer primary ownership, you must first add another person or promote an existing Admin/Staff to the <strong>OWNER</strong> role in the Staff Directory.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTransferOwnership}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Transfer Ownership To (Target Owner):
                    </label>
                    <select
                      id="transfer-new-owner-select"
                      value={selectedNewOwnerId}
                      onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                      className="form-input"
                      required
                    >
                      {eligibleOwners.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.fullName} ({opt.email}) — ID #{opt.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Your Post-Transfer Role:
                    </label>
                    <select
                      id="transfer-post-role-select"
                      value={previousOwnerRole}
                      onChange={(e) => setPreviousOwnerRole(e.target.value)}
                      className="form-input"
                      required
                    >
                      <option value="OWNER">Remain Co-Owner (OWNER role with full operational access)</option>
                      <option value="CUSTOMER">Step Down Completely (CUSTOMER role only)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.4rem' }}>
                      Type &quot;TRANSFER&quot; to Confirm:
                    </label>
                    <input
                      id="transfer-keyword-input"
                      type="text"
                      className="form-input"
                      style={{ borderColor: '#fca5a5', fontWeight: 700 }}
                      placeholder="Type TRANSFER in all caps"
                      value={transferKeyword}
                      onChange={(e) => setTransferKeyword(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Your Password (If set on your account):
                    </label>
                    <input
                      id="transfer-password-input"
                      type="password"
                      className="form-input"
                      placeholder="Enter your current owner password"
                      value={transferPassword}
                      onChange={(e) => setTransferPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    id="transfer-submit-btn"
                    type="submit"
                    disabled={transferSubmitting || transferKeyword.trim().toUpperCase() !== 'TRANSFER'}
                    style={{
                      backgroundColor: transferKeyword.trim().toUpperCase() === 'TRANSFER' ? '#dc2626' : '#94a3b8',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: transferKeyword.trim().toUpperCase() === 'TRANSFER' ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    <Crown size={18} />
                    <span>{transferSubmitting ? 'Transferring Primary Ownership...' : 'Execute Ownership Transfer'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: AUDIT LOGS */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="owner-card">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Staff & Ownership Audit Trail
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Immutable security log recording all ownership transfers, staff creations, role promotions, and status changes.
            </p>
          </div>

          <div className="owner-table-container">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor (Performed By)</th>
                  <th>Target User</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            backgroundColor: log.action.includes('OWNERSHIP') ? '#fef3c7' : log.action.includes('ROLE') ? '#e0e7ff' : '#f1f5f9',
                            color: log.action.includes('OWNERSHIP') ? '#b45309' : log.action.includes('ROLE') ? '#3730a3' : '#475569'
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                          {log.actorName || log.actorEmail || 'System'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.actorEmail}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                          {log.targetName || log.targetEmail || '—'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.targetEmail}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD STAFF */}
      {/* ======================================================== */}
      {showAddStaffModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="owner-card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add Staff Member</h3>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>Assign a store role and business designation.</p>
              </div>
            </div>

            {formError && (
              <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    id="staff-form-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Email Address *
                    </label>
                    <input
                      id="staff-form-email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. rahul@grocerychoice.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Mobile Phone
                    </label>
                    <input
                      id="staff-form-phone"
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      System Role *
                    </label>
                    <select
                      id="staff-form-role"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="form-input"
                      required
                    >
                      <option value="STAFF">STAFF (Store & Delivery Operations)</option>
                      <option value="ADMIN">ADMIN (Store Operations & Staff Management)</option>
                      {isPrimaryOwner && <option value="OWNER">OWNER (Full Store Authority)</option>}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Business Designation
                    </label>
                    <select
                      id="staff-form-designation"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select Designation...</option>
                      {designations.map((d) => (
                        <option key={d.id} value={d.title}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Role Disclaimer Notice */}
                {formRole === 'OWNER' && (
                  <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: '#92400e' }}>
                    <AlertTriangle size={15} style={{ display: 'inline', marginRight: '0.35rem' }} />
                    <strong>OWNER Role Notice:</strong> This grants full operational store owner privileges. Primary Ownership remains with the current Primary Owner.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Store / Hub Location
                    </label>
                    <input
                      id="staff-form-hub"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Flagship Hub, Sector 14"
                      value={formStoreHub}
                      onChange={(e) => setFormStoreHub(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Initial Password (Optional)
                    </label>
                    <input
                      id="staff-form-password"
                      type="password"
                      className="form-input"
                      placeholder="Leave blank for OTP login"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    id="staff-form-submit-btn"
                    type="submit"
                    disabled={formSubmitting}
                    className="btn btn-primary"
                  >
                    {formSubmitting ? 'Creating Staff...' : 'Create Staff Member'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT STAFF CONTACT DETAILS */}
      {/* ======================================================== */}
      {editingStaff && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="owner-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setEditingStaff(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Edit Contact Information
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
              Updating contact details for <strong>{editingStaff.fullName}</strong> ({editingStaff.role})
            </p>

            {editError && (
              <div
                role="alert"
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#991b1b',
                  fontSize: '0.85rem'
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditStaffSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStaff.fullName || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      Email Address *
                    </label>
                    {!(isPrimaryOwner || owner?.id === editingStaff.id) && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                        Primary Owner only
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    className="form-input"
                    value={editingStaff.email || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    disabled={!(isPrimaryOwner || owner?.id === editingStaff.id)}
                    readOnly={!(isPrimaryOwner || owner?.id === editingStaff.id)}
                    style={!(isPrimaryOwner || owner?.id === editingStaff.id) ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' } : {}}
                    required
                  />
                  {!(isPrimaryOwner || owner?.id === editingStaff.id) ? (
                    <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Only the Primary Owner can update another user's email address.
                    </small>
                  ) : (
                    <small style={{ color: '#059669', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Primary Owner can update this account's login email address.
                    </small>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 XXXXX XXXXX"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Enter 10-digit Indian mobile number (e.g., 9876543210 or +91 98765 43210).
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Business Designation
                  </label>
                  <select
                    value={editingStaff.designation || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Designation...</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.title}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Store / Hub Location
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStaff.storeHub || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, storeHub: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="btn btn-secondary"
                    disabled={editSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editSubmitting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {editSubmitting ? (
                      <>
                        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHANGE ROLE */}
      {/* ======================================================== */}
      {roleChangeStaff && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="owner-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setRoleChangeStaff(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Change Role: {roleChangeStaff.fullName}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 1.25rem 0' }}>
              Current Role: <strong>{roleChangeStaff.role}</strong>
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Select New System Role:
              </label>
              <select
                value={newRoleSelection}
                onChange={(e) => setNewRoleSelection(e.target.value)}
                className="form-input"
              >
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
                {isPrimaryOwner && <option value="OWNER">OWNER</option>}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setRoleChangeStaff(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleRoleChangeSubmit} className="btn btn-primary">
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CHANGE DESIGNATION */}
      {/* ======================================================== */}
      {designationChangeStaff && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="owner-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDesignationChangeStaff(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Change Title: {designationChangeStaff.fullName}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 1.25rem 0' }}>
              Current: <strong>{designationChangeStaff.designation || 'None'}</strong>
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Select Business Designation:
              </label>
              <select
                value={newDesignationSelection}
                onChange={(e) => setNewDesignationSelection(e.target.value)}
                className="form-input"
              >
                <option value="">None / Unassigned</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.title}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setDesignationChangeStaff(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleDesignationChangeSubmit} className="btn btn-primary">
                Update Designation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REVOKE STAFF ACCESS */}
      {/* ======================================================== */}
      {revokeStaff && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="owner-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setRevokeStaff(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', color: '#b91c1c' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Revoke Staff Access
              </h3>
            </div>

            <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Are you sure you want to revoke staff access for <strong>{revokeStaff.fullName}</strong>?
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
              <strong>Data Preservation Guarantee:</strong> This account will be safely restored to a standard <strong>CUSTOMER</strong> account. Their past grocery orders, delivery addresses, and personal history will remain completely intact.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setRevokeStaff(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeAccess}
                style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT DESIGNATION */}
      {/* ======================================================== */}
      {showAddDesignationModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="owner-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddDesignationModal(false)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
              {editingDesignation ? 'Edit Designation' : 'Add Business Designation'}
            </h3>

            <form onSubmit={handleSaveDesignation}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Designation Title *
                  </label>
                  <input
                    id="desig-form-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Regional Quality Inspector"
                    value={designationFormTitle}
                    onChange={(e) => setDesignationFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Description
                  </label>
                  <textarea
                    id="desig-form-desc"
                    className="form-input"
                    rows="3"
                    placeholder="Brief description of job duties and operational scope..."
                    value={designationFormDesc}
                    onChange={(e) => setDesignationFormDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddDesignationModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button id="desig-form-submit-btn" type="submit" className="btn btn-primary">
                    {editingDesignation ? 'Update Designation' : 'Create Designation'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
