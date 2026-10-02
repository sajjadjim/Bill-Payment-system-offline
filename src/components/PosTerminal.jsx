import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getProductPricing } from '../utils/pricing';
import { supabase } from '../lib/supabaseClient';
import { 
  Barcode, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  X, 
  Printer, 
  Package, 
  Phone, 
  User, 
  Award,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  ShoppingBag
} from 'lucide-react';

export default function PosTerminal() {
  const { 
    products, 
    cart, 
    addToCart, 
    addManualItemToCart, 
    updateCartQty, 
    removeFromCart, 
    clearCart, 
    heldInvoices, 
    holdInvoice, 
    recallInvoice, 
    reprintLastInvoice, 
    cartDiscount, 
    completeTransaction, 
    findProductByBarcodeOrSerial, 
    shopSettings, 
    currentUser, 
    setActiveTab, 
    getCustomerPointsInfo,
    selectedReceipt
  } = useApp();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [dbSuggestions, setDbSuggestions] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedTender, setSelectedTender] = useState('Cash');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [pointsRedeemed, setPointsRedeemed] = useState(0); // number of points to redeem
  const [scanFeedback, setScanFeedback] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Manual Quick Add Modal
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', brand: 'General', price: '', qty: '1', barcode: '' });

  // Unknown Barcode Modal
  const [unknownBarcodePrompt, setUnknownBarcodePrompt] = useState(null);

  // "Bag Koi" Modal State (Always default to 'No')
  const [isBagModalOpen, setIsBagModalOpen] = useState(false);
  const [bagChoice, setBagChoice] = useState('No');
  const isBagModalOpenRef = useRef(false);
  isBagModalOpenRef.current = isBagModalOpen;
  const handlePrintBillRef = useRef(null);
  const phoneModalInputRef = useRef(null);

  // Search dropdown suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);

  const barcodeInputRef = useRef(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Customer Loyalty Points Live Lookup (100 Tk = 1 Pt, 3 months validity, 100 Pts = 75 Tk)
  const customerLoyalty = useMemo(() => {
    return getCustomerPointsInfo(customerPhone);
  }, [customerPhone, getCustomerPointsInfo]);

  // Update customer name automatically if registered customer found
  useEffect(() => {
    if (customerLoyalty.found && customerLoyalty.customerName) {
      setCustomerName(customerLoyalty.customerName);
    }
  }, [customerLoyalty.found, customerLoyalty.customerName]);

  // References to keep event listeners stable without re-attaching on every keystroke
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const selectedRowIndexRef = useRef(selectedRowIndex);
  selectedRowIndexRef.current = selectedRowIndex;

  // 1. Focus barcode input ONLY ONCE on initial mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // 2. Global POS keyboard shortcuts listener
  useEffect(() => {
    const handlePosHotkeys = (e) => {
      // If "Bag Koi" modal is currently open, let modal handle Enter/Escape
      if (isBagModalOpenRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsBagModalOpen(false);
        }
        return;
      }

      // If user is actively typing in an input (such as Mobile # or manual add), NEVER steal focus or interfere!
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        if (e.key === 'F2') {
          e.preventDefault();
          setActiveTab('products');
        } else if (e.key === 'F10') {
          e.preventDefault();
          handlePrintBillRef.current?.();
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('products');
        return;
      }
      if (e.key === 'F1') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        handleHoldCurrentInvoice();
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        handleVoidInvoice();
        return;
      }
      if (e.key === 'F10') {
        e.preventDefault();
        handlePrintBillRef.current?.();
        return;
      }

      // If user types while NOT inside any input, focus the barcode scanner
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeInputRef.current?.focus();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.min(cartRef.current.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const curCart = cartRef.current;
        const curIdx = selectedRowIndexRef.current;
        if (curCart[curIdx]) {
          updateCartQty(curCart[curIdx].product.id, curCart[curIdx].qty + 1);
        }
      } else if (e.key === '-') {
        e.preventDefault();
        const curCart = cartRef.current;
        const curIdx = selectedRowIndexRef.current;
        if (curCart[curIdx]) {
          updateCartQty(curCart[curIdx].product.id, Math.max(1, curCart[curIdx].qty - 1));
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        const curCart = cartRef.current;
        const curIdx = selectedRowIndexRef.current;
        if (curCart[curIdx]) {
          removeFromCart(curCart[curIdx].product.id);
        }
      }
    };

    window.addEventListener('keydown', handlePosHotkeys);
    return () => window.removeEventListener('keydown', handlePosHotkeys);
  }, [setActiveTab, updateCartQty, removeFromCart]);

  // Audio beeper
  const playScannerBeep = (freq = 1250) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {}
  };

  // Real-time Supabase Database barcode search
  useEffect(() => {
    const q = barcodeInput.trim();
    if (!q || q.length < 1) {
      setDbSuggestions([]);
      setIsSearchingDb(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      if (!navigator.onLine) return;
      try {
        setIsSearchingDb(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`barcode.ilike.%${q}%,name.ilike.%${q}%,brand.ilike.%${q}%,sku.ilike.%${q}%`)
          .limit(8);

        if (isMounted && !error && data) {
          const mapped = data.map((item, idx) => ({
            id: item.id,
            slNo: item.sl_no || idx + 1,
            sku: item.sku || `PRD-${item.id}`,
            barcode: item.barcode,
            name: item.name,
            brand: item.brand || 'General',
            category: item.category || 'General Grocery',
            description: item.description || '',
            price: Number(item.price),
            costPrice: Number(item.cost_price || 0),
            stock: Number(item.stock || 0),
            unit: item.unit || 'pcs',
            discount: item.discount || { type: 'percent', value: 0 },
            image: item.image
          }));
          setDbSuggestions(mapped);
        }
      } catch (err) {
        console.warn("DB search error:", err);
      } finally {
        if (isMounted) setIsSearchingDb(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [barcodeInput]);

  // Search suggestions: searches local products + Supabase database system
  const suggestions = useMemo(() => {
    const q = barcodeInput.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const localMatches = products.filter(p => 
      p.barcode?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      (p.brand && p.brand?.toLowerCase().includes(q)) ||
      (p.sku && p.sku?.toLowerCase().includes(q)) ||
      String(p.slNo) === q
    );

    // Merge database results, preventing duplicates
    const combined = [...localMatches];
    dbSuggestions.forEach(dbItem => {
      if (!combined.some(c => c.id === dbItem.id || c.barcode === dbItem.barcode)) {
        combined.push(dbItem);
      }
    });

    return combined.slice(0, 8);
  }, [barcodeInput, products, dbSuggestions]);

  // Barcode / Code submit (queries local + database system asynchronously)
  const handleBarcodeSubmit = async (e) => {
    e?.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    setShowSuggestions(false);
    const matched = await findProductByBarcodeOrSerial(query);

    if (matched) {
      addToCart(matched, 1);
      playScannerBeep(1350);
      setScanFeedback({ type: 'success', message: `Added [${matched.barcode}] ${matched.name}` });
      setBarcodeInput('');
      setSelectedRowIndex(cart.length);
    } else {
      playScannerBeep(450);
      setUnknownBarcodePrompt({
        barcode: query,
        name: '',
        brand: 'General',
        price: '',
        qty: '1'
      });
      setScanFeedback({ type: 'error', message: `Unrecognized Barcode: "${query}". Quick-registering...` });
      setBarcodeInput('');
    }

    setTimeout(() => setScanFeedback(null), 3000);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  // Select suggestion
  const handleSelectSuggestion = (product) => {
    addToCart(product, 1);
    playScannerBeep(1350);
    setScanFeedback({ type: 'success', message: `Added [${product.barcode}] ${product.name}` });
    setBarcodeInput('');
    setShowSuggestions(false);
    barcodeInputRef.current?.focus();
  };

  // Unknown barcode save
  const handleSaveUnknownBarcode = (e) => {
    e.preventDefault();
    if (!unknownBarcodePrompt.name.trim() || !unknownBarcodePrompt.price) {
      alert("Please enter Item Name and Price.");
      return;
    }

    addManualItemToCart({
      name: unknownBarcodePrompt.name,
      brand: unknownBarcodePrompt.brand || 'General',
      price: unknownBarcodePrompt.price,
      qty: unknownBarcodePrompt.qty || 1,
      barcode: unknownBarcodePrompt.barcode
    });

    playScannerBeep(1400);
    setScanFeedback({ type: 'success', message: `Registered & Added: ${unknownBarcodePrompt.name}` });
    setUnknownBarcodePrompt(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  // Billing calculations
  let mrpTotal = 0;
  let discountedSubtotal = 0;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  cart.forEach(item => {
    const pricing = getProductPricing(item.product);
    mrpTotal += pricing.originalPrice * item.qty;
    discountedSubtotal += pricing.finalPrice * item.qty;
  });

  const productLevelSavings = Math.max(0, mrpTotal - discountedSubtotal);

  // Points Discount: 100 points = 75 Taka discount (0.75 Tk per point)
  const pointsDiscountValue = Math.min(
    discountedSubtotal,
    Math.round(pointsRedeemed * 0.75 * 100) / 100
  );

  const totalDiscount = productLevelSavings + pointsDiscountValue;
  const sdAmount = 0.00;
  const grandTotal = Math.max(0, discountedSubtotal - pointsDiscountValue + sdAmount);

  // Cash receive & change
  const payableAmount = grandTotal;
  const cashReceived = Number(cashReceivedInput) || 0;
  const changeDue = cashReceived > 0 ? Math.max(0, cashReceived - payableAmount) : 0;

  // Selected item
  const selectedCartItem = cart[selectedRowIndex] || cart[0] || null;

  // Toggle Redeem Points
  const handleToggleRedeemPoints = () => {
    if (pointsRedeemed > 0) {
      setPointsRedeemed(0);
    } else {
      if (customerLoyalty.validPoints < 100) {
        alert(`Customer has ${customerLoyalty.validPoints} points. At least 100 points are needed to redeem 75 Taka discount.`);
        return;
      }
      // Redeem in blocks of 100 points or full eligible points
      const eligibleBlocks = Math.floor(customerLoyalty.validPoints / 100);
      const pointsToUse = eligibleBlocks * 100;
      setPointsRedeemed(pointsToUse);
      playScannerBeep(1500);
      setScanFeedback({
        type: 'success',
        message: `🎁 Redeemed ${pointsToUse} Points for Tk ${(pointsToUse * 0.75).toFixed(2)} Discount!`
      });
      setTimeout(() => setScanFeedback(null), 3000);
    }
  };

  // HOLD CURRENT INVOICE (Supports up to 5 Multiple Customer Bills)
  const handleHoldCurrentInvoice = () => {
    if (cart.length === 0) {
      alert("Current invoice is empty. Nothing to hold.");
      return;
    }
    if (heldInvoices.length >= 5) {
      alert("Maximum 5 Recall Invoices reached! Please finish or void an existing held customer bill first.");
      return;
    }

    const holdResult = holdInvoice({
      customerPhone,
      customerName
    });

    if (holdResult) {
      playScannerBeep(1100);
      setCustomerPhone('');
      setCustomerName('Walk-in Customer');
      setPointsRedeemed(0);
      setCashReceivedInput('');
      setScanFeedback({
        type: 'success',
        message: `Saved to ${holdResult.title} (Slot ${holdResult.slot}/5)! Counter cleared for next customer.`
      });
      setTimeout(() => setScanFeedback(null), 3500);
      barcodeInputRef.current?.focus();
    }
  };

  // RECALL HELD INVOICE
  const handleRecallSlot = (slotNumber) => {
    if (cart.length > 0) {
      const confirmSwitch = window.confirm(
        "Current customer has active items on screen. Do you want to hold the current bill before recalling this customer?"
      );
      if (confirmSwitch) {
        handleHoldCurrentInvoice();
      }
    }

    const recalled = recallInvoice(slotNumber);
    if (recalled) {
      playScannerBeep(1300);
      if (recalled.customerPhone) setCustomerPhone(recalled.customerPhone);
      if (recalled.customerName) setCustomerName(recalled.customerName);
      setScanFeedback({
        type: 'success',
        message: `Recalled ${recalled.title} (${recalled.customerName || 'Customer'})! Ready to add more items.`
      });
      setTimeout(() => setScanFeedback(null), 3000);
      barcodeInputRef.current?.focus();
    }
  };

  // VOID INVOICE
  const handleVoidInvoice = () => {
    if (cart.length === 0) return;
    if (window.confirm("VOID INVOICE: Are you sure you want to cancel and clear all items in this bill?")) {
      clearCart();
      setCashReceivedInput('');
      setPointsRedeemed(0);
      playScannerBeep(500);
      setScanFeedback({ type: 'error', message: 'Invoice Voided / Cleared.' });
      setTimeout(() => setScanFeedback(null), 3000);
    }
  };

  // PRINT / PAY BILL - Prompts for "Bag Koi" (Yes / No)
  const handlePrintBill = () => {
    if (cart.length === 0) {
      alert("No items in bill to print. Scan or enter items first.");
      return;
    }

    // Always default to 'No' per user requirement
    setBagChoice('No');
    setIsBagModalOpen(true);
  };
  handlePrintBillRef.current = handlePrintBill;

  // Final confirmation of Bag selection and completing transaction
  const handleConfirmBagAndPrint = () => {
    const cleanPhone = (customerPhone || '').trim();
    if (!cleanPhone || cleanPhone.length < 6) {
      alert("⚠️ Customer Phone Number is REQUIRED!\n\nPlease enter the customer's phone number before completing bill payment and printing the receipt slip.");
      if (phoneModalInputRef.current) {
        phoneModalInputRef.current.focus();
      }
      return;
    }

    const isBagYes = bagChoice === 'Yes';
    const bagPrice = isBagYes ? 20 : 0;
    const finalPayable = payableAmount + bagPrice;

    completeTransaction({
      payType: selectedTender.toUpperCase(),
      paidAmount: cashReceived > 0 ? cashReceived : finalPayable,
      note: `Paid via ${selectedTender}`,
      customerPhone: cleanPhone,
      customerName: customerName || (customerLoyalty.found ? customerLoyalty.name : 'Customer'),
      redeemedPoints: pointsRedeemed,
      pointsDiscount: pointsDiscountValue,
      includeBag: isBagYes,
      bagFee: 20,
      trxId: selectedTender !== 'Cash' ? `TRX-${Math.floor(100000 + Math.random() * 900000)}` : undefined
    });

    playScannerBeep(1600);
    setCashReceivedInput('');
    setPointsRedeemed(0);
    setIsBagModalOpen(false);
  };

  // Formatted date string
  const formattedDate = useMemo(() => {
    const day = String(currentTime.getDate()).padStart(2, '0');
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const year = currentTime.getFullYear();
    const weekday = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    return `${day}/${month}/${year} [${weekday}]`;
  }, [currentTime]);

  const tenderMethods = [
    { id: 'eCom Cash', label: 'eCom Cash' },
    { id: 'eCom Online', label: 'eCom Online' },
    { id: 'MTB Card', label: 'MTB Card' },
    { id: 'MTB QR', label: 'MTB QR' },
    { id: 'Nagad', label: 'Nagad' },
    { id: 'bKash', label: 'bKash' },
    { id: 'PBL', label: 'PBL' },
    { id: 'UCBL', label: 'UCBL' },
    { id: 'Cash', label: 'Cash' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 65px)',
      background: '#dcdfe4',
      fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      color: '#1a1f2c',
      userSelect: 'none',
      overflow: 'hidden'
    }}>

      {/* ========================================================================= */}
      {/* 1. TOP WINDOW BAR (Shwapno Super Shop Header) */}
      {/* ========================================================================= */}
      <div style={{
        background: '#e6e8eb',
        borderBottom: '2px solid #b8bcc4',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px', // Increased font size for visibility
        fontWeight: 600,
        boxShadow: 'inset 0 1px 0 #ffffff'
      }}>
        {/* Left: Red stylized Swapno Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#d32f2f',
            color: '#ffffff',
            padding: '3px 12px',
            borderRadius: '3px',
            fontWeight: 900,
            fontSize: '17px', // High visibility
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
          }}>
            <span>স্বপ্ন</span>
            <span style={{ fontSize: '13px' }}>🏃</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#1e293b' }}>
            <span><strong>Outlet :</strong> {shopSettings.outletName || "F641-Poschim Agargaon Outlet"}</span>
            <span style={{ borderLeft: '1.5px solid #94a3b8', paddingLeft: '12px' }}>
              <strong>User :</strong> <span style={{ color: '#15803d', fontWeight: 800 }}>{currentUser?.userId || shopSettings.servedBy || "L61627"}</span>
            </span>
            <span style={{ borderLeft: '1.5px solid #94a3b8', paddingLeft: '12px' }}>
              <strong>Version :</strong> <span style={{ color: '#15803d' }}>{shopSettings.softwareVersion || "2.0.1"}</span>
            </span>
          </div>
        </div>

        {/* Right Info: Terminal, Last Invoice, Date, Products Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span><strong>Terminal :</strong> {shopSettings.terminalId || "F641POS1N"}</span>
          <span style={{ borderLeft: '1.5px solid #94a3b8', paddingLeft: '12px' }}>
            <strong>Last Invoice # :</strong> <span style={{ color: '#15803d', fontFamily: 'monospace', fontWeight: 800, fontSize: '13.5px' }}>{shopSettings.lastInvoiceNo || "F6412610010083"}</span>
          </span>
          <span style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            padding: '2px 10px',
            borderRadius: '4px',
            fontWeight: 800,
            color: '#15803d',
            fontFamily: 'monospace',
            fontSize: '13px'
          }}>
            {formattedDate}
          </span>

          {/* Quick-Switch to Products page */}
          <button
            onClick={() => setActiveTab('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Open Products Catalog [F2]"
          >
            <Package size={14} />
            <span>Products [F2]</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-HEADER INPUT BAR: Barcode (Yellow Box), Customer, Mobile # Loyalty Points */}
      {/* ========================================================================= */}
      <div style={{
        background: '#eff2f5',
        borderBottom: '2px solid #b8bcc4',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        
        {/* Left: Yellow Barcode / Item Code Box (High-Visibility Font) */}
        <div style={{ flex: '1.2', minWidth: '320px', position: 'relative' }}>
          <form onSubmit={handleBarcodeSubmit} style={{ width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                background: '#15803d',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                padding: '7px 10px',
                borderRadius: '3px 0 0 3px',
                whiteSpace: 'nowrap',
                border: '1px solid #15803d',
                borderRight: 'none'
              }}>
                Item Code/Barcode
              </div>

              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Scan or type Barcode / Code (2603029, 2704597, 2817974)..."
                style={{
                  flex: 1,
                  background: '#fffde7', // High visibility yellow
                  border: '2px solid #fbc02d',
                  borderRadius: '0 3px 3px 0',
                  padding: '6px 10px',
                  fontSize: '15px', // High visibility font
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#000000',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }}
              />

              <button
                type="submit"
                style={{
                  marginLeft: '6px',
                  background: '#15803d',
                  color: '#ffffff',
                  border: '1px solid #166534',
                  padding: '6px 12px',
                  borderRadius: '3px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Enter ↵
              </button>
            </div>

            {/* Autocomplete Dropdown - Real-time Barcode Search from Database */}
            {showSuggestions && barcodeInput.trim().length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#ffffff',
                border: '1.5px solid #15803d',
                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                borderRadius: '0 0 6px 6px',
                maxHeight: '320px',
                overflowY: 'auto'
              }}>
                {suggestions.length > 0 ? (
                  suggestions.map((p) => {
                    const pricing = getProductPricing(p);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectSuggestion(p)}
                        style={{
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          fontSize: '13.5px',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {p.image && (
                            <img
                              src={p.image}
                              alt=""
                              style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                            />
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                              {p.brand && (
                                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '1px 6px', borderRadius: '3px', border: '1px solid #bbf7d0' }}>
                                  {p.brand}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                              Barcode: <span style={{ color: '#15803d', fontWeight: 700 }}>{p.barcode}</span>
                              {p.sku && <span> | SKU: {p.sku}</span>}
                              {p.stock !== undefined && <span style={{ color: p.stock > 0 ? '#15803d' : '#dc2626' }}> | Stock: {p.stock}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace', fontSize: '15px' }}>
                            Tk {pricing.finalPrice.toFixed(2)}
                          </div>
                          {pricing.hasDiscount && (
                            <span style={{ fontSize: '11px', color: '#dc2626', textDecoration: 'line-through' }}>
                              Tk {pricing.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                    {isSearchingDb ? (
                      <span style={{ color: '#15803d', fontWeight: 700 }}>🔍 Searching database system for "{barcodeInput}"...</span>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>No product found in database for "{barcodeInput}"</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>Press <kbd style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', border: '1px solid #cbd5e1' }}>Enter ↵</kbd> to quick-register as a new item.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Center: Mandatory Customer Mobile # & Real-Time Loyalty Points */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Customer Mobile # Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: (!customerPhone || customerPhone.trim().length < 6) ? '1.5px solid #dc2626' : '1.5px solid #15803d',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <span style={{
              background: (!customerPhone || customerPhone.trim().length < 6) ? '#dc2626' : '#15803d',
              color: '#ffffff',
              padding: '6px 10px',
              fontWeight: 800,
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}>
              Customer Phone *
            </span>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              title="Customer phone is mandatory for bill payment & receipt printing"
              style={{
                border: 'none',
                padding: '6px 10px',
                fontSize: '14px',
                fontWeight: 800,
                outline: 'none',
                width: '135px',
                fontFamily: 'monospace',
                color: customerLoyalty.found ? '#166534' : '#0f172a'
              }}
            />
          </div>

          {/* Points Display (Live from database, valid within 3 months) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: customerLoyalty.validPoints > 0 ? '#f0fdf4' : '#ffffff',
            border: `1.5px solid ${customerLoyalty.validPoints > 0 ? '#15803d' : '#cbd5e1'}`,
            borderRadius: '3px'
          }}>
            <span style={{ background: '#15803d', color: '#ffffff', padding: '5px 8px', fontWeight: 800, fontSize: '12px' }}>
              Points
            </span>
            <span style={{
              padding: '5px 10px',
              fontWeight: 900,
              fontFamily: 'monospace',
              fontSize: '14px',
              minWidth: '40px',
              textAlign: 'center',
              color: customerLoyalty.validPoints > 0 ? '#15803d' : '#0f172a'
            }}>
              {customerLoyalty.validPoints}
            </span>
          </div>

          {/* Amount (Discount value of points: 100 pts = 75 Tk) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: customerLoyalty.discountTaka > 0 ? '#f0fdf4' : '#ffffff',
            border: `1.5px solid ${customerLoyalty.discountTaka > 0 ? '#15803d' : '#cbd5e1'}`,
            borderRadius: '3px'
          }}>
            <span style={{ background: '#15803d', color: '#ffffff', padding: '5px 8px', fontWeight: 800, fontSize: '12px' }}>
              Amount
            </span>
            <span style={{
              padding: '5px 10px',
              fontWeight: 900,
              fontFamily: 'monospace',
              fontSize: '14px',
              minWidth: '55px',
              textAlign: 'center',
              color: customerLoyalty.discountTaka > 0 ? '#15803d' : '#0f172a'
            }}>
              {customerLoyalty.discountTaka.toFixed(1)}
            </span>
          </div>

          {/* Redeem Button (if customer has >= 100 points) */}
          {customerLoyalty.validPoints >= 100 && (
            <button
              onClick={handleToggleRedeemPoints}
              style={{
                background: pointsRedeemed > 0 ? '#dc2626' : '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              title="100 Points = 75 Taka discount product value (Valid 3 months)"
            >
              <Award size={13} />
              <span>{pointsRedeemed > 0 ? `Cancel (Tk ${pointsDiscountValue})` : `Redeem (75 Tk)`}</span>
            </button>
          )}
        </div>

        {/* Right: Item Count Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>No. of Items :</span>
          <div style={{
            background: '#000000',
            color: '#ffeb3b', // Bright yellow as in physical terminal
            padding: '4px 14px',
            fontWeight: 900,
            fontSize: '18px', // High visibility
            fontFamily: 'monospace',
            borderRadius: '3px',
            border: '1.5px solid #333333',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}>
            {totalItemsCount}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2B. MULTI-CUSTOMER RECALL INVOICES SLOTS BAR (Max 5 Multiple Bills) */}
      {/* ========================================================================= */}
      <div style={{
        background: '#e2e8f0',
        borderBottom: '1.5px solid #cbd5e1',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12.5px',
        fontWeight: 700
      }}>
        {/* Held Invoices Slots (Slot 1 to Slot 5) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1e293b', fontWeight: 800 }}>
            <Layers size={15} color="#15803d" />
            <span>Multiple Customer Hold / Recall ({heldInvoices.length}/5):</span>
          </div>

          {[1, 2, 3, 4, 5].map(slotNum => {
            const heldSlot = heldInvoices.find(h => h.slot === slotNum);
            return (
              <button
                key={slotNum}
                onClick={() => heldSlot && handleRecallSlot(slotNum)}
                style={{
                  background: heldSlot ? '#fef3c7' : '#f8fafc',
                  border: heldSlot ? '1.5px solid #d97706' : '1px dashed #94a3b8',
                  color: heldSlot ? '#92400e' : '#64748b',
                  padding: '3px 10px',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: heldSlot ? 800 : 600,
                  cursor: heldSlot ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                title={heldSlot ? `Recall ${heldSlot.title}: ${heldSlot.itemsCount} items (Tk ${heldSlot.total.toFixed(2)})` : `Slot ${slotNum} Empty`}
              >
                <span>Slot {slotNum}</span>
                {heldSlot && (
                  <span style={{
                    background: '#d97706',
                    color: '#ffffff',
                    padding: '1px 5px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: 900
                  }}>
                    {heldSlot.itemsCount} items (Tk {heldSlot.total.toFixed(0)})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hold & Recall Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleHoldCurrentInvoice}
            style={{
              background: '#e0e0e0',
              border: '1.5px solid #757575',
              padding: '4px 10px',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              color: '#212121'
            }}
            title="Hold current customer invoice into next slot (Max 5) [F4]"
          >
            + Hold Current Bill [F4]
          </button>

          {heldInvoices.length > 0 && (
            <button
              onClick={() => handleRecallSlot(heldInvoices[0].slot)}
              style={{
                background: '#15803d',
                border: '1px solid #166534',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Recall next waiting customer bill"
            >
              Recall Next Waiting Bill ↵
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {scanFeedback && (
        <div style={{
          padding: '5px 14px',
          background: scanFeedback.type === 'success' ? '#c8e6c9' : '#ffcdd2',
          color: scanFeedback.type === 'success' ? '#1b5e20' : '#b71c1c',
          fontSize: '12.5px',
          fontWeight: 800,
          borderBottom: '1px solid #a5d6a7',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {scanFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{scanFeedback.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN BILLING WORKSPACE: High-Visibility Table & Summary */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: Main POS Table & Bottom Detail Grid */}
        {/* ----------------------------------------------------------------------- */}
        <div style={{
          flex: '1 1 72%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '2px solid #b8bcc4',
          background: '#ffffff',
          overflow: 'hidden'
        }}>
          
          {/* Main Items Data Grid Table (Larger font sizes) */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14.5px' // High visibility font
            }}>
              <thead>
                <tr style={{
                  background: '#f1f3f6',
                  borderBottom: '1.5px solid #b0bec5',
                  color: '#263238',
                  fontSize: '13px',
                  fontWeight: 800,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  <th style={{ width: '46px', padding: '8px 4px', textAlign: 'center', borderRight: '1px solid #cfd8dc' }}>#</th>
                  <th style={{ width: '145px', padding: '8px 10px', textAlign: 'left', borderRight: '1px solid #cfd8dc' }}>Code</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', borderRight: '1px solid #cfd8dc' }}>Description</th>
                  <th style={{ width: '135px', padding: '8px 14px', textAlign: 'right', borderRight: '1px solid #cfd8dc' }}>Unit Price</th>
                  <th style={{ width: '135px', padding: '8px 14px', textAlign: 'right', borderRight: '1px solid #cfd8dc' }}>Quantity</th>
                  <th style={{ width: '70px', padding: '8px 4px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '80px 20px', textAlign: 'center', color: '#90a4ae' }}>
                      <div style={{ fontSize: '36px', marginBottom: '10px' }}>🛒</div>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#455a64' }}>Invoice is currently empty</div>
                      <div style={{ fontSize: '13px', marginTop: '6px', color: '#64748b' }}>
                        Scan product barcode with scanner, or type item code above (e.g. 2603029, 2704597)
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const isSelected = selectedRowIndex === idx;
                    const pricing = getProductPricing(item.product);

                    return (
                      <tr
                        key={item.product.id || idx}
                        onClick={() => setSelectedRowIndex(idx)}
                        style={{
                          background: isSelected ? '#e3f2fd' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                          borderBottom: '1px solid #e0e0e0',
                          cursor: 'pointer',
                          transition: 'background 0.1s ease'
                        }}
                      >
                        {/* 1. Row Index */}
                        <td style={{
                          padding: '9px 4px',
                          textAlign: 'center',
                          fontWeight: 800,
                          color: '#546e7a',
                          borderRight: '1px solid #e0e0e0',
                          fontFamily: 'monospace',
                          fontSize: '15px'
                        }}>
                          {idx + 1}
                        </td>

                        {/* 2. Code (High Visibility Monospace) */}
                        <td style={{
                          padding: '9px 10px',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '16px',
                          color: '#0d47a1',
                          borderRight: '1px solid #e0e0e0'
                        }}>
                          {item.product.barcode || item.product.sku || item.product.slNo}
                        </td>

                        {/* 3. Description */}
                        <td style={{
                          padding: '9px 14px',
                          fontWeight: 700,
                          color: '#0f172a',
                          borderRight: '1px solid #e0e0e0',
                          fontSize: '14.5px'
                        }}>
                          <div>{item.product.name}</div>
                          {pricing.badge && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '11px',
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              fontWeight: 800,
                              marginTop: '3px'
                            }}>
                              {pricing.badge}
                            </span>
                          )}
                        </td>

                        {/* 4. Unit Price (Soft-mint green background as in photo) */}
                        <td style={{
                          padding: '9px 14px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '16.5px', // High visibility
                          color: '#000000',
                          background: '#c8e6c9',
                          borderRight: '1.5px solid #a5d6a7'
                        }}>
                          {pricing.finalPrice.toFixed(2)}
                        </td>

                        {/* 5. Quantity (Soft-mint green background as in photo) */}
                        <td style={{
                          padding: '9px 14px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '16.5px', // High visibility
                          color: '#000000',
                          background: '#c8e6c9',
                          borderRight: '1.5px solid #a5d6a7'
                        }}>
                          {item.qty.toFixed(3)}
                        </td>

                        {/* 6. Quick in-line controls */}
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQty(item.product.id, item.qty + 1);
                              }}
                              style={{
                                background: '#e0e0e0',
                                border: '1px solid #bdbdbd',
                                borderRadius: '3px',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontWeight: 900,
                                fontSize: '13px'
                              }}
                              title="Increase Quantity"
                            >
                              +
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.qty > 1) {
                                  updateCartQty(item.product.id, item.qty - 1);
                                } else {
                                  removeFromCart(item.product.id);
                                }
                              }}
                              style={{
                                background: '#e0e0e0',
                                border: '1px solid #bdbdbd',
                                borderRadius: '3px',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontWeight: 900,
                                fontSize: '13px'
                              }}
                              title="Decrease Quantity"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item.product.id);
                              }}
                              style={{
                                background: '#ffebee',
                                border: '1px solid #ffcdd2',
                                color: '#c62828',
                                borderRadius: '3px',
                                width: '22px',
                                height: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="Remove Item"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Promotional Strip */}
          <div style={{
            background: '#eef1f5',
            borderTop: '2px solid #b8bcc4',
            padding: '6px 12px',
            fontSize: '12.5px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#455a64' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cfd8dc', fontWeight: 800, fontSize: '11px', textAlign: 'left' }}>
                  <th style={{ padding: '3px 6px' }}>Item Code</th>
                  <th style={{ padding: '3px 6px' }}>Description</th>
                  <th style={{ padding: '3px 6px' }}>FREE Qty</th>
                  <th style={{ padding: '3px 6px' }}>Qty</th>
                  <th style={{ padding: '3px 6px' }}>Margin</th>
                  <th style={{ padding: '3px 6px' }}>Agent</th>
                  <th style={{ padding: '3px 6px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px' }}>
                  <td style={{ padding: '4px 6px', color: '#0d47a1' }}>
                    {selectedCartItem ? selectedCartItem.product.barcode : '---'}
                  </td>
                  <td style={{ padding: '4px 6px', color: '#1a1f2c' }}>
                    {selectedCartItem ? selectedCartItem.product.name : 'Select item above'}
                  </td>
                  <td style={{ padding: '4px 6px' }}>0.000</td>
                  <td style={{ padding: '4px 6px' }}>
                    {selectedCartItem ? selectedCartItem.qty.toFixed(3) : '0.000'}
                  </td>
                  <td style={{ padding: '4px 6px' }}>Retail</td>
                  <td style={{ padding: '4px 6px' }}>General</td>
                  <td style={{ padding: '4px 6px', color: '#2e7d32' }}>Active</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Keyboard Hotkeys Strip */}
          <div style={{
            background: '#37474f',
            color: '#cfd8dc',
            padding: '5px 12px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'monospace'
          }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <span><strong style={{ color: '#ffeb3b' }}>[F1]</strong> Scan Item</span>
              <span><strong style={{ color: '#ffeb3b' }}>[F2]</strong> Products Page</span>
              <span><strong style={{ color: '#ffeb3b' }}>[F4]</strong> Hold Bill</span>
              <span><strong style={{ color: '#ffeb3b' }}>[F8]</strong> Void Bill</span>
              <span><strong style={{ color: '#ffeb3b' }}>[F10 / Enter]</strong> Print & Settle</span>
            </div>
            <button
              onClick={() => setIsManualAddOpen(true)}
              style={{
                background: '#455a64',
                color: '#ffffff',
                border: '1px solid #607d8b',
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + Manual Item
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: MRP Totals, Tender Matrix & Print Action Buttons */}
        {/* ----------------------------------------------------------------------- */}
        <div style={{
          flex: '0 0 28%',
          maxWidth: '350px',
          minWidth: '290px',
          display: 'flex',
          flexDirection: 'column',
          background: '#dcdfe4',
          borderLeft: '1px solid #ffffff',
          overflow: 'hidden'
        }}>

          {/* 1. TOP SUMMARY BLOCK */}
          <div style={{
            background: '#e0e0e0',
            borderBottom: '2px solid #b8bcc4',
            padding: '10px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14.5px', fontWeight: 700 }}>
              <span style={{ color: '#37474f' }}>MRP Total :</span>
              <span style={{ fontFamily: 'monospace', fontSize: '15.5px', fontWeight: 900 }}>{mrpTotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13.5px' }}>
              <span style={{ color: '#546e7a' }}>(+) SD :</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{sdAmount.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13.5px' }}>
              <span style={{ color: '#546e7a' }}>(-) Discount :</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: totalDiscount > 0 ? '#c62828' : '#546e7a' }}>
                {totalDiscount.toFixed(2)}
              </span>
            </div>

            {/* Points discount note if applied */}
            {pointsRedeemed > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#15803d', fontWeight: 800 }}>
                <span>🎁 Points Discount ({pointsRedeemed} pts) :</span>
                <span style={{ fontFamily: 'monospace' }}>-Tk {pointsDiscountValue.toFixed(2)}</span>
              </div>
            )}

            {/* GRAND TOTAL: Solid Black High-Contrast Banner with Large White Digits */}
            <div style={{
              background: '#000000',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
              marginTop: '6px'
            }}>
              <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '0.5px' }}>TOTAL :</span>
              <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'monospace' }}>
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 2. TENDER DETAILS TABLE (Larger font sizes) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              background: '#ffffff',
              border: '1.5px solid #b0bec5'
            }}>
              <thead>
                <tr style={{ background: '#cfd8dc', color: '#263238', fontWeight: 800, borderBottom: '1.5px solid #b0bec5' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #b0bec5' }}>Tender Details</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {tenderMethods.map((m) => {
                  const isSelected = selectedTender === m.id;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedTender(m.id)}
                      style={{
                        background: isSelected ? '#bbdefb' : '#ffffff',
                        borderBottom: '1px solid #eceff1',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{
                        padding: '5px 8px',
                        borderRight: '1px solid #eceff1',
                        fontWeight: isSelected ? 900 : 600,
                        color: isSelected ? '#0d47a1' : '#37474f'
                      }}>
                        {m.label}
                      </td>
                      <td style={{
                        padding: '5px 8px',
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '13.5px'
                      }}>
                        {isSelected ? payableAmount.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  );
                })}

                {/* Round Off */}
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eceff1' }}>
                  <td style={{ padding: '5px 8px', borderRight: '1px solid #eceff1', fontWeight: 600 }}>Round Off</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>0.00</td>
                </tr>

                {/* Payable Amount */}
                <tr style={{ background: '#f5f5f5', borderBottom: '1.5px solid #cfd8dc' }}>
                  <td style={{ padding: '6px 8px', borderRight: '1.5px solid #cfd8dc', fontWeight: 900 }}>Payable Amount</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#0d47a1', fontSize: '15px' }}>
                    {payableAmount.toFixed(2)}
                  </td>
                </tr>

                {/* Cash Receive Input */}
                <tr style={{ background: '#fffde7', borderBottom: '1.5px solid #cfd8dc' }}>
                  <td style={{ padding: '6px 8px', borderRight: '1.5px solid #cfd8dc', fontWeight: 900, color: '#f57f17' }}>
                    Cash Receive
                  </td>
                  <td style={{ padding: '3px 6px', textAlign: 'right' }}>
                    <input
                      type="number"
                      value={cashReceivedInput}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      placeholder={payableAmount.toFixed(2)}
                      style={{
                        width: '95px',
                        textAlign: 'right',
                        background: '#ffffff',
                        border: '1.5px solid #fbc02d',
                        padding: '3px 6px',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '14.5px',
                        outline: 'none'
                      }}
                    />
                  </td>
                </tr>

                {/* Change Due */}
                <tr style={{ background: '#e8f5e9' }}>
                  <td style={{ padding: '6px 8px', borderRight: '1.5px solid #cfd8dc', fontWeight: 900, color: '#2e7d32' }}>
                    Change Due
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#2e7d32', fontSize: '15px' }}>
                    {changeDue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Quick Cash Buttons */}
            <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
              {[100, 200, 500, 1000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setCashReceivedInput(String(amt))}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid #b0bec5',
                    borderRadius: '3px',
                    padding: '4px 0',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    color: '#37474f'
                  }}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* 3. BOTTOM ACTION BUTTONS (PRINT, Reprint, VOID, Products) */}
          <div style={{
            background: '#e0e0e0',
            borderTop: '2px solid #b8bcc4',
            padding: '10px'
          }}>
            {/* Primary PRINT Button */}
            <button
              onClick={handlePrintBill}
              style={{
                width: '100%',
                background: '#37474f',
                color: '#ffffff',
                border: '1px solid #263238',
                padding: '11px 14px',
                borderRadius: '3px',
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '1px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
              }}
              title="Print Receipt & Settle Bill [F10 or Enter]"
            >
              <Printer size={18} />
              <span>PRINT [F10]</span>
            </button>

            {/* Reprint Buttons Row */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <button
                onClick={reprintLastInvoice}
                style={{
                  flex: 2,
                  background: '#f5f5f5',
                  border: '1.5px solid #9e9e9e',
                  padding: '6px 8px',
                  borderRadius: '3px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  color: '#212121'
                }}
              >
                Reprint Last Invoice
              </button>
              <button
                onClick={reprintLastInvoice}
                style={{
                  flex: 1,
                  background: '#f5f5f5',
                  border: '1.5px solid #9e9e9e',
                  padding: '6px 8px',
                  borderRadius: '3px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  color: '#212121'
                }}
              >
                Reprint
              </button>
            </div>

            {/* VOID & Products Buttons Row */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleVoidInvoice}
                style={{
                  flex: 1,
                  background: '#ffebee',
                  border: '1.5px solid #ef5350',
                  color: '#c62828',
                  padding: '7px',
                  borderRadius: '3px',
                  fontSize: '12.5px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
                title="Cancel & Clear Invoice [F8]"
              >
                VOID [F8]
              </button>

              <button
                onClick={() => setActiveTab('products')}
                style={{
                  flex: 1.3,
                  background: '#15803d',
                  border: '1.5px solid #166534',
                  color: '#ffffff',
                  padding: '7px',
                  borderRadius: '3px',
                  fontSize: '12.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
                title="Open Products Catalog [F2]"
              >
                <Package size={14} />
                <span>Products [F2]</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS: Manual Item Add & Unknown Scanned Barcode */}
      {/* ========================================================================= */}
      {isManualAddOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '6px',
            width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#37474f',
              color: '#ffffff',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 800,
              fontSize: '14px'
            }}>
              <span>+ Quick Add Manual Item</span>
              <button
                onClick={() => setIsManualAddOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!manualForm.name || !manualForm.price) return;
              addManualItemToCart({
                name: manualForm.name,
                brand: manualForm.brand || 'General',
                price: manualForm.price,
                qty: manualForm.qty || 1,
                barcode: manualForm.barcode
              });
              setIsManualAddOpen(false);
              setManualForm({ name: '', brand: 'General', price: '', qty: '1', barcode: '' });
            }} style={{ padding: '18px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>Item Name *</label>
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="e.g. Lollipop Strawberry"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>Price (Tk) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualForm.price}
                    onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                    placeholder="15.00"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={manualForm.qty}
                    onChange={(e) => setManualForm({ ...manualForm, qty: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', fontSize: '13px', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#15803d', color: '#ffffff', fontWeight: 800, fontSize: '13px' }}
                >
                  Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unknown Scanned Barcode Registration Modal */}
      {unknownBarcodePrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '6px',
            width: '420px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#b71c1c',
              color: '#ffffff',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 800,
              fontSize: '14px'
            }}>
              <span>⚠️ Unrecognized Barcode Detected</span>
              <button
                onClick={() => setUnknownBarcodePrompt(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnknownBarcode} style={{ padding: '18px' }}>
              <div style={{ background: '#fffde7', padding: '10px', borderRadius: '4px', marginBottom: '14px', border: '1px solid #fff59d' }}>
                <div style={{ fontSize: '12px', color: '#f57f17', fontWeight: 800 }}>Scanned Code:</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '16px', color: '#000000' }}>
                  {unknownBarcodePrompt.barcode}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>Item Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={unknownBarcodePrompt.name}
                  onChange={(e) => setUnknownBarcodePrompt({ ...unknownBarcodePrompt, name: e.target.value })}
                  placeholder="Enter product title..."
                  style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>Price (Tk) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unknownBarcodePrompt.price}
                    onChange={(e) => setUnknownBarcodePrompt({ ...unknownBarcodePrompt, price: e.target.value })}
                    placeholder="e.g. 50.00"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={unknownBarcodePrompt.qty}
                    onChange={(e) => setUnknownBarcodePrompt({ ...unknownBarcodePrompt, qty: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '14px', border: '1.5px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setUnknownBarcodePrompt(null)}
                  style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', fontSize: '13px', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#15803d', color: '#ffffff', fontWeight: 800, fontSize: '13px' }}
                >
                  Save & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "Bag Koi" Modal - Always defaults to "No", adds 20 Tk if "Yes" */}
      {isBagModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBagModalOpen(false);
          }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            width: '440px',
            maxWidth: '95vw',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '2px solid #15803d',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#15803d',
              color: '#ffffff',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={22} />
                <span style={{ fontWeight: 900, fontSize: '17px', letterSpacing: '0.3px' }}>
                  Bag Koi? (ব্যাগ লাগবে কি?)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBagModalOpen(false)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#ffffff', 
                  cursor: 'pointer', 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmBagAndPrint();
              }} 
              style={{ padding: '20px' }}
            >
              {/* Mandatory Customer Mobile Phone for Bill Payment */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a' }}>
                    Customer Phone Number <span style={{ color: '#dc2626' }}>* (আবশ্যক)</span>:
                  </label>
                  {customerPhone && customerPhone.trim().length >= 6 ? (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                      ✓ Verified Phone
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                      Required for Bill
                    </span>
                  )}
                </div>
                
                <input
                  ref={phoneModalInputRef}
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01xxxxxxxxx (e.g. 01711223344)"
                  autoFocus={!customerPhone}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    fontSize: '16px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    borderRadius: '6px',
                    border: (!customerPhone || customerPhone.trim().length < 6) ? '2px solid #dc2626' : '2px solid #15803d',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {(!customerPhone || customerPhone.trim().length < 6) ? (
                  <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 800, marginTop: '5px' }}>
                    ⚠️ Customer phone is mandatory to proceed with bill payment & store transaction.
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: 700, marginTop: '5px' }}>
                    ✓ Loyalty Points Account: {customerLoyalty.found ? `${customerLoyalty.validPoints} valid points available` : 'New customer (Points will be credited)'}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                  Bag Koi (ব্যাগ নির্বাচন করুন):
                </label>
                
                {/* Select Dropdown (Default is always 'No') */}
                <select
                  value={bagChoice}
                  onChange={(e) => setBagChoice(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '16px',
                    fontWeight: 800,
                    borderRadius: '6px',
                    border: '2px solid #15803d',
                    background: '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="No">No (ব্যাগ নেই / ৳ ০.০০)</option>
                  <option value="Yes">Yes (ব্যাগ লাগবে / +৳ ২০.০০)</option>
                </select>
              </div>

              {/* Quick Click Option Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setBagChoice('No')}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    border: bagChoice === 'No' ? '2px solid #15803d' : '1.5px solid #cbd5e1',
                    background: bagChoice === 'No' ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 900, color: bagChoice === 'No' ? '#15803d' : '#64748b' }}>
                    No (না)
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                    Default (৳ 0)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBagChoice('Yes')}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    border: bagChoice === 'Yes' ? '2px solid #15803d' : '1.5px solid #cbd5e1',
                    background: bagChoice === 'Yes' ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 900, color: bagChoice === 'Yes' ? '#15803d' : '#64748b' }}>
                    Yes (হ্যাঁ)
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
                    +৳ 20 Bag Fee
                  </div>
                </button>
              </div>

              {/* Breakdown Box */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px',
                border: '1px solid #e2e8f0',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', borderTop: 'none', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
                  <span>Items Subtotal:</span>
                  <span style={{ fontWeight: 700 }}>৳ {payableAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: bagChoice === 'Yes' ? '#15803d' : '#64748b', marginBottom: '6px' }}>
                  <span>Bag Charge (ব্যাগ মূল্য):</span>
                  <span style={{ fontWeight: 800 }}>{bagChoice === 'Yes' ? '+৳ 20.00' : '৳ 0.00'}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: '6px',
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#0f172a'
                }}>
                  <span>Final Bill Total:</span>
                  <span style={{ color: '#15803d', fontSize: '17px' }}>
                    ৳ {(payableAmount + (bagChoice === 'Yes' ? 20 : 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBagModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#15803d',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Printer size={18} />
                  <span>Print Receipt [Enter]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
