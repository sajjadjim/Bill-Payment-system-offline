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

  // Navigation items: Grocery store themed
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
      padding: '9px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand & Store Identity - Clean Supermarket Green */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          background: '#15803d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <Store size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ 
              fontSize: '16px', 
              fontWeight: 800, 
              color: '#0f172a',
              margin: 0
            }}>
              {shopSettings.shopName || "Super Shop"}
            </h1>
            <span style={{
              background: '#f1f5f9',
              color: '#475569',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              border: '1px solid #cbd5e1'
            }}>
              ID: {shopSettings.shopId || "ZAVI"}
            </span>

            <span style={{
              background: '#f0fdf4',
              color: '#15803d',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: '10px',
              border: '1px solid #bbf7d0'
            }}>
              {viewMode === 'store' ? '🏬 Store Management' : '💳 POS Terminal'}
            </span>
          </div>
          <p style={{ 
            fontSize: '11px', 
            color: '#64748b', 
            margin: '1px 0 0 0',
            maxWidth: '240px',
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
        <nav style={{ display: 'flex', gap: '3px', background: '#f1f5f9', padding: '3px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
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
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#15803d' : '#475569',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background: '#15803d',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '8px'
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
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '5px',
              border: 'none',
              background: '#15803d',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#166534'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#15803d'}
            title="Open Store Management (Products Catalog & Settings) in a new tab"
          >
            <Store size={14} />
            <span>Visit Store</span>
            <ExternalLink size={12} style={{ opacity: 0.9 }} />
          </button>
        ) : (
          <button
            onClick={openPosWindow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '5px',
              border: 'none',
              background: '#15803d',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#166534'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#15803d'}
            title="Open POS Terminal Billing Counter in a new tab"
          >
            <ShoppingCart size={14} />
            <span>POS Terminal</span>
            <ExternalLink size={12} style={{ opacity: 0.9 }} />
          </button>
        )}
      </div>

      {/* Right meta controls: User Info, Online Status, Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* User Identity badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 8px',
          borderRadius: '5px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          fontSize: '11.5px',
          color: '#334155'
        }}>
          <User size={13} color="#15803d" />
          <span style={{ fontWeight: 600 }}>{currentUser?.name?.split(' ')[0] || 'Staff'}</span>
          <span style={{ 
            fontSize: '9px', 
            fontWeight: 800, 
            padding: '1px 4px', 
            borderRadius: '3px',
            background: '#f1f5f9',
            color: '#15803d',
            textTransform: 'uppercase'
          }}>
            {currentUser?.role || 'seller'}
          </span>
        </div>

        {/* Offline / Online badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 8px',
          borderRadius: '5px',
          background: isOnline ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${isOnline ? '#bbf7d0' : '#fde68a'}`,
          fontSize: '11px',
          fontWeight: 700,
          color: isOnline ? '#15803d' : '#d97706'
        }}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
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
            gap: '4px',
            background: '#ffffff',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '5px 9px',
            borderRadius: '5px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
          title="Sign Out of POS System"
        >
          <LogOut size={12} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
