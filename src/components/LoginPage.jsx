import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Store, 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Database,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const { loginUser, shopSettings, isOnline, users } = useApp();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('Please enter your User ID / Cashier ID');
      return;
    }
    if (!password) {
      setError('Please enter your Password');
      return;
    }

    setIsSubmitting(true);
    const result = loginUser(userId, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  const handleQuickFill = (demoId, demoPass) => {
    setUserId(demoId);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      padding: '20px',
      fontFamily: 'var(--font-sans)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #cbd5e1',
        overflow: 'hidden'
      }}>
        {/* Header Header */}
        <div style={{
          background: '#15803d',
          padding: '24px 20px',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <Store size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {shopSettings.shopName || "Grace Super Shop"}
          </h2>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0', opacity: 0.9 }}>
            Point of Sale & Billing Terminal
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            marginTop: '10px',
            fontWeight: 600
          }}>
            <ShieldCheck size={13} />
            <span>Staff Authentication Required</span>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '28px 24px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#b91c1c',
              fontSize: '12.5px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* User ID */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px'
              }}>
                User ID / Cashier Username
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0 12px',
                transition: 'border-color 0.15s'
              }}>
                <User size={16} color="#64748b" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. admin or lipi"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '11px 10px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0 12px'
              }}>
                <Key size={16} color="#64748b" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '11px 10px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                background: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#166534'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#15803d'}
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In to POS System'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#64748b',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>1-CLICK DEMO CREDENTIALS:</span>
              <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 600 }}>Click to test</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                style={{
                  padding: '9px 10px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: '#92400e' }}>
                  <span>👑 Admin (Full Access)</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#b45309', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  ID: admin | pass: admin123
                </div>
              </button>

              {/* Seller / Cashier Button */}
              <button
                type="button"
                onClick={() => handleQuickFill('lipi', 'seller123')}
                style={{
                  padding: '9px 10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 800, color: '#15803d' }}>
                  <span>👤 Seller (Lipi - Sell Only)</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  ID: lipi | pass: seller123
                </div>
              </button>
            </div>
          </div>

          {/* Database Notice */}
          <div style={{
            marginTop: '20px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '11.5px',
            color: '#64748b',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              <Database size={13} color="#15803d" />
              <span>Database-Managed Roles & Permissions</span>
            </div>
            <p style={{ margin: 0 }}>
              To add new cashiers or sellers, insert them directly into the database table <code>public.users</code> with <code>role = 'seller'</code> or <code>'admin'</code>. Public sign-up is disabled for supermarket security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
