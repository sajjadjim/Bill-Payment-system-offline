import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  Package, 
  Receipt, 
  Settings, 
  BookOpen, 
  Wifi, 
  WifiOff, 
  Store, 
  UserCheck,
  PlusCircle,
  LogOut,
  Shield,
  User
} from 'lucide-react';

export default function Navbar({ onOpenAddProduct }) {
  const { 
    activeTab, 
    setActiveTab, 
    shopSettings, 
    isOnline, 
    cart, 
    currentUser, 
    logoutUser, 
    isAdmin 
  } = useApp();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Role-Based Navigation items: Seller only gets Billing & Sales
  const allNavItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, badge: totalCartCount > 0 ? totalCartCount : null, roles: ['admin', 'seller'] },
    { id: 'products', label: 'Products & Serials', icon: Package, roles: ['admin'] },
    { id: 'sales', label: 'Sales Slips', icon: Receipt, roles: ['admin', 'seller'] },
    { id: 'architecture', label: 'Tech & Architecture', icon: BookOpen, roles: ['admin'] },
    { id: 'settings', label: 'Store Settings', icon: Settings, roles: ['admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item => 
    item.roles.includes(currentUser?.role || 'seller')
  );

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Brand & Store Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
        }}>
          <Store size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ 
              fontSize: '17px', 
              fontWeight: 800, 
              color: '#0f172a',
              margin: 0
            }}>
              {shopSettings.shopName || "Grace Super Shop"}
            </h1>
            <span style={{
              background: '#f1f5f9',
              color: '#475569',
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              border: '1px solid #e2e8f0'
            }}>
              ID: {shopSettings.shopId || "ZAVI"}
            </span>
          </div>
          <p style={{ 
            fontSize: '11px', 
            color: '#64748b', 
            margin: '2px 0 0 0',
            maxWidth: '260px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {shopSettings.address}
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#059669' : '#475569',
                fontWeight: isActive ? 700 : 600,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {item.badge && (
                <span style={{
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right meta controls: Quick Add (Admin Only), User Role Badge, Online Status, Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Only Admin can see + New Product */}
        {isAdmin && (
          <button
            onClick={onOpenAddProduct}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Add New Product to Catalog (Admin Only)"
          >
            <PlusCircle size={15} />
            <span>+ New Product</span>
          </button>
        )}

        {/* Current User Role Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isAdmin ? '#fef3c7' : '#eff6ff',
          border: `1px solid ${isAdmin ? '#fde68a' : '#bfdbfe'}`,
          padding: '6px 11px',
          borderRadius: '6px',
          fontSize: '12px',
          color: isAdmin ? '#92400e' : '#1e40af',
          fontWeight: 700
        }}>
          {isAdmin ? <Shield size={14} color="#d97706" /> : <User size={14} color="#2563eb" />}
          <span>
            {isAdmin ? '👑 Admin: ' : '👤 Seller: '}
            <strong style={{ color: isAdmin ? '#78350f' : '#1e3a8a' }}>
              {currentUser?.name || currentUser?.userId || "Cashier"}
            </strong>
          </span>
        </div>

        {/* Offline / Online badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '6px',
          background: isOnline ? '#ecfdf5' : '#fffbeb',
          border: `1px solid ${isOnline ? '#a7f3d0' : '#fde68a'}`,
          fontSize: '11px',
          fontWeight: 700,
          color: isOnline ? '#059669' : '#d97706'
        }}>
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => {
            if (confirm(`Sign out of ${currentUser?.name || 'POS'}?`)) {
              logoutUser();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: '#ffffff',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
          title="Sign Out of POS System"
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

