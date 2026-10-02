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
  LogOut,
  Shield,
  User,
  ExternalLink
} from 'lucide-react';

export default function Navbar({ onOpenAddProduct }) {
  const { 
    viewMode,
    activeTab, 
    setActiveTab, 
    openStoreWindow,
    openPosWindow,
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

  // Global hotkeys depending on view mode
  useEffect(() => {
    const handleKeys = (e) => {
      if (viewMode === 'store') {
        if (e.key === 'F1') {
          e.preventDefault();
          setActiveTab('products');
        } else if (e.key === 'F2' && isAdmin) {
          e.preventDefault();
          setActiveTab('settings');
        } else if (e.key === 'F3' && isAdmin) {
          e.preventDefault();
          setActiveTab('architecture');
        }
      } else {
        // POS billing counter mode
        if (e.key === 'F1') {
          e.preventDefault();
          setActiveTab('pos');
        } else if (e.key === 'F2') {
          e.preventDefault();
          setActiveTab('sales');
        }
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [viewMode, isAdmin, setActiveTab]);

  // Determine navigation items depending on whether this is the POS Billing page or Store page
  const navItems = viewMode === 'store'
    ? [
        { id: 'products', label: 'Products Catalog [F1]', icon: Package, roles: ['admin', 'seller'] },
        { id: 'settings', label: 'Store Settings [F2]', icon: Settings, roles: ['admin'] },
        { id: 'architecture', label: 'Tech & Architecture [F3]', icon: BookOpen, roles: ['admin'] },
      ]
    : [
        { id: 'pos', label: 'POS Terminal [F1]', icon: ShoppingCart, badge: totalCartCount > 0 ? totalCartCount : null, roles: ['admin', 'seller'] },
        { id: 'sales', label: 'Sales Slips [F2]', icon: Receipt, roles: ['admin', 'seller'] },
      ];

  const visibleNavItems = navItems.filter(item => 
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
          background: viewMode === 'store'
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: viewMode === 'store'
            ? '0 2px 8px rgba(37, 99, 235, 0.25)'
            : '0 2px 8px rgba(5, 150, 105, 0.25)'
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

            <span style={{
              background: viewMode === 'store' ? '#eff6ff' : '#ecfdf5',
              color: viewMode === 'store' ? '#1d4ed8' : '#047857',
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              border: `1px solid ${viewMode === 'store' ? '#bfdbfe' : '#a7f3d0'}`
            }}>
              {viewMode === 'store' ? '🏬 Store Management' : '💳 POS Billing'}
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

      {/* Navigation tabs & Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  color: isActive ? (viewMode === 'store' ? '#1d4ed8' : '#059669') : '#475569',
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

        {/* Action Button: In POS mode show "Visit Store ↗"; In Store mode show "POS Terminal ↗" */}
        {viewMode === 'pos' ? (
          <button
            onClick={openStoreWindow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid #10b981',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            title="Open Store Management (Products Catalog & Settings) in a new tab"
          >
            <Store size={15} />
            <span>Visit Store</span>
            <ExternalLink size={13} style={{ opacity: 0.9 }} />
          </button>
        ) : (
          <button
            onClick={openPosWindow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: '1px solid #0284c7',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            title="Open POS Terminal Billing Counter in a new tab"
          >
            <ShoppingCart size={15} />
            <span>POS Terminal</span>
            <ExternalLink size={13} style={{ opacity: 0.9 }} />
          </button>
        )}
      </div>

      {/* Right meta controls: User Info, Online Status, Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* User Identity badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '6px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontSize: '11.5px',
          color: '#334155'
        }}>
          {isAdmin ? <Shield size={13} color="#2563eb" /> : <User size={13} color="#059669" />}
          <span style={{ fontWeight: 600 }}>{currentUser?.name?.split(' ')[0] || 'Staff'}</span>
          <span style={{ 
            fontSize: '9.5px', 
            fontWeight: 800, 
            padding: '1px 5px', 
            borderRadius: '4px',
            background: isAdmin ? '#dbeafe' : '#dcfce7',
            color: isAdmin ? '#1e40af' : '#15803d',
            textTransform: 'uppercase'
          }}>
            {currentUser?.role || 'seller'}
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
