import React from 'react';
import { 
  Database, 
  Wifi, 
  Laptop, 
  Zap, 
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function ArchitectureGuide() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Hero Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '16px', fontSize: '11.5px', fontWeight: 800, marginBottom: '12px' }}>
          <Zap size={14} />
          <span>PRODUCTION POS ARCHITECTURE</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Best Tech Stack & Architecture for Online + Offline Super Shop POS
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, maxWidth: '850px', margin: 0 }}>
          This blueprint explains the best programming languages, offline/online databases, and desktop frameworks to give you 
          0-second checkout lag, barcode reader hardware compatibility, and seamless automatic product updates across MacBooks, Windows, and laptops.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* Pillar 1: Languages */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f0fdf4', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} color="#15803d" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                1. Best Programming Languages
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Cross-Platform UI & Hardware</span>
            </div>
          </div>

          <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
            <p><strong>Primary Choice: JavaScript / TypeScript with React & Vite</strong></p>
            <ul style={{ paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <li><strong>Universal:</strong> Runs on <strong>MacBook, Windows Laptop, Desktop PC, and Touch POS</strong> without rewriting code.</li>
              <li><strong>Zero-lag Barcode Scanning:</strong> Processes hardware laser barcode reader inputs in &lt;1ms.</li>
              <li><strong>Desktop Packaging:</strong> Can be bundled with <strong>Tauri (Rust) or Electron</strong> to create native desktop apps.</li>
            </ul>
          </div>
        </div>

        {/* Pillar 2: Databases */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f0fdf4', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="#15803d" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                2. Best Databases (Offline + Online)
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Dual-Tier Data Sync</span>
            </div>
          </div>

          <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
            <p><strong>Local Offline DB: SQLite or IndexedDB (Dexie.js)</strong></p>
            <ul style={{ paddingLeft: '18px', marginTop: '4px', marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>When internet drops, sales, barcode scans, and printing continue with <strong>zero interruption</strong>.</li>
            </ul>

            <p><strong>Central Cloud DB: PostgreSQL (e.g. Supabase) or MongoDB</strong></p>
            <ul style={{ paddingLeft: '18px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>Central catalog: Update product price once on your laptop or phone, and all cashier counters sync automatically!</li>
            </ul>
          </div>
        </div>

        {/* Pillar 3: Sync Engine */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fffbeb', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={18} color="#d97706" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                3. Automated Time-to-Time Sync
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Background Cloud Sync Engine</span>
            </div>
          </div>

          <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
            <p><strong>Two-Way Synchronization:</strong></p>
            <ul style={{ paddingLeft: '18px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <li><strong>Cloud-to-Local (Pull):</strong> Background fetch pulls new products and updated prices from server.</li>
              <li><strong>Local-to-Cloud (Push):</strong> Completed sales slips are saved locally and pushed to the cloud server as soon as internet is available.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hardware Setup Section */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '22px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Laptop size={18} color="#15803d" />
          <span>Hardware & Peripherals Setup</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#15803d', display: 'block', marginBottom: '4px', fontSize: '13px' }}>1. Barcode Scanners</strong>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Any USB or Bluetooth handheld barcode reader operates as a keyboard HID. When you scan a product barcode, it automatically feeds into the active invoice and adds the item instantly.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#15803d', display: 'block', marginBottom: '4px', fontSize: '13px' }}>2. Thermal Slip Printers</strong>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Supports standard 58mm & 80mm thermal receipt printers via USB or LAN, rendering the Grace Super Shop receipt layout.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#e2136e', display: 'block', marginBottom: '4px', fontSize: '13px' }}>3. Multi-Channel Payments</strong>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Full support for Cash with instant change return calculation, plus bKash Merchant, Rocket, Nagad, and Visa/Mastercard card terminals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
