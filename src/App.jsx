import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import PosTerminal from './components/PosTerminal';
import ProductManagement from './components/ProductManagement';
import SalesHistory from './components/SalesHistory';
import ShopSettings from './components/ShopSettings';
import ArchitectureGuide from './components/ArchitectureGuide';
import ReceiptSlip from './components/ReceiptSlip';
import LoginPage from './components/LoginPage';

export default function App() {
  const { 
    currentUser, 
    isAdmin,
    activeTab, 
    setActiveTab, 
    selectedReceipt, 
    setSelectedReceipt, 
    shopSettings 
  } = useApp();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // If no user is logged in, show the secure white Supermarket Staff Login screen
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        onOpenAddProduct={() => {
          if (!isAdmin) {
            alert("Permission Denied: Only Admin can add products.");
            return;
          }
          setActiveTab('products');
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Tab Content with Role-Based Access Control */}
      <main className="main-content">
        {activeTab === 'pos' && <PosTerminal />}
        {activeTab === 'products' && (
          isAdmin ? (
            <ProductManagement
              isAddModalOpen={isAddModalOpen}
              setIsAddModalOpen={setIsAddModalOpen}
            />
          ) : (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '12px',
              margin: '20px',
              border: '1px solid #fee2e2'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b', margin: '0 0 8px 0' }}>
                Access Restricted: Administrator Only
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                As a Seller / Cashier, you have permission to sell, scan barcodes, and process transactions. Product stock modification and catalog editing are reserved for Administrators.
              </p>
              <button
                onClick={() => setActiveTab('pos')}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Return to POS Billing
              </button>
            </div>
          )
        )}
        {activeTab === 'sales' && <SalesHistory />}
        {activeTab === 'settings' && (
          isAdmin ? <ShopSettings /> : <PosTerminal />
        )}
        {activeTab === 'architecture' && (
          isAdmin ? <ArchitectureGuide /> : <PosTerminal />
        )}
      </main>

      {/* Receipt Modal: Replica of the physical thermal slip */}
      {selectedReceipt && (
        <ReceiptSlip
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          shopSettings={shopSettings}
        />
      )}
    </div>
  );
}

