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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
          Customer Directory ({customers.length})
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Registered customer accounts, purchasing history, and lifetime order values.
        </p>
      </div>

      {/* Search Bar */}
      <div className="owner-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search customer by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="owner-card">
        <div className="owner-table-container">
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
      </div>
    </div>
  );
}
