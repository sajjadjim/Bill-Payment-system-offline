import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_PRODUCTS, DEFAULT_SHOP_SETTINGS } from '../data/defaultProducts';
import { supabase, compressProductImage, uploadImageToSupabase, SUPABASE_SETUP_SQL } from '../lib/supabaseClient';
import { getProductPricing } from '../utils/pricing';

export const DEFAULT_USERS = [
  {
    id: 'usr-admin-1',
    userId: 'admin',
    name: 'Store Administrator',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'usr-seller-1',
    userId: 'lipi',
    name: 'Lipi Akter (Cashier)',
    password: 'seller123',
    role: 'seller'
  },
  {
    id: 'usr-seller-2',
    userId: 'seller',
    name: 'Sales Counter Staff',
    password: 'seller123',
    role: 'seller'
  }
];

const AppContext = createContext();

export function AppProvider({ children }) {
  // Staff Users & Auth State (Admin vs Seller RBAC)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync users to local storage
  useEffect(() => {
    localStorage.setItem('grace_pos_users', JSON.stringify(users));
  }, [users]);

  // Sync current user session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('grace_pos_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('grace_pos_auth_user');
    }
  }, [currentUser]);

  // Products state (localStorage-backed + Supabase cloud sync)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((p, idx) => {
          const defaultMatch = DEFAULT_PRODUCTS.find(dp => dp.barcode === p.barcode);
          return {
            ...p,
            slNo: p.slNo || idx + 1,
            sku: p.sku || `PRD-${String(idx + 1).padStart(4, '0')}`,
            brand: p.brand || defaultMatch?.brand || 'General',
            discount: p.discount || defaultMatch?.discount || { type: 'percent', value: 0 },
            image: p.image && !p.image.startsWith('http') && !p.image.startsWith('data:') && defaultMatch
              ? defaultMatch.image
              : p.image || defaultMatch?.image
          };
        });
      }
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  });

  // Shop Settings
  const [shopSettings, setShopSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SHOP_SETTINGS;
    } catch {
      return DEFAULT_SHOP_SETTINGS;
    }
  });

  // Active POS Cart (Billing List) - Persisted across page hard refreshes!

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('grace_pos_active_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Active Cart Discount - Persisted across page hard refreshes!
  const [cartDiscount, setCartDiscount] = useState(() => {
    try {
      const savedDiscount = localStorage.getItem('grace_pos_cart_discount');
      return savedDiscount ? JSON.parse(savedDiscount) : { type: 'flat', value: 0 };
    } catch {
      return { type: 'flat', value: 0 };
    }
  });

  // Sales History
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_transactions');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: "tx-sample-1",
          invoiceNo: "09282026JIM030373",
          date: "09/28/2026",
          time: "10:42:30PM",
          timestamp: new Date("2026-09-28T22:42:30").getTime(),
          shopId: "JIM",
          servedBy: "lipi",
          customerId: "",
          customerName: "Walk-in Customer",
          items: [
            {
              sl: 1,
              id: "prod-1",
              name: "aarong aarong Yoghurt 500gm",
              barcode: "8941101010722",
              brand: "Aarong",
              originalPrice: 120.00,
              price: 108.00,
              discountBadge: "10% OFF",
              qty: 1.00,
              total: 108.00
            },
            {
              sl: 2,
              id: "prod-2",
              name: "fresh tissue Fresh Paper Nepjin 100pcs 1ply",
              barcode: "8941161002453",
              brand: "Fresh",
              originalPrice: 75.00,
              price: 70.00,
              discountBadge: "Tk 5 OFF",
              qty: 1.00,
              total: 70.00
            }
          ],
          totalItemsQty: 2.00,
          subtotal: 195.00,
          itemSavings: 17.00,
          discount: 0.00,
          vat: 0.00,
          netAmount: 178.00,
          payType: "CASH",
          paidAmount: 1000.00,
          changeAmount: 822.00,
          pointsThisInvoice: 0.00,
          previousPointBalance: 0.00,
          redeemPoint: 0.00
        }
      ];
    } catch {
      return [];
    }
  });

  const [activeCustomer, setActiveCustomer] = useState({ id: '', name: 'Walk-in Customer', points: 0 });

  // Navigation - Persist active tab across refreshes
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('grace_pos_active_tab') || 'pos';
    } catch {
      return 'pos';
    }
  });

  // Selected receipt for thermal modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Online / Offline monitor
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseStatus, setSupabaseStatus] = useState('connected');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithSupabase();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync products to local storage
  useEffect(() => {
    localStorage.setItem('grace_pos_products', JSON.stringify(products));
  }, [products]);

  // Sync settings
  useEffect(() => {
    localStorage.setItem('grace_pos_settings', JSON.stringify(shopSettings));
  }, [shopSettings]);

  // Sync transactions
  useEffect(() => {
    localStorage.setItem('grace_pos_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Persist Active Cart on every addition/removal/quantity change
  useEffect(() => {
    localStorage.setItem('grace_pos_active_cart', JSON.stringify(cart));
  }, [cart]);

  // Persist Cart Discount
  useEffect(() => {
    localStorage.setItem('grace_pos_cart_discount', JSON.stringify(cartDiscount));
  }, [cartDiscount]);

  // Persist Active Tab
  useEffect(() => {
    localStorage.setItem('grace_pos_active_tab', activeTab);
  }, [activeTab]);

  // Sync with Supabase
  const syncWithSupabase = async () => {
    if (!navigator.onLine) return;
    try {
      setSupabaseStatus('syncing');
      
      // Sync products
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        setSupabaseStatus('table_needed');
      } else if (data && data.length > 0) {
        const mapped = data.map((item, idx) => ({
          id: item.id,
          slNo: item.sl_no || idx + 1,
          sku: item.sku || `PRD-${String(idx + 1).padStart(4, '0')}`,
          barcode: item.barcode,
          name: item.name,
          brand: item.brand || 'General',
          category: item.category || 'General Grocery',
          price: Number(item.price),
          costPrice: Number(item.cost_price || 0),
          stock: Number(item.stock || 0),
          unit: item.unit || 'pcs',
          discount: item.discount || { type: 'percent', value: 0 },
          image: item.image
        }));
        setProducts(mapped);
      }

      // Sync users from Supabase users table (manually created accounts)
      try {
        const { data: userData, error: userError } = await supabase.from('users').select('*');
        if (!userError && userData && userData.length > 0) {
          const mappedUsers = userData.map(u => ({
            id: u.id,
            userId: u.user_id,
            name: u.name,
            password: u.password,
            role: u.role
          }));
          setUsers(mappedUsers);
        }
      } catch (userErr) {
        console.warn("Supabase user sync error:", userErr);
      }

      setSupabaseStatus('connected');
    } catch {
      setSupabaseStatus('error');
    }
  };

  useEffect(() => {
    syncWithSupabase();
  }, []);

  // Staff Authentication & Role Operations
  const loginUser = (inputId, inputPass) => {
    const cleanId = (inputId || '').trim().toLowerCase();
    const match = users.find(u => u.userId.toLowerCase() === cleanId);

    if (!match) {
      return { success: false, error: 'User ID not found in database. Please check credentials.' };
    }

    if (match.password !== inputPass) {
      return { success: false, error: 'Incorrect password for this user ID.' };
    }

    setCurrentUser(match);

    // If seller logs in, route to POS and automatically set servedBy name on receipts
    if (match.role === 'seller') {
      setActiveTab('pos');
      setShopSettings(prev => ({ ...prev, servedBy: match.name || match.userId }));
    }

    return { success: true, user: match };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('grace_pos_auth_user');
    setActiveTab('pos');
  };


  // Cart operations
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      } else {
        updated = [...prev, { product, qty }];
      }
      localStorage.setItem('grace_pos_active_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const addManualItemToCart = ({ name, price, brand = 'General', qty = 1, barcode = '', image = '' }) => {
    const nextSl = products.length + 1;
    const cleanBarcode = barcode.trim() || String(Math.floor(8941000000000 + Math.random() * 999999999));
    const newProduct = {
      slNo: nextSl,
      id: `prod-manual-${Date.now()}`,
      sku: `PRD-${String(nextSl).padStart(4, '0')}`,
      barcode: cleanBarcode,
      name: name.trim(),
      brand: brand.trim() || 'General',
      category: 'General Grocery',
      price: Number(price) || 0,
      costPrice: Number(price) * 0.85,
      stock: 100,
      unit: 'pcs',
      discount: { type: 'percent', value: 0 },
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
    };

    setProducts(prev => [...prev, newProduct]);
    addToCart(newProduct, Number(qty) || 1);
    syncProductToSupabase(newProduct);
    return newProduct;
  };

  const updateCartQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const updated = prev.map(item =>
        item.product.id === productId ? { ...item, qty: newQty } : item
      );
      localStorage.setItem('grace_pos_active_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const updated = prev.filter(item => item.product.id !== productId);
      localStorage.setItem('grace_pos_active_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount({ type: 'flat', value: 0 });
    localStorage.removeItem('grace_pos_active_cart');
    localStorage.removeItem('grace_pos_cart_discount');
  };

  const findProductByBarcodeOrSerial = (query) => {
    const clean = query.trim().toLowerCase();
    const bySl = products.find(p => String(p.slNo) === clean || p.sku?.toLowerCase() === clean);
    if (bySl) return bySl;

    const byBarcode = products.find(p => p.barcode.toLowerCase() === clean || p.barcode.endsWith(clean));
    if (byBarcode) return byBarcode;

    return products.find(p => p.name.toLowerCase().includes(clean) || (p.brand && p.brand.toLowerCase().includes(clean)));
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${mm}${dd}${yyyy}`;
    const shopCode = shopSettings.shopId || "JIM";
    const randSeq = String(Math.floor(10000 + Math.random() * 90000));
    return `${dateStr}${shopCode}${randSeq}`;
  };

  const applyBulkDiscount = (productIds, discountObj) => {
    if (currentUser?.role === 'seller') {
      alert("Permission Denied: Only Admin can modify product discounts.");
      return;
    }
    setProducts(prev =>
      prev.map(p => {
        if (productIds.includes(p.id)) {
          const updated = { ...p, discount: discountObj };
          syncProductToSupabase(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const clearBulkDiscount = (productIds) => {
    if (currentUser?.role === 'seller') {
      alert("Permission Denied: Only Admin can modify product discounts.");
      return;
    }
    applyBulkDiscount(productIds, { type: 'percent', value: 0 });
  };

  const completeTransaction = ({ payType, paidAmount, note, cardLast4, trxId }) => {
    let grossSubtotal = 0;
    let totalDiscountedSubtotal = 0;
    const totalItemsQty = cart.reduce((sum, item) => sum + item.qty, 0);

    const itemsSummary = cart.map((item, idx) => {
      const pricing = getProductPricing(item.product);
      const lineTotal = pricing.finalPrice * item.qty;
      grossSubtotal += pricing.originalPrice * item.qty;
      totalDiscountedSubtotal += lineTotal;

      return {
        sl: idx + 1,
        id: item.product.id,
        name: item.product.name,
        brand: item.product.brand || 'General',
        barcode: item.product.barcode,
        originalPrice: pricing.originalPrice,
        price: pricing.finalPrice,
        discountBadge: pricing.badge,
        discountAmount: pricing.discountAmount,
        qty: item.qty,
        total: lineTotal
      };
    });

    const itemLevelSavings = grossSubtotal - totalDiscountedSubtotal;

    let additionalCartDiscount = 0;
    if (cartDiscount.type === 'percent') {
      additionalCartDiscount = (totalDiscountedSubtotal * cartDiscount.value) / 100;
    } else {
      additionalCartDiscount = Number(cartDiscount.value) || 0;
    }
    additionalCartDiscount = Math.min(additionalCartDiscount, totalDiscountedSubtotal);

    const totalDiscountAll = itemLevelSavings + additionalCartDiscount;
    const netPayablePreTax = totalDiscountedSubtotal - additionalCartDiscount;
    const vatAmount = (netPayablePreTax * (shopSettings.vatPercentage || 0)) / 100;
    const netAmount = Math.round((netPayablePreTax + vatAmount) * 100) / 100;

    const actualPaid = payType === 'CASH' ? Number(paidAmount || netAmount) : netAmount;
    const changeAmount = Math.max(0, actualPaid - netAmount);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const newTx = {
      id: `tx-${Date.now()}`,
      invoiceNo: generateInvoiceNumber(),
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      shopId: shopSettings.shopId,
      servedBy: currentUser ? (currentUser.name || currentUser.userId) : (shopSettings.servedBy || "lipi"),
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      items: itemsSummary,
      totalItemsQty,
      subtotal: grossSubtotal,
      itemSavings: itemLevelSavings,
      discount: totalDiscountAll,
      vat: vatAmount,
      netAmount,
      payType,
      paidAmount: actualPaid,
      changeAmount,
      cardLast4,
      trxId,
      pointsThisInvoice: Math.floor(netAmount / 100),
      previousPointBalance: activeCustomer.points || 0,
      redeemPoint: 0
    };


    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const cartItem = cart.find(ci => ci.product.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.qty) };
        }
        return prod;
      })
    );

    setTransactions(prev => [newTx, ...prev]);
    syncTransactionToSupabase(newTx);

    clearCart();
    setSelectedReceipt(newTx);

    return newTx;
  };

  const syncProductToSupabase = async (p) => {
    if (!navigator.onLine) return;
    try {
      await supabase.from('products').upsert({
        id: p.id,
        sl_no: p.slNo,
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        cost_price: p.costPrice,
        stock: p.stock,
        unit: p.unit,
        discount: p.discount,
        image: p.image
      });
    } catch (err) {
      console.warn("Supabase product upsert skipped:", err);
    }
  };

  const syncTransactionToSupabase = async (tx) => {
    if (!navigator.onLine) return;
    try {
      await supabase.from('transactions').insert({
        id: tx.id,
        invoice_no: tx.invoiceNo,
        date: tx.date,
        time: tx.time,
        timestamp: tx.timestamp,
        shop_id: tx.shopId,
        served_by: tx.servedBy,
        customer_name: tx.customerName,
        items: tx.items,
        total_items_qty: tx.totalItemsQty,
        subtotal: tx.subtotal,
        discount: tx.discount,
        vat: tx.vat,
        net_amount: tx.netAmount,
        pay_type: tx.payType,
        paid_amount: tx.paidAmount,
        change_amount: tx.changeAmount
      });
    } catch (err) {
      console.warn("Supabase transaction insert skipped:", err);
    }
  };

  const addProduct = (newProduct) => {
    if (currentUser?.role === 'seller') {
      alert("Permission Denied: Only Admin can add new products to the catalog.");
      return null;
    }
    const nextSl = products.length + 1;
    const created = {
      ...newProduct,
      slNo: nextSl,
      id: `prod-${Date.now()}`,
      sku: newProduct.sku || `PRD-${String(nextSl).padStart(4, '0')}`,
      brand: newProduct.brand || 'General',
      stock: Number(newProduct.stock) || 0,
      price: Number(newProduct.price) || 0,
      costPrice: Number(newProduct.costPrice) || 0,
      discount: newProduct.discount || { type: 'percent', value: 0 },
      barcode: newProduct.barcode || String(Math.floor(8940000000000 + Math.random() * 9999999999)),
      image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
    };
    setProducts(prev => [...prev, created]);
    syncProductToSupabase(created);
    return created;
  };

  const updateProduct = (id, updatedFields) => {
    if (currentUser?.role === 'seller') {
      alert("Permission Denied: Only Admin can update products or manually edit stock quantities.");
      return;
    }
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...updatedFields };
          syncProductToSupabase(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id) => {
    if (currentUser?.role === 'seller') {
      alert("Permission Denied: Only Admin can delete products from inventory.");
      return;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    if (navigator.onLine) {
      supabase.from('products').delete().eq('id', id).then(() => { }).catch(() => { });
    }
  };

  const resetToSampleData = () => {
    if (currentUser?.role === 'seller') {
      alert("Permission Denied: Only Admin can reset store data.");
      return;
    }
    setProducts(DEFAULT_PRODUCTS);
    setShopSettings(DEFAULT_SHOP_SETTINGS);
  };

  return (
    <AppContext.Provider
      value={{
        users,
        currentUser,
        loginUser,
        logoutUser,
        isAdmin: currentUser?.role === 'admin',
        isSeller: currentUser?.role === 'seller',
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        applyBulkDiscount,
        clearBulkDiscount,
        resetToSampleData,
        shopSettings,
        setShopSettings,
        transactions,
        cart,
        addToCart,
        addManualItemToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        activeCustomer,
        setActiveCustomer,
        completeTransaction,
        selectedReceipt,
        setSelectedReceipt,
        findProductByBarcodeOrSerial,
        activeTab,
        setActiveTab,
        isOnline,
        supabaseStatus,
        syncWithSupabase,
        uploadImageToSupabase,
        compressProductImage,
        SUPABASE_SETUP_SQL,
        getProductPricing
      }}
    >

      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
