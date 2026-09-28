import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, Store, User, Receipt, Check, RefreshCw } from 'lucide-react';
import { DEFAULT_SHOP_SETTINGS } from '../data/defaultProducts';

export default function ShopSettings() {
  const { shopSettings, setShopSettings } = useApp();
  const [form, setForm] = useState(shopSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShopSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset store header and invoice information back to Grace Super Shop defaults?")) {
      setForm(DEFAULT_SHOP_SETTINGS);
      setShopSettings(DEFAULT_SHOP_SETTINGS);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={22} color="#059669" />
            <span>Store Profile & Receipt Configurations</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Configure store name, tax VAT registration, contact phone, and thermal slip text
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#475569',
            padding: '7px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {savedSuccess && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} />
          <span>Store settings saved successfully! All newly printed slips will use these details.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        {/* Section 1: Store Identity */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={17} color="#059669" />
            <span>Store Header (Printed on Top of Receipt Slip)</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Shop Name
              </label>
              <input
                type="text"
                required
                value={form.shopName}
                onChange={(e) => setForm(prev => ({ ...prev, shopName: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Branch / Shop ID
              </label>
              <input
                type="text"
                required
                value={form.shopId}
                onChange={(e) => setForm(prev => ({ ...prev, shopId: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Store Address
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Cell / Mobile Number
              </label>
              <input
                type="text"
                required
                value={form.cell}
                onChange={(e) => setForm(prev => ({ ...prev, cell: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                VAT Reg No #
              </label>
              <input
                type="text"
                value={form.vatRegNo}
                onChange={(e) => setForm(prev => ({ ...prev, vatRegNo: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Cashier & Tax */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={17} color="#2563eb" />
            <span>Active Cashier & Tax Settings</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Served By (Cashier Name on Slip)
              </label>
              <input
                type="text"
                required
                value={form.servedBy}
                onChange={(e) => setForm(prev => ({ ...prev, servedBy: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                VAT % (Set 0 if VAT exempt or included)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.vatPercentage}
                onChange={(e) => setForm(prev => ({ ...prev, vatPercentage: Number(e.target.value) }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Receipt Footer Terms */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={17} color="#d97706" />
            <span>Receipt Footer Policies & Greeting</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Exchange Policy Note
              </label>
              <input
                type="text"
                value={form.footerExchangeNote}
                onChange={(e) => setForm(prev => ({ ...prev, footerExchangeNote: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#0f172a',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Refund Policy Note
              </label>
              <input
                type="text"
                value={form.footerRefundNote}
                onChange={(e) => setForm(prev => ({ ...prev, footerRefundNote: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#0f172a',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Greeting Message
              </label>
              <input
                type="text"
                value={form.footerGreeting}
                onChange={(e) => setForm(prev => ({ ...prev, footerGreeting: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#0f172a',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                System Provider Signature
              </label>
              <input
                type="text"
                value={form.systemProvider}
                onChange={(e) => setForm(prev => ({ ...prev, systemProvider: e.target.value }))}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#0f172a',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Save size={16} />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
