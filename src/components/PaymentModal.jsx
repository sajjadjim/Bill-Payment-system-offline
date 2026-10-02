import React, { useState } from 'react';
import { 
  X, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Percent, 
  Check, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  cartDiscount,
  setCartDiscount,
  onProcessPayment,
  shopSettings
}) {
  if (!isOpen) return null;

  const [selectedMethod, setSelectedMethod] = useState('CASH'); // CASH | BKASH | ROCKET | NAGAD | VISA
  const [cashGiven, setCashGiven] = useState('');
  const [trxId, setTrxId] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [discountType, setDiscountType] = useState(cartDiscount.type || 'flat');
  const [discountVal, setDiscountVal] = useState(cartDiscount.value || 0);

  // Calculate discount and net payable
  let appliedDiscount = 0;
  if (discountType === 'percent') {
    appliedDiscount = (totalAmount * Number(discountVal || 0)) / 100;
  } else {
    appliedDiscount = Number(discountVal || 0);
  }
  appliedDiscount = Math.min(appliedDiscount, totalAmount);

  const netPayable = Math.max(0, Math.round((totalAmount - appliedDiscount) * 100) / 100);
  const paidNumber = selectedMethod === 'CASH' 
    ? (Number(cashGiven) || netPayable) 
    : netPayable;
  const changeDue = Math.max(0, paidNumber - netPayable);

  const paymentMethods = [
    {
      id: 'CASH',
      name: 'Cash Payment',
      subtitle: 'Taka notes & change',
      icon: Banknote,
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0'
    },
    {
      id: 'BKASH',
      name: 'bKash Merchant',
      subtitle: 'MFS Send / Payment',
      icon: Smartphone,
      color: '#e2136e',
      bg: '#fdf2f8',
      border: '#fbcfe8'
    },
    {
      id: 'ROCKET',
      name: 'Rocket (DBBL)',
      subtitle: 'Dutch-Bangla MFS',
      icon: Smartphone,
      color: '#8c3494',
      bg: '#faf5ff',
      border: '#e9d5ff'
    },
    {
      id: 'NAGAD',
      name: 'Nagad Postal MFS',
      subtitle: 'Fast QR & Trx',
      icon: Smartphone,
      color: '#ea580c',
      bg: '#fff7ed',
      border: '#fed7aa'
    },
    {
      id: 'VISA',
      name: 'Visa / Mastercard',
      subtitle: 'POS Card Machine',
      icon: CreditCard,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe'
    }
  ];

  const quickCashAmounts = [100, 200, 500, 1000, 2000];

  const handleConfirm = () => {
    // Update active discount in context
    setCartDiscount({ type: discountType, value: Number(discountVal || 0) });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch {}

    onProcessPayment({
      payType: selectedMethod,
      paidAmount: paidNumber,
      trxId: trxId.trim(),
      cardLast4: cardLast4.trim()
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 900,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        maxWidth: '540px',
        width: '100%',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Finalize Payment & Checkout
            </h2>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Select payment method & print receipt slip
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Bill Summary Banner */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Gross Total Amount</div>
              <div style={{ fontSize: '14px', color: '#334155', fontWeight: 700 }}>
                Tk {totalAmount.toFixed(2)}
              </div>
            </div>
            {appliedDiscount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#e11d48' }}>Discount</div>
                <div style={{ fontSize: '13px', color: '#e11d48', fontWeight: 800 }}>
                  - Tk {appliedDiscount.toFixed(2)}
                </div>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>Net Payable</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                Tk {netPayable.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div style={{
            background: '#ffffff',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '12.5px', fontWeight: 600 }}>
              <Percent size={14} color="#15803d" />
              <span>Discount:</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setDiscountType('flat')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: discountType === 'flat' ? '#15803d' : '#f1f5f9',
                  color: discountType === 'flat' ? '#ffffff' : '#475569'
                }}
              >
                Flat Tk
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: discountType === 'percent' ? '#15803d' : '#f1f5f9',
                  color: discountType === 'percent' ? '#ffffff' : '#475569'
                }}
              >
                Percent %
              </button>
            </div>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={discountVal || ''}
              onChange={(e) => setDiscountVal(e.target.value)}
              style={{
                width: '85px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 8px',
                color: '#0f172a',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700
              }}
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
              Payment Channel
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              {paymentMethods.map(method => {
                const isSelected = selectedMethod === method.id;
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? method.color : '#e2e8f0'}`,
                      background: isSelected ? method.bg : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      background: method.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={16} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                        {method.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {method.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic details for chosen payment method */}
          {selectedMethod === 'CASH' && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#334155', fontWeight: 700 }}>
                    Cash Received from Customer (Tk)
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Exact: {netPayable.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  placeholder={`e.g. 1000`}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1.5px solid #15803d',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#0f172a',
                    fontSize: '18px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              {/* Quick bill clickers */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>Quick Bills:</span>
                {quickCashAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashGiven(String(amt))}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#15803d',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Tk {amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashGiven(String(netPayable))}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Exact Bill
                </button>
              </div>

              {/* Change Calculation Box */}
              <div style={{
                background: '#ffffff',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px dashed #15803d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Return to Customer</span>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Change Amount</div>
                </div>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: changeDue >= 0 ? '#15803d' : '#dc2626',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Tk {changeDue.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {(selectedMethod === 'BKASH' || selectedMethod === 'ROCKET' || selectedMethod === 'NAGAD') && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={17} color="#15803d" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedMethod} Merchant Payment
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                Ask customer to Scan Merchant QR Code or Send Tk {netPayable.toFixed(2)} to Merchant Wallet:
                <strong style={{ color: '#0f172a', marginLeft: '6px' }}>{shopSettings.cell || '01310191458'}</strong>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Transaction ID (TrxID) / Sender Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9B7X289410 or 017xxxxxxxx"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    color: '#0f172a',
                    fontSize: '12.5px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          )}

          {selectedMethod === 'VISA' && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                POS Card Terminal Transaction
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Card Last 4 Digits & Approval Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4022 (Appr: 91823)"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    color: '#0f172a',
                    fontSize: '12.5px',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer / Submit */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#64748b',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#15803d',
              border: 'none',
              color: '#ffffff',
              padding: '9px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Complete & Print Receipt</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
