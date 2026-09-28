import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Receipt, 
  Search, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  Smartphone
} from 'lucide-react';

export default function SalesHistory() {
  const { transactions, setSelectedReceipt } = useApp();
  const [searchInvoice, setSearchInvoice] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  const filteredTransactions = transactions.filter(tx => {
    const matchesPay = paymentFilter === 'ALL' || tx.payType === paymentFilter;
    const q = searchInvoice.toLowerCase().trim();
    const matchesSearch = !q || 
      tx.invoiceNo.toLowerCase().includes(q) || 
      (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
      (tx.trxId && tx.trxId.toLowerCase().includes(q));
    return matchesPay && matchesSearch;
  });

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.netAmount, 0);
  const totalItemsSold = transactions.reduce((sum, tx) => sum + tx.totalItemsQty, 0);
  const cashSales = transactions.filter(tx => tx.payType === 'CASH').reduce((sum, tx) => sum + tx.netAmount, 0);
  const mfsSales = transactions.filter(tx => tx.payType !== 'CASH').reduce((sum, tx) => sum + tx.netAmount, 0);

  const getPayTypeBadge = (type) => {
    switch (type) {
      case 'CASH':
        return { color: '#059669', bg: '#ecfdf5', text: 'CASH' };
      case 'BKASH':
        return { color: '#e2136e', bg: '#fdf2f8', text: 'bKash' };
      case 'ROCKET':
        return { color: '#8c3494', bg: '#faf5ff', text: 'Rocket' };
      case 'NAGAD':
        return { color: '#ea580c', bg: '#fff7ed', text: 'Nagad' };
      case 'VISA':
        return { color: '#2563eb', bg: '#eff6ff', text: 'Visa/Card' };
      default:
        return { color: '#475569', bg: '#f1f5f9', text: type };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Receipt size={22} color="#059669" />
          <span>Sales Invoices & Transaction Archive</span>
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          View, audit, and re-print customer receipts matching the physical grocery thermal slip
        </p>
      </div>

      {/* Analytics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Total Revenue</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Tk {totalRevenue.toFixed(2)}
            </div>
          </div>
          <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px' }}>
            <TrendingUp size={20} color="#059669" />
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Total Invoices</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {transactions.length} slips
            </div>
          </div>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
            <Receipt size={20} color="#2563eb" />
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Cash Inflow</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Tk {cashSales.toFixed(2)}
            </div>
          </div>
          <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px' }}>
            <DollarSign size={20} color="#059669" />
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>bKash / Card / MFS</span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#e2136e', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Tk {mfsSales.toFixed(2)}
            </div>
          </div>
          <div style={{ background: '#fdf2f8', padding: '10px', borderRadius: '8px' }}>
            <Smartphone size={20} color="#e2136e" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '11px', top: '9px' }} />
          <input
            type="text"
            placeholder="Search invoice number (e.g. 09282026ZAVI030373), customer..."
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '7px 12px 7px 34px',
              color: '#0f172a',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Channel:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '7px 12px',
              color: '#0f172a',
              fontSize: '12.5px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Payment Types</option>
            <option value="CASH">Cash</option>
            <option value="BKASH">bKash</option>
            <option value="ROCKET">Rocket</option>
            <option value="NAGAD">Nagad</option>
            <option value="VISA">Visa/Card</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11.5px', fontWeight: 700 }}>
                <th style={{ padding: '10px 14px' }}>Invoice #</th>
                <th style={{ padding: '10px 14px' }}>Date & Time</th>
                <th style={{ padding: '10px 14px' }}>Customer / Cashier</th>
                <th style={{ padding: '10px 14px' }}>Items Summary</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Payment Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Net Amount</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No sales invoices found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const badge = getPayTypeBadge(tx.payType);
                  return (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#2563eb'
                        }}>
                          {tx.invoiceNo}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', color: '#334155' }}>
                        <div>{tx.date}</div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{tx.time}</span>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ color: '#0f172a', fontWeight: 700 }}>
                          {tx.customerName || 'Walk-in'}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          By: {tx.servedBy || 'lipi'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: '280px' }}>
                        <div style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '12px'
                        }}>
                          {tx.items.map(it => `${it.qty}× ${it.name}`).join(', ')}
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {tx.totalItemsQty} items total
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          {badge.text}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                        Tk {Number(tx.netAmount).toFixed(2)}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#059669',
                            border: 'none',
                            color: '#ffffff',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Printer size={13} />
                          <span>Reprint Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
