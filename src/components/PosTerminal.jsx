import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProductPricing } from '../utils/pricing';
import { 
  Barcode, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CreditCard, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  X,
  Upload,
  Building2,
  Tag,
  Percent
} from 'lucide-react';
import PaymentModal from './PaymentModal';

export default function PosTerminal() {
  const { 
    products, 
    cart, 
    addToCart, 
    addManualItemToCart,
    updateCartQty, 
    removeFromCart, 
    clearCart,
    cartDiscount,
    setCartDiscount,
    completeTransaction,
    findProductByBarcodeOrSerial,
    shopSettings,
    compressProductImage
  } = useApp();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(null);

  // Manual Quick Add Modal
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', brand: 'General', price: '', qty: '1', barcode: '', image: '' });
  const [manualImagePreview, setManualImagePreview] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Unknown Scanned Barcode Modal
  const [unknownBarcodePrompt, setUnknownBarcodePrompt] = useState(null);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();

    const handleGlobalKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  // Extract all unique Companies / Brands (Pran, Aarong, Akij, Fresh, Square, etc.)
  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];

  // Filter products by Brand, Category, and Search
  const filteredProducts = products.filter(prod => {
    const matchesBrand = selectedBrand === 'All' || prod.brand === selectedBrand;
    const matchesCat = selectedCategory === 'All' || prod.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      prod.name.toLowerCase().includes(q) || 
      (prod.brand && prod.brand.toLowerCase().includes(q)) ||
      prod.barcode.toLowerCase().includes(q) ||
      String(prod.slNo) === q ||
      prod.sku?.toLowerCase().includes(q);
    return matchesBrand && matchesCat && matchesSearch;
  });

  const playScannerBeep = (freq = 1200) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {}
  };

  const handleBarcodeSubmit = (e) => {
    e?.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    const matched = findProductByBarcodeOrSerial(query);

    if (matched) {
      addToCart(matched, 1);
      playScannerBeep(1300);
      setScanFeedback({ type: 'success', message: `[SL #${matched.slNo}] Added: ${matched.name}` });
      setBarcodeInput('');
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

  const handleManualImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const res = await compressProductImage(file, 150 * 1024);
      setManualImagePreview(res);
      setManualForm(prev => ({ ...prev, image: res.dataUrl }));
    } catch (err) {
      alert("Failed to compress image.");
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveManualItem = (e) => {
    e.preventDefault();
    if (!manualForm.name.trim() || !manualForm.price) {
      alert("Please enter Item Name and Price.");
      return;
    }

    addManualItemToCart({
      name: manualForm.name,
      brand: manualForm.brand,
      price: manualForm.price,
      qty: manualForm.qty || 1,
      barcode: manualForm.barcode,
      image: manualForm.image
    });

    playScannerBeep(1400);
    setScanFeedback({ type: 'success', message: `Added to list: ${manualForm.name}` });
    setIsManualAddOpen(false);
    setManualForm({ name: '', brand: 'General', price: '', qty: '1', barcode: '', image: '' });
    setManualImagePreview(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

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

  // Cart calculations considering product-level discounts
  let grossSubtotal = 0;
  let discountedSubtotal = 0;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  cart.forEach(item => {
    const pricing = getProductPricing(item.product);
    grossSubtotal += pricing.originalPrice * item.qty;
    discountedSubtotal += pricing.finalPrice * item.qty;
  });

  const itemSavings = grossSubtotal - discountedSubtotal;

  let extraCartDiscount = 0;
  if (cartDiscount.type === 'percent') {
    extraCartDiscount = (discountedSubtotal * cartDiscount.value) / 100;
  } else {
    extraCartDiscount = Number(cartDiscount.value) || 0;
  }
  extraCartDiscount = Math.min(extraCartDiscount, discountedSubtotal);

  const netPayable = Math.max(0, discountedSubtotal - extraCartDiscount);

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const handleProcessPayment = (paymentData) => {
    completeTransaction(paymentData);
    setIsPaymentOpen(false);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden', background: '#f8fafc' }}>
      
      {/* LEFT & CENTER: Product Catalog & Auto Barcode Scanner Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', borderRight: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* Top Scanner & Search Bar */}
        <div style={{
          padding: '12px 18px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          
          {/* Hardware Barcode Reader Input */}
          <form onSubmit={handleBarcodeSubmit} style={{ flex: '1.4', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Barcode size={20} color="#059669" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan Barcode (e.g. 8941101010722) or Serial # (e.g. 1, 2) + Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1.5px solid #059669',
                  borderRadius: '8px',
                  padding: '10px 14px 10px 42px',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.12)'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '5px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Auto-Scan
              </button>
            </div>
          </form>

          {/* Search by Product Name or Company */}
          <div style={{ flex: '1', position: 'relative' }}>
            <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '11px', top: '11px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by name, company (Pran, Aarong, Akij)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '9px 12px 9px 36px',
                color: '#0f172a',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={() => setIsManualAddOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              padding: '9px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <PlusCircle size={15} />
            <span>+ Manual Item Add</span>
          </button>
        </div>

        {/* COMPANY / BRAND FILTER PILLS BAR */}
        <div style={{
          padding: '8px 18px',
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 800, color: '#0f172a', marginRight: '4px' }}>
            <Building2 size={14} color="#2563eb" />
            <span>Company / Brand:</span>
          </div>

          {brands.map(brand => {
            const isSelected = selectedBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: isSelected ? '#eff6ff' : '#f8fafc',
                  color: isSelected ? '#1d4ed8' : '#475569',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{brand}</span>
                {brand !== 'All' && (
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>
                    ({products.filter(p => p.brand === brand).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Pills Filter */}
        <div style={{
          padding: '8px 18px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
            Category:
          </span>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  border: isSelected ? '1px solid #059669' : '1px solid #e2e8f0',
                  background: isSelected ? '#059669' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Scan feedback toast */}
        {scanFeedback && (
          <div style={{
            padding: '7px 18px',
            background: scanFeedback.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: scanFeedback.type === 'success' ? '#065f46' : '#991b1b',
            borderBottom: `1px solid ${scanFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {scanFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{scanFeedback.message}</span>
          </div>
        )}

        {/* Product Cards Grid with BEFORE & AFTER DISCOUNT PRICES + % OFF BADGE */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
          gap: '12px',
          alignContent: 'start',
          background: '#f8fafc'
        }}>
          {filteredProducts.map(product => {
            const inCart = cart.find(item => item.product.id === product.id);
            const isLowStock = product.stock <= 10;
            const isRealImage = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'));
            const pricing = getProductPricing(product);

            return (
              <div
                key={product.id}
                onClick={() => {
                  addToCart(product, 1);
                  playScannerBeep();
                }}
                className="pos-card"
                style={{
                  border: inCart ? '2px solid #059669' : '1px solid #e2e8f0',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {/* Serial Number & Company Tag */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    background: '#f1f5f9',
                    color: '#0f172a',
                    fontSize: '10px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}>
                    SL #{product.slNo}
                  </span>

                  <span style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #bfdbfe'
                  }}>
                    {product.brand || 'General'}
                  </span>
                </div>

                {/* Real Product Image with OFF Discount Badge */}
                <div style={{
                  width: '100%',
                  height: '100px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  border: '1px solid #f1f5f9',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {/* % OFF DISCOUNT BADGE */}
                  {pricing.hasDiscount && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: '#e11d48',
                      color: '#ffffff',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(225, 29, 72, 0.4)',
                      letterSpacing: '0.3px',
                      zIndex: 2
                    }}>
                      🔥 {pricing.badge}
                    </div>
                  )}

                  {isRealImage ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <span style={{ fontSize: '32px' }}>{product.image || '📦'}</span>
                  )}
                </div>

                <div>
                  <h3 style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 3px 0',
                    lineHeight: 1.3,
                    height: '32px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {product.name}
                  </h3>
                  <div style={{
                    fontSize: '10px',
                    color: '#64748b',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '6px'
                  }}>
                    {product.barcode}
                  </div>
                </div>

                {/* BEFORE & AFTER DISCOUNT PRICES */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '6px',
                  marginTop: '2px'
                }}>
                  <div>
                    {/* Before discount crossed out price */}
                    {pricing.hasDiscount ? (
                      <div>
                        <span style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          fontFamily: 'var(--font-mono)',
                          marginRight: '4px'
                        }}>
                          Tk {pricing.originalPrice.toFixed(0)}
                        </span>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: '#059669',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          Tk {pricing.finalPrice.toFixed(0)}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>Price</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                          Tk {pricing.originalPrice.toFixed(0)}
                        </div>
                      </div>
                    )}
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isLowStock ? '#dc2626' : '#64748b',
                    background: isLowStock ? '#fee2e2' : '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {product.stock} {product.unit || 'pcs'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: Active Cart & Billing Items List */}
      <div style={{ width: '450px', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>
        
        {/* Cart Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="#059669" />
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Invoice Items List
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Sequential Items & Savings
              </span>
            </div>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid #a7f3d0'
            }}>
              {totalItemsCount} pcs
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#fee2e2',
                border: 'none',
                color: '#dc2626',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              <RotateCcw size={12} />
              <span>Clear Bill</span>
            </button>
          )}
        </div>

        {/* Cart Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 34px 1fr 85px 75px 22px',
          padding: '8px 14px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          alignItems: 'center'
        }}>
          <span>SL#</span>
          <span>Img</span>
          <span>Item & Brand</span>
          <span style={{ textAlign: 'center' }}>Qty</span>
          <span style={{ textAlign: 'right' }}>Total Tk</span>
          <span></span>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
          {cart.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              textAlign: 'center',
              padding: '20px'
            }}>
              <Barcode size={44} strokeWidth={1.2} style={{ marginBottom: '10px', opacity: 0.6 }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>
                No items on bill
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '240px', lineHeight: 1.4 }}>
                Select a company (Pran, Aarong, Akij), scan a barcode, or click <strong>+ Manual Item Add</strong>.
              </div>
            </div>
          ) : (
            cart.map((item, index) => {
              const pricing = getProductPricing(item.product);
              const lineTotal = pricing.finalPrice * item.qty;
              const serialNo = index + 1;
              const isRealImg = item.product.image && (item.product.image.startsWith('http') || item.product.image.startsWith('data:'));

              return (
                <div
                  key={item.product.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'grid',
                    gridTemplateColumns: '32px 34px 1fr 85px 75px 22px',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {/* Serial Number */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ecfdf5',
                    padding: '3px 4px',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    #{serialNo}
                  </span>

                  {/* Thumbnail Image */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0'
                  }}>
                    {isRealImg ? (
                      <img src={item.product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '14px' }}>{item.product.image || '📦'}</span>
                    )}
                  </div>

                  {/* Name, Company and Pricing */}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>{item.product.brand || 'General'}</span>
                      {pricing.hasDiscount ? (
                        <>
                          <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>Tk {pricing.originalPrice}</span>
                          <span style={{ color: '#059669', fontWeight: 700 }}>Tk {pricing.finalPrice}</span>
                          <span style={{ background: '#fee2e2', color: '#e11d48', padding: '1px 3px', borderRadius: '3px', fontWeight: 700 }}>{pricing.badge}</span>
                        </>
                      ) : (
                        <span style={{ color: '#64748b' }}>Tk {pricing.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  {/* Qty Stepper */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#475569',
                        padding: '2px 5px',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={10} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateCartQty(item.product.id, Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '30px',
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        outline: 'none',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#475569',
                        padding: '2px 5px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{
                    fontSize: '12.5px',
                    fontWeight: 800,
                    color: '#0f172a',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'right'
                  }}>
                    {lineTotal.toFixed(2)}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Calculation & Action Footer */}
        <div style={{
          padding: '14px 18px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <span>Gross Total:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#64748b' }}>
              Tk {grossSubtotal.toFixed(2)}
            </span>
          </div>

          {/* Product Savings / Discounts */}
          {itemSavings > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#e11d48' }}>
              <span>Product Offers Discount:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                - Tk {itemSavings.toFixed(2)}
              </span>
            </div>
          )}

          {extraCartDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#e11d48' }}>
              <span>Additional Invoice Discount:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                - Tk {extraCartDiscount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="receipt-divider" style={{ borderColor: '#e2e8f0', margin: '2px 0' }} />

          {/* Net Payable */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Net Amount
              </span>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                Total Payable
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#059669',
              fontFamily: 'var(--font-mono)'
            }}>
              Tk {netPayable.toFixed(2)}
            </div>
          </div>

          {/* Checkout & Pay Button */}
          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            style={{
              marginTop: '4px',
              width: '100%',
              background: cart.length > 0 ? '#059669' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: cart.length > 0 ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <CreditCard size={18} />
            <span>Pay & Print Slip (Tk {netPayable.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* Manual Item Quick Add Modal */}
      {isManualAddOpen && (
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
          zIndex: 920,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} color="#059669" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Manual Product Add to Bill
                </h3>
              </div>
              <button
                onClick={() => setIsManualAddOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualItem} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pran Mango Bar or Aarong Butter"
                  value={manualForm.name}
                  onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Company / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pran, Aarong, Akij"
                    value={manualForm.brand}
                    onChange={(e) => setManualForm(prev => ({ ...prev, brand: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Price (Tk) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 125"
                    value={manualForm.price}
                    onChange={(e) => setManualForm(prev => ({ ...prev, price: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1.5px solid #059669',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#059669',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Photo Upload with under 150KB */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Photo (Auto-compressed &lt; 150 KB)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#475569'
                  }}>
                    <Upload size={14} color="#059669" />
                    <span>{compressing ? 'Compressing...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleManualImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {manualImagePreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <img
                        src={manualImagePreview.dataUrl}
                        alt="Preview"
                        style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #059669' }}
                      />
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                        {manualImagePreview.sizeKb} KB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#059669',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Add to Bill List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unknown Scanned Barcode Dialog */}
      {unknownBarcodePrompt && (
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
          zIndex: 930,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              background: '#fffbeb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#d97706" />
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: '#92400e' }}>
                  Unregistered Barcode Scanned!
                </h3>
              </div>
              <button
                onClick={() => setUnknownBarcodePrompt(null)}
                style={{ background: 'transparent', border: 'none', color: '#92400e', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUnknownBarcode} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Scanned Barcode:</span>
                <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                  {unknownBarcodePrompt.barcode}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhuni Turmeric Powder 200g"
                  value={unknownBarcodePrompt.name}
                  onChange={(e) => setUnknownBarcodePrompt(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Company / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pran, Square, Akij"
                    value={unknownBarcodePrompt.brand}
                    onChange={(e) => setUnknownBarcodePrompt(prev => ({ ...prev, brand: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#059669', display: 'block', marginBottom: '4px' }}>
                    Selling Price (Tk) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 95"
                    value={unknownBarcodePrompt.price}
                    onChange={(e) => setUnknownBarcodePrompt(prev => ({ ...prev, price: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1.5px solid #059669',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#059669',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setUnknownBarcodePrompt(null)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#059669',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save & Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={discountedSubtotal}
        cartDiscount={cartDiscount}
        setCartDiscount={setCartDiscount}
        onProcessPayment={handleProcessPayment}
        shopSettings={shopSettings}
      />
    </div>
  );
}
