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

      {/* Main Tab Content */}
      <main className="main-content">
        {activeTab === 'pos' && <PosTerminal />}
        {activeTab === 'products' && (
          <ProductManagement
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
          />
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

