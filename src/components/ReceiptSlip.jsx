import React, { useEffect, useRef } from 'react';
import { Printer, X, CheckCircle, Share2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function ReceiptSlip({ receipt, onClose, shopSettings }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && receipt?.invoiceNo) {
      try {
        JsBarcode(barcodeRef.current, receipt.invoiceNo, {
          format: "CODE128",
          width: 1.4,
          height: 38,
          displayValue: false,
          margin: 0
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [receipt]);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textReceipt = `
=========================================
           ${shopSettings?.shopName || "Grace Super Shop"}
       ${shopSettings?.address || "Amtola Mirpur, Dhaka-1216"}
          CELL # ${shopSettings?.cell || "01310191458"}
        Vat Reg No # ${shopSettings?.vatRegNo || "001092713"}
-----------------------------------------
Date : ${receipt.date}       Shop Id  : ${receipt.shopId || "ZAVI"}
Time : ${receipt.time}       Served By: ${receipt.servedBy || "lipi"}
Invoice : ${receipt.invoiceNo}
Customer ID   : ${receipt.customerId || "N/A"}
Customer Name : ${receipt.customerName || "Walk-in"}
-----------------------------------------
Items                       Qty    Price    Total
-----------------------------------------
${receipt.items.map(it => `${it.name} (${it.brand || 'General'})\n${it.barcode.padEnd(20)} ${Number(it.qty).toFixed(2).padStart(6)} ${Number(it.price).toFixed(0).padStart(7)} ${Number(it.total).toFixed(2).padStart(8)}`).join('\n')}
-----------------------------------------
Total Tk                   ${Number(receipt.totalItemsQty).toFixed(2).padStart(6)}         ${Number(receipt.subtotal).toFixed(2)}
Discount:                                  ${Number(receipt.discount || 0).toFixed(2)}
Vat:                                       ${Number(receipt.vat || 0).toFixed(2)}
Net Amount:                                ${Number(receipt.netAmount).toFixed(2)}
Pay Type:                                  ${receipt.payType}
Paid amount:                               ${Number(receipt.paidAmount || receipt.netAmount).toFixed(2)}
Change amount:                             ${Number(receipt.changeAmount || 0).toFixed(2)}
-----------------------------------------
Point This Invoice:                        ${Number(receipt.pointsThisInvoice || 0).toFixed(2)}
Previous Point Balance:                    ${Number(receipt.previousPointBalance || 0).toFixed(2)}
Redem Point:                               ${Number(receipt.redeemPoint || 0).toFixed(2)}
-----------------------------------------
${shopSettings?.footerExchangeNote || "# Item purchased can be exchaged within 72 hours with receipt."}
${shopSettings?.footerRefundNote || "# product cannot be refunded for cash."}
       ${shopSettings?.footerGreeting || "Thank you for shoping at Grace Super Shop"}
${shopSettings?.systemProvider || "System by: Mediasoft Data Systems ltd. 02-5501404"}
=========================================
    `.trim();

    navigator.clipboard.writeText(textReceipt);
    alert("Receipt text copied to clipboard!");
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        maxWidth: '440px',
        width: '100%',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#059669" />
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
              Transaction Slip & Thermal Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Thermal Paper Replica */}
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          background: '#f1f5f9'
        }}>
          <div className="thermal-receipt thermal-receipt-printable">
            {/* Store Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 2px 0', letterSpacing: '0.2px', textTransform: 'capitalize' }}>
                {shopSettings?.shopName || "Grace Super Shop"}
              </h2>
              <div style={{ fontSize: '11px', margin: '1px 0' }}>
                {shopSettings?.address || "Amtola Mirpur, Dhaka-1216"}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>
                CELL # {shopSettings?.cell || "01310191458"}
              </div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                Vat Reg No # {shopSettings?.vatRegNo || "001092713"}
              </div>
            </div>

            {/* Receipt Meta */}
            <div style={{ fontSize: '10.5px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date : {receipt.date}</span>
                <span>Shop Id &nbsp;: {receipt.shopId || "ZAVI"}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Time : {receipt.time}</span>
                <span>Served By: {receipt.servedBy || "lipi"}</span>
              </div>
              <div style={{ marginTop: '2px', fontWeight: 700 }}>
                Invoice : {receipt.invoiceNo}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                <span>Customer ID &nbsp;: {receipt.customerId || ""}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Customer Name : {receipt.customerName || ""}</span>
              </div>
            </div>

            <div className="receipt-divider" />

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #6b7280', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '3px', fontWeight: 700, width: '45%' }}>Items</th>
                  <th style={{ paddingBottom: '3px', fontWeight: 700, textAlign: 'center' }}>Qty</th>
                  <th style={{ paddingBottom: '3px', fontWeight: 700, textAlign: 'right' }}>Price</th>
                  <th style={{ paddingBottom: '3px', fontWeight: 700, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td colSpan="4" style={{ paddingTop: '4px', fontWeight: 700, wordBreak: 'break-word', lineHeight: 1.2 }}>
                        {item.name} {item.discountBadge && <span style={{ fontSize: '9px', color: '#dc2626' }}>({item.discountBadge})</span>}
                      </td>
                    </tr>
                    <tr style={{ paddingBottom: '3px' }}>
                      <td style={{ color: '#4b5563', fontSize: '10px' }}>
                        {item.barcode}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {Number(item.qty).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {Number(item.price).toFixed(0)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="receipt-divider" />

            {/* Calculations & Totals */}
            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total Tk</span>
                <span style={{ display: 'flex', gap: '28px' }}>
                  <span>{Number(receipt.totalItemsQty).toFixed(2)}</span>
                  <span>{Number(receipt.subtotal).toFixed(2)}</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount:</span>
                <span style={{ color: Number(receipt.discount || 0) > 0 ? '#dc2626' : 'inherit', fontWeight: 700 }}>
                  {Number(receipt.discount || 0).toFixed(0)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Vat:</span>
                <span>{Number(receipt.vat || 0).toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '12px', marginTop: '2px' }}>
                <span>Net Amount</span>
                <span>{Number(receipt.netAmount).toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                <span>Pay Type:</span>
                <span style={{ fontWeight: 800 }}>{receipt.payType}</span>
              </div>

              {receipt.trxId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span>Trx ID:</span>
                  <span>{receipt.trxId}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Paid amount:</span>
                <span>{Number(receipt.paidAmount || receipt.netAmount).toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Change amount:</span>
                <span>{Number(receipt.changeAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Loyalty Points Section */}
            <div style={{
              margin: '8px 0',
              padding: '4px 6px',
              border: '1px solid #9ca3af',
              fontSize: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Point This Invoice:</span>
                <span>{Number(receipt.pointsThisInvoice || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Previous Point Balance:</span>
                <span>{Number(receipt.previousPointBalance || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Redem Point:</span>
                <span>{Number(receipt.redeemPoint || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Policies & Greetings */}
            <div style={{ fontSize: '9.5px', marginTop: '8px', lineHeight: 1.3 }}>
              <div>{shopSettings?.footerExchangeNote || "# Item purchased can be exchaged within 72 hours with receipt."}</div>
              <div>{shopSettings?.footerRefundNote || "# product cannot be refunded for cash."}</div>
            </div>

            <div style={{
              textAlign: 'center',
              border: '1px solid #111827',
              padding: '3px 4px',
              margin: '8px 0 6px 0',
              fontWeight: 800,
              fontSize: '10.5px'
            }}>
              {shopSettings?.footerGreeting || "Thank you for shoping at Grace Super Shop"}
            </div>

            <div style={{ textAlign: 'center', fontSize: '9.5px', color: '#374151' }}>
              {shopSettings?.systemProvider || "System by : Mediasoft Data Systems ltd. 02-5501404"}
            </div>

            {/* Barcode representation */}
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <svg ref={barcodeRef} style={{ maxWidth: '100%' }}></svg>
              <div style={{ fontSize: '9px', letterSpacing: '2px', marginTop: '2px' }}>
                *{receipt.invoiceNo}*
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="no-print" style={{
          padding: '12px 18px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleCopyText}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Share2 size={15} />
            <span>Copy Text</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#059669',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Printer size={15} />
            <span>Print Thermal Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
