import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import PosTerminal from './components/PosTerminal';
import ProductManagement from './components/ProductManagement';
import SalesHistory from './components/SalesHistory';
import ShopSettings from './components/ShopSettings';
import ArchitectureGuide from './components/ArchitectureGuide';
import ReceiptSlip from './components/ReceiptSlip';

export default function App() {
  const { activeTab, setActiveTab, selectedReceipt, setSelectedReceipt, shopSettings } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        onOpenAddProduct={() => {
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
        {activeTab === 'settings' && <ShopSettings />}
        {activeTab === 'architecture' && <ArchitectureGuide />}
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
