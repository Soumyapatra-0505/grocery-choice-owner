import React, { useState } from 'react';
import { useOwnerData } from '../context/OwnerDataContext';
import { Search, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';

export default function CustomersPage() {
  const { customers } = useOwnerData();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
          Customer Directory ({customers.length})
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Registered customer accounts, purchasing history, and lifetime order values.
        </p>
      </div>

      {/* Search Bar */}
      <div className="owner-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            placeholder="Search customer by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Container (Table on Desktop, Cards on Mobile) */}
      <div className="owner-card">
        {/* Desktop Table View */}
        <div className="owner-table-container desktop-only-table">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>Orders Count</th>
                <th>Total Spend</th>
                <th>Customer Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cust) => (
                <tr key={cust.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem',
                          flexShrink: 0
                        }}
                      >
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                          {cust.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ID: {cust.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.84rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={13} color="#64748b" />
                      <span>{cust.email}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <Phone size={13} color="#64748b" />
                      <span>{cust.phone}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                      <ShoppingBag size={15} color="#059669" />
                      <span>{cust.totalOrders} orders</span>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                      ₹{cust.totalSpent.toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} />
                      <span>{new Date(cust.joinedDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="mobile-only-cards" style={{ padding: '0.75rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              No customers matching search criteria.
            </div>
          ) : (
            filtered.map((cust) => (
              <div key={cust.id} className="mobile-data-card">
                <div className="mobile-data-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        flexShrink: 0
                      }}
                    >
                      {cust.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        {cust.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Customer ID: #{cust.id}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                    ₹{cust.totalSpent.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="mobile-data-card-body">
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Email</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>{cust.email}</span>
                  </div>
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Phone</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>{cust.phone}</span>
                  </div>
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Lifetime Orders</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      {cust.totalOrders} completed
                    </span>
                  </div>
                  <div className="mobile-data-card-row">
                    <span className="mobile-data-card-label">Member Since</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {new Date(cust.joinedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
