import React from 'react';
import { useOwnerData } from '../context/OwnerDataContext';
import StatCard from '../components/common/StatCard';
import {
  IndianRupee,
  ShoppingCart,
  Award,
  CheckCircle,
  Truck,
  Package
} from 'lucide-react';

export default function ReportsPage() {
  const { products } = useOwnerData();

  const categoryBreakdown = [
    { name: 'Fruits & Vegetables', share: 38, sales: '₹48,200', count: 124 },
    { name: 'Dairy & Breakfast', share: 26, sales: '₹33,150', count: 98 },
    { name: 'Staples & Grains', share: 18, sales: '₹22,900', count: 65 },
    { name: 'Snacks & Munchies', share: 10, sales: '₹12,700', count: 42 },
    { name: 'Beverages & Drinks', share: 8, sales: '₹10,200', count: 36 }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
          Sales &amp; Performance Reports
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
          Revenue statistics, category performance distribution, and customer fulfillment insights.
        </p>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <StatCard
          title="Monthly Revenue"
          value="₹3,42,800"
          subtitle="September 2026 to date"
          icon={<IndianRupee size={22} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
          trend={{ value: '+18.4% vs last month', isPositive: true }}
        />

        <StatCard
          title="Average Order Value"
          value="₹642"
          subtitle="Per customer transaction"
          icon={<ShoppingCart size={22} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          trend={{ value: '+8.2%', isPositive: true }}
        />

        <StatCard
          title="Fulfillment Rate"
          value="98.6%"
          subtitle="Orders delivered on time"
          icon={<Truck size={22} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          trend={{ value: '+1.2%', isPositive: true }}
        />

        <StatCard
          title="Catalog Health"
          value={`${products.length} Items`}
          subtitle="8 product categories"
          icon={<Package size={22} />}
          iconBg="#fdf4ff"
          iconColor="#a855f7"
        />
      </div>

      {/* 2 Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
        {/* Category Share Card */}
        <div className="owner-card">
          <div className="owner-card-header">
            <div className="owner-card-title">
              <Award size={18} color="#059669" />
              <span>Sales by Category</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Last 30 Days</span>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {categoryBreakdown.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{cat.name}</span>
                  <div style={{ display: 'flex', gap: '0.75rem', fontWeight: 700 }}>
                    <span style={{ color: '#059669' }}>{cat.sales}</span>
                    <span style={{ color: '#64748b' }}>({cat.share}%)</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${cat.share}%`,
                      height: '100%',
                      backgroundColor: '#059669',
                      borderRadius: '9999px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Highlights Card */}
        <div className="owner-card">
          <div className="owner-card-header">
            <div className="owner-card-title">
              <CheckCircle size={18} color="#059669" />
              <span>Operational Efficiency Highlights</span>
            </div>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>
                ⚡ Average Delivery Speed
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Express orders dispatched in an average of <strong>18.4 minutes</strong> from local hub.
              </p>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>
                📍 Customer Delivery Geolocation Coverage
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                <strong>84%</strong> of customers selected their delivery destination via native browser GPS or 6-digit PIN code addresses.
              </p>
            </div>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>
                🌱 Organic Freshness Retention
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Customer return rate is below <strong>0.4%</strong> with 100% cold-chain transit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
