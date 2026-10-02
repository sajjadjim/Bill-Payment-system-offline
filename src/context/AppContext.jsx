import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_PRODUCTS, DEFAULT_SHOP_SETTINGS } from '../data/defaultProducts';
import { supabase, compressProductImage, uploadImageToSupabase, SUPABASE_SETUP_SQL } from '../lib/supabaseClient';
import { getProductPricing } from '../utils/pricing';

export const DEFAULT_USERS = [
  {
    id: 'usr-cashier-1',
    userId: 'L61627',
    name: 'L61627 (Cashier)',
    password: 'seller123',
    role: 'admin'
  },
  {
    id: 'usr-admin-1',
    userId: 'admin',
    name: 'Store Administrator',
    password: 'admin123',
    role: 'admin'
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
      return saved ? JSON.parse(saved) : DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const productMap = new Map();
          DEFAULT_PRODUCTS.forEach(p => productMap.set(String(p.barcode) + '_' + String(p.id), p));
          parsed.forEach(p => productMap.set(String(p.barcode) + '_' + String(p.id), p));
          return Array.from(productMap.values());
        }
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
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SHOP_SETTINGS, ...parsed, softwareVersion: '2.0.1' };
      }
      return { ...DEFAULT_SHOP_SETTINGS, softwareVersion: '2.0.1' };
    } catch {
      return { ...DEFAULT_SHOP_SETTINGS, softwareVersion: '2.0.1' };
    }
  });

  // Active POS Cart (Billing List) - Persisted across page hard refreshes!
  // Defaults to the 3 items shown in the Bangladeshi supershop photo
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('grace_pos_active_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const rok = DEFAULT_PRODUCTS.find(p => p.barcode === '2603029');
    const saad = DEFAULT_PRODUCTS.find(p => p.barcode === '2704597');
    const sixers = DEFAULT_PRODUCTS.find(p => p.barcode === '2817974');
    const initial = [];
    if (rok) initial.push({ product: rok, qty: 2 });
    if (saad) initial.push({ product: saad, qty: 1 });
    if (sixers) initial.push({ product: sixers, qty: 1 });
    return initial;
  });

  // Customer Loyalty Points Database (Indexed by Mobile Number Only)
  // Customer Loyalty Points Database (Indexed by Mobile Number Only)
  // Rule: 100 Tk purchase = 1 point, 3 months validity, 100 points = 75 Tk discount
  const DEFAULT_CUSTOMERS = {
    '01711223344': {
      phone: '01711223344',
      name: 'Rahim Ahmed',
      pointsLedger: [
        {
          id: 'pt-1',
          points: 100,
          earnedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 80 * 24 * 60 * 60 * 1000,
          invoiceNo: 'F64101'
        }
      ]
    },
    '01819556677': {
      phone: '01819556677',
      name: 'Karima Begum',
      pointsLedger: [
        {
          id: 'pt-2',
          points: 200,
          earnedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 75 * 24 * 60 * 60 * 1000,
          invoiceNo: 'F64102'
        }
      ]
    },
    '01912345678': {
      phone: '01912345678',
      name: 'Tanvir Hasan',
      pointsLedger: [
        {
          id: 'pt-3',
          points: 350,
          earnedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 85 * 24 * 60 * 60 * 1000,
          invoiceNo: 'F64103'
        }
      ]
    },
    '01620754986': {
      phone: '01620754986',
      name: 'Sajjad Hossain',
      pointsLedger: [
        {
          id: 'pt-4',
          points: 500,
          earnedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 88 * 24 * 60 * 60 * 1000,
          invoiceNo: 'F64104'
        }
      ]
    },
    '01899887766': {
      phone: '01899887766',
      name: 'Sadia Islam',
      pointsLedger: [
        {
          id: 'pt-5',
          points: 150,
          earnedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 70 * 24 * 60 * 60 * 1000,
          invoiceNo: 'F64105'
        }
      ]
    },
    '01552334455': {
      phone: '01552334455',
      name: 'Nusrat Jahan',
      pointsLedger: [
        {
          id: 'pt-6',
          points: 80,
          earnedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 89 * 24 * 60 * 60 * 1000,
          invoiceNo: 'F64106'
        }
      ]
    }
  };

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_customers');
      if (saved) {
        return { ...DEFAULT_CUSTOMERS, ...JSON.parse(saved) };
      }
      return DEFAULT_CUSTOMERS;
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('grace_pos_customers', JSON.stringify(customers));
  }, [customers]);

  // Sync customers from Supabase cloud database on startup
  useEffect(() => {
    const fetchCustomersCloud = async () => {
      if (!navigator.onLine) return;
      try {
        const { data, error } = await supabase.from('customers').select('*');
        if (!error && data && data.length > 0) {
          setCustomers(prev => {
            const merged = { ...prev };
            data.forEach(c => {
              if (c.phone) {
                merged[c.phone] = {
                  phone: c.phone,
                  name: c.name || merged[c.phone]?.name || 'Customer',
                  pointsLedger: c.points_ledger || merged[c.phone]?.pointsLedger || []
                };
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.warn("Supabase fetch customers skipped:", err);
      }
    };
    fetchCustomersCloud();
  }, []);

  // Held Invoices (Supports up to 5 Multiple Customer Bills: Recall Invoice - 1 to 5)
  const [heldInvoices, setHeldInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_held_invoices');
      return saved ? JSON.parse(saved) : [
        {
          slot: 1,
          title: 'Recall Invoice - 1',
          time: '09:40 PM',
          itemsCount: 2,
          total: 195.00,
          customerPhone: '01711223344',
          customerName: 'Rahim Ahmed',
          cart: [
            { product: DEFAULT_PRODUCTS[3] || DEFAULT_PRODUCTS[0], qty: 1 },
            { product: DEFAULT_PRODUCTS[4] || DEFAULT_PRODUCTS[1], qty: 1 }
          ]
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('grace_pos_held_invoices', JSON.stringify(heldInvoices));
  }, [heldInvoices]);

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

  // View Mode: 'pos' (POS Bill Payment Counter) vs 'store' (Store Management Portal)
  const [viewMode, setViewMode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'store' ? 'store' : 'pos';
    } catch {
      return 'pos';
    }
  });

  // Navigation - Persist active tab across refreshes per viewMode
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isStore = params.get('view') === 'store';
      if (isStore) {
        return localStorage.getItem('grace_pos_active_tab_store') || 'products';
      }
      return localStorage.getItem('grace_pos_active_tab_pos') || 'pos';
    } catch {
      return 'pos';
    }
  });

  // Synchronize document title and handle popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('view') === 'store' ? 'store' : 'pos';
      setViewMode(mode);
      if (mode === 'store') {
        const saved = localStorage.getItem('grace_pos_active_tab_store') || 'products';
        setActiveTab(saved);
      } else {
        const saved = localStorage.getItem('grace_pos_active_tab_pos') || 'pos';
        setActiveTab(saved);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser tab title based on viewMode and shopName
  useEffect(() => {
    const title = shopSettings.shopName || 'Super Shop';
    if (viewMode === 'store') {
      document.title = `${title} - Store Management`;
    } else {
      document.title = `${title} - POS Billing Counter`;
    }
  }, [viewMode, shopSettings.shopName]);

  // Persist Active Tab per view mode
  useEffect(() => {
    if (viewMode === 'store') {
      localStorage.setItem('grace_pos_active_tab_store', activeTab);
    } else {
      localStorage.setItem('grace_pos_active_tab_pos', activeTab);
    }
  }, [activeTab, viewMode]);

  // Helper to open Store tab in a new browser window/tab
  const openStoreWindow = () => {
    const storeUrl = `${window.location.origin}${window.location.pathname}?view=store`;
    window.open(storeUrl, '_blank');
  };

  // Helper to open POS Terminal tab in a new browser window/tab
  const openPosWindow = () => {
    const posUrl = `${window.location.origin}${window.location.pathname}`;
    window.open(posUrl, '_blank');
  };

  // Cross-tab real-time sync (BroadcastChannel + storage event)
  useEffect(() => {
    let bc;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('grace_pos_cross_tab_sync');
        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'PRODUCTS_UPDATED' && Array.isArray(payload)) {
            setProducts(payload);
          } else if (type === 'SETTINGS_UPDATED' && payload) {
            setShopSettings(payload);
          } else if (type === 'TRANSACTIONS_UPDATED' && Array.isArray(payload)) {
            setTransactions(payload);
          } else if (type === 'USERS_UPDATED' && Array.isArray(payload)) {
            setUsers(payload);
          }
        };
      }
    } catch {}

    const handleStorage = (e) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'grace_pos_products') {
          const data = JSON.parse(e.newValue);
          if (Array.isArray(data)) setProducts(data);
        } else if (e.key === 'grace_pos_settings') {
          const data = JSON.parse(e.newValue);
          if (data) setShopSettings(data);
        } else if (e.key === 'grace_pos_transactions') {
          const data = JSON.parse(e.newValue);
          if (Array.isArray(data)) setTransactions(data);
        } else if (e.key === 'grace_pos_users') {
          const data = JSON.parse(e.newValue);
          if (Array.isArray(data)) setUsers(data);
        }
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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

  // Sync products to local storage & broadcast to other tabs
  useEffect(() => {
    localStorage.setItem('grace_pos_products', JSON.stringify(products));
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('grace_pos_cross_tab_sync');
        bc.postMessage({ type: 'PRODUCTS_UPDATED', payload: products });
        bc.close();
      }
    } catch {}
  }, [products]);

  // Sync settings & broadcast
  useEffect(() => {
    localStorage.setItem('grace_pos_settings', JSON.stringify(shopSettings));
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('grace_pos_cross_tab_sync');
        bc.postMessage({ type: 'SETTINGS_UPDATED', payload: shopSettings });
        bc.close();
      }
    } catch {}
  }, [shopSettings]);

  // Sync transactions & broadcast
  useEffect(() => {
    localStorage.setItem('grace_pos_transactions', JSON.stringify(transactions));
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('grace_pos_cross_tab_sync');
        bc.postMessage({ type: 'TRANSACTIONS_UPDATED', payload: transactions });
        bc.close();
      }
    } catch {}
  }, [transactions]);

  // Persist Active Cart on every addition/removal/quantity change
  useEffect(() => {
    localStorage.setItem('grace_pos_active_cart', JSON.stringify(cart));
  }, [cart]);

  // Persist Cart Discount
  useEffect(() => {
    localStorage.setItem('grace_pos_cart_discount', JSON.stringify(cartDiscount));
  }, [cartDiscount]);

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
          description: item.description || '',
          price: Number(item.price),
          costPrice: Number(item.cost_price || 0),
          stock: Number(item.stock || 0),
          unit: item.unit || 'pcs',
          discount: item.discount || { type: 'percent', value: 0 },
          image: item.image
        }));
        setProducts(prev => {
          const productMap = new Map();
          prev.forEach(p => productMap.set(String(p.barcode) + '_' + String(p.id), p));
          mapped.forEach(p => productMap.set(String(p.barcode) + '_' + String(p.id), p));
          return Array.from(productMap.values());
        });
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

      // Sync transactions from Supabase transactions table
      try {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);

        if (!txError && txData && txData.length > 0) {
          const mappedTxs = txData.map(tx => {
            const rawPhone = tx.customer_phone || (tx.customer_name && tx.customer_name.match(/01[3-9]\d{8}/) ? tx.customer_name.match(/01[3-9]\d{8}/)[0] : '');
            return {
              id: tx.id,
              invoiceNo: tx.invoice_no,
              date: tx.date || '',
              time: tx.time || '',
              timestamp: Number(tx.timestamp) || (tx.created_at ? new Date(tx.created_at).getTime() : Date.now()),
              shopId: tx.shop_id || 'ZAVI',
              servedBy: tx.served_by || 'Cashier',
              customerId: rawPhone || tx.customer_name || '',
              customerName: tx.customer_name || 'Customer',
              customerPhone: rawPhone,
              items: Array.isArray(tx.items) ? tx.items : [],
              totalItemsQty: Number(tx.total_items_qty) || 0,
              subtotal: Number(tx.subtotal) || 0,
              itemSavings: 0,
              discount: Number(tx.discount) || 0,
              vat: Number(tx.vat) || 0,
              netAmount: Number(tx.net_amount) || 0,
              payType: tx.pay_type || 'CASH',
              paidAmount: Number(tx.paid_amount) || Number(tx.net_amount) || 0,
              changeAmount: Number(tx.change_amount) || 0,
              pointsThisInvoice: Number(tx.points_earned) || 0,
              previousPointBalance: 0,
              redeemPoint: Number(tx.points_redeemed) || 0
            };
          });

          setTransactions(prevLocal => {
            const merged = [...mappedTxs];
            prevLocal.forEach(localTx => {
              if (!merged.some(m => m.id === localTx.id || m.invoiceNo === localTx.invoiceNo)) {
                merged.push(localTx);
              }
            });
            merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            return merged;
          });
        }
      } catch (txErr) {
        console.warn("Supabase transactions sync error:", txErr);
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

  const addManualItemToCart = ({ name, price, brand = 'General', category = 'General Grocery', qty = 1, barcode = '', image = '' }) => {
    let maxIdNum = 0;
    products.forEach(p => {
      if (p.id) {
        const match = String(p.id).match(/product-(\d+)/i) || String(p.id).match(/prod-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxIdNum) maxIdNum = n;
        }
      }
    });
    const nextNum = Math.max(products.length + 1, maxIdNum + 1);
    const generatedId = `product-${String(nextNum).padStart(4, '0')}`;
    const nextSl = products.length + 1;
    const cleanBarcode = barcode.trim() || String(Math.floor(8941000000000 + Math.random() * 999999999));
    const newProduct = {
      slNo: nextSl,
      id: generatedId,
      sku: `PRD-${String(nextNum).padStart(4, '0')}`,
      barcode: cleanBarcode,
      name: name.trim(),
      brand: brand.trim() || 'General',
      category: category.trim() || 'General Grocery',
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

  const findProductByBarcodeOrSerial = async (query) => {
    const clean = (query || '').trim().toLowerCase();
    if (!clean) return null;

    // 1. Check local products by Serial / SKU
    const bySl = products.find(p => String(p.slNo) === clean || p.sku?.toLowerCase() === clean);
    if (bySl) return bySl;

    // 2. Check local products by Barcode
    const byBarcode = products.find(p => p.barcode?.toLowerCase() === clean || p.barcode?.endsWith(clean));
    if (byBarcode) return byBarcode;

    // 3. Check local products by Name or Brand
    const byName = products.find(p => p.name?.toLowerCase().includes(clean) || (p.brand && p.brand?.toLowerCase().includes(clean)));
    if (byName) return byName;

    // 4. Query Supabase database system if online
    if (navigator.onLine) {
      try {
        const { data: dbItems, error } = await supabase
          .from('products')
          .select('*')
          .or(`barcode.eq.${clean},barcode.ilike.%${clean}%,sku.ilike.%${clean}%,name.ilike.%${clean}%`)
          .limit(1);

        if (!error && dbItems && dbItems.length > 0) {
          const item = dbItems[0];
          const mapped = {
            id: item.id,
            slNo: item.sl_no || products.length + 1,
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
          };
          setProducts(prev => {
            if (prev.some(p => p.id === mapped.id || p.barcode === mapped.barcode)) return prev;
            return [mapped, ...prev];
          });
          return mapped;
        }
      } catch (err) {
        console.warn("Supabase barcode lookup error:", err);
      }
    }

    return null;
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
    applyBulkDiscount(productIds, { type: 'percent', value: 0 });
  };

  const completeTransaction = ({ 
    payType, 
    paidAmount, 
    note, 
    cardLast4, 
    trxId, 
    customerPhone = '', 
    customerName = 'Walk-in Customer',
    redeemedPoints = 0,
    pointsDiscount = 0,
    includeBag = false,
    bagFee = 20
  }) => {
    let grossSubtotal = 0;
    let totalDiscountedSubtotal = 0;
    let totalItemsQty = cart.reduce((sum, item) => sum + item.qty, 0);

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

    // If customer selected "Bag Koi" -> Yes, add the Shopping Bag item for 20 Taka
    if (includeBag) {
      const bagPrice = Number(bagFee) || 20;
      itemsSummary.push({
        sl: itemsSummary.length + 1,
        id: 'item-bag-20',
        name: 'Shopping Bag (ব্যাগ)',
        brand: 'Swapno',
        barcode: 'BAG-20TK',
        originalPrice: bagPrice,
        price: bagPrice,
        discountBadge: null,
        discountAmount: 0,
        qty: 1,
        total: bagPrice
      });
      grossSubtotal += bagPrice;
      totalDiscountedSubtotal += bagPrice;
      totalItemsQty += 1;
    }

    const itemLevelSavings = grossSubtotal - totalDiscountedSubtotal;

    let additionalCartDiscount = 0;
    if (cartDiscount.type === 'percent') {
      additionalCartDiscount = (totalDiscountedSubtotal * cartDiscount.value) / 100;
    } else {
      additionalCartDiscount = Number(cartDiscount.value) || 0;
    }
    additionalCartDiscount = Math.min(additionalCartDiscount, totalDiscountedSubtotal);

    // Apply loyalty points discount (100 points = 75 Tk)
    const effectivePointsDiscount = Math.min(Number(pointsDiscount) || 0, Math.max(0, totalDiscountedSubtotal - additionalCartDiscount));

    const totalDiscountAll = itemLevelSavings + additionalCartDiscount + effectivePointsDiscount;
    const netPayablePreTax = Math.max(0, totalDiscountedSubtotal - additionalCartDiscount - effectivePointsDiscount);
    const vatAmount = (netPayablePreTax * (shopSettings.vatPercentage || 0)) / 100;
    const netAmount = Math.round((netPayablePreTax + vatAmount) * 100) / 100;

    const actualPaid = payType === 'CASH' ? Number(paidAmount || netAmount) : netAmount;
    const changeAmount = Math.max(0, actualPaid - netAmount);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const newInvoiceNo = generateInvoiceNumber();

    // 100 Taka = 1 Point (3 months validity)
    const earnedPoints = addCustomerPoints(customerPhone, customerName, netAmount, newInvoiceNo);

    // If points were redeemed, deduct from customer ledger
    if (redeemedPoints > 0) {
      redeemCustomerPoints(customerPhone, redeemedPoints);
    }

    const currentPointsInfo = getCustomerPointsInfo(customerPhone);

    const newTx = {
      id: `tx-${Date.now()}`,
      invoiceNo: newInvoiceNo,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      shopId: shopSettings.shopId,
      servedBy: currentUser ? (currentUser.name || currentUser.userId) : (shopSettings.servedBy || "L61627"),
      customerId: customerPhone || activeCustomer.id,
      customerName: customerName || activeCustomer.name,
      customerPhone: customerPhone,
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
      pointsThisInvoice: earnedPoints,
      previousPointBalance: currentPointsInfo.validPoints,
      redeemPoint: redeemedPoints
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
    if (!navigator.onLine) return { success: false, error: 'Offline' };
    try {
      const payload = {
        id: String(p.id),
        sl_no: p.slNo ? Number(p.slNo) : null,
        sku: p.sku || `PRD-${p.id}`,
        barcode: String(p.barcode),
        name: p.name,
        brand: p.brand || 'General',
        category: p.category || 'General Grocery',
        description: p.description || '',
        price: Number(p.price) || 0,
        cost_price: Number(p.costPrice) || 0,
        stock: Number(p.stock) || 0,
        unit: p.unit || 'pcs',
        discount: p.discount || null,
        image: p.image || ''
      };
      const { data, error } = await supabase.from('products').upsert(payload);
      if (error) {
        console.error("Supabase product upsert error:", error);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (err) {
      console.warn("Supabase product upsert skipped:", err);
      return { success: false, error: err };
    }
  };

  const syncAllProductsToSupabase = async (prodList = products) => {
    if (!navigator.onLine) return { success: false, error: 'Offline' };
    try {
      const payloads = prodList.map((p, idx) => ({
        id: String(p.id),
        sl_no: p.slNo ? Number(p.slNo) : idx + 1,
        sku: p.sku || `PRD-${String(idx + 1).padStart(4, '0')}`,
        barcode: String(p.barcode),
        name: p.name,
        brand: p.brand || 'General',
        category: p.category || 'General Grocery',
        description: p.description || '',
        price: Number(p.price) || 0,
        cost_price: Number(p.costPrice) || 0,
        stock: Number(p.stock) || 0,
        unit: p.unit || 'pcs',
        discount: p.discount || null,
        image: p.image || ''
      }));

      const { data, error } = await supabase.from('products').upsert(payloads);
      if (error) {
        console.error("Error syncing all products to Supabase:", error);
        return { success: false, error };
      }
      return { success: true, count: payloads.length };
    } catch (err) {
      console.error("Sync all products failed:", err);
      return { success: false, error: err };
    }
  };

  const syncTransactionToSupabase = async (tx) => {
    if (!navigator.onLine) {
      console.warn("Offline: transaction saved locally.");
      return { success: false, reason: 'offline' };
    }
    try {
      const phoneClean = (tx.customerPhone || tx.customerId || '').trim();
      const customerDisplayName = phoneClean
        ? (tx.customerName && tx.customerName !== 'Walk-in Customer' ? `${tx.customerName} (${phoneClean})` : `Customer (${phoneClean})`)
        : (tx.customerName || 'Walk-in Customer');

      // Base payload with guaranteed columns that exist in any standard transactions table schema
      const basePayload = {
        id: tx.id,
        invoice_no: tx.invoiceNo,
        date: tx.date,
        time: tx.time,
        timestamp: Number(tx.timestamp) || Date.now(),
        shop_id: tx.shopId || 'ZAVI',
        served_by: tx.servedBy || 'Cashier',
        customer_name: customerDisplayName,
        items: tx.items,
        total_items_qty: Number(tx.totalItemsQty) || 0,
        subtotal: Number(tx.subtotal) || 0,
        discount: Number(tx.discount) || 0,
        vat: Number(tx.vat) || 0,
        net_amount: Number(tx.netAmount) || 0,
        pay_type: tx.payType || 'CASH',
        paid_amount: Number(tx.paidAmount) || Number(tx.netAmount) || 0,
        change_amount: Number(tx.changeAmount) || 0
      };

      // Extended payload including customer_phone and points columns
      const extendedPayload = {
        ...basePayload,
        customer_phone: phoneClean || null,
        points_earned: Number(tx.pointsThisInvoice) || 0,
        points_redeemed: Number(tx.redeemPoint) || 0
      };

      // Try inserting with extended columns first
      let { data, error } = await supabase.from('transactions').insert(extendedPayload);

      // If Supabase returns PGRST204 (column does not exist in schema cache), fallback to basePayload
      if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('customer_phone') || error.message?.includes('points'))) {
        console.warn("Retrying transaction insert with base schema:", error.message);
        const retryRes = await supabase.from('transactions').insert(basePayload);
        error = retryRes.error;
        data = retryRes.data;
      }

      if (error) {
        console.error("Supabase transaction insert failed:", error);
        return { success: false, error };
      }

      console.log("Transaction successfully saved to Supabase database!", tx.invoiceNo);
      return { success: true, data };
    } catch (err) {
      console.error("Supabase transaction insert exception:", err);
      return { success: false, error: err };
    }
  };

  const syncCustomerToSupabase = async (phone, customerData) => {
    if (!navigator.onLine || !phone) return;
    try {
      const now = Date.now();
      const validEntries = (customerData.pointsLedger || []).filter(e => e.expiresAt > now && e.points > 0);
      const totalPoints = validEntries.reduce((sum, e) => sum + e.points, 0);

      await supabase.from('customers').upsert({
        phone: String(phone).trim(),
        name: customerData.name || 'Customer',
        total_valid_points: totalPoints,
        points_ledger: validEntries,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Supabase customer points upsert skipped:", err);
    }
  };

  const addProduct = async (newProduct) => {
    // Generate sequential database ID as product-0001, product-0002, etc.
    let maxIdNum = 0;
    products.forEach(p => {
      if (p.id) {
        const match = String(p.id).match(/product-(\d+)/i) || String(p.id).match(/prod-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxIdNum) maxIdNum = n;
        }
      }
    });
    const nextNum = Math.max(products.length + 1, maxIdNum + 1);
    const generatedId = `product-${String(nextNum).padStart(4, '0')}`;
    const nextSl = products.length + 1;

    const created = {
      ...newProduct,
      slNo: nextSl,
      id: newProduct.id || generatedId,
      sku: newProduct.sku || `PRD-${String(nextNum).padStart(4, '0')}`,
      brand: newProduct.brand?.trim() || 'General',
      category: newProduct.category?.trim() || 'General Grocery',
      description: newProduct.description?.trim() || '',
      stock: Number(newProduct.stock) || 0,
      price: Number(newProduct.price) || 0,
      costPrice: Number(newProduct.costPrice) || 0,
      discount: newProduct.discount || { type: 'percent', value: 0 },
      barcode: newProduct.barcode?.trim() || String(Math.floor(8940000000000 + Math.random() * 9999999999)),
      image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
    };
    setProducts(prev => [...prev, created]);
    const syncRes = await syncProductToSupabase(created);
    return { product: created, syncResult: syncRes };
  };

  const updateProduct = async (id, updatedFields) => {
    let updatedObj = null;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          updatedObj = { ...p, ...updatedFields };
          syncProductToSupabase(updatedObj);
          return updatedObj;
        }
        return p;
      })
    );
    return updatedObj;
  };

  const deleteProduct = (id) => {
    // Requirements: No products can be removed/deleted forever from website/database.
    // Instead, if deletion/removal is attempted, set quantity/stock to 0.
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, stock: 0 };
          syncProductToSupabase(updated);
          return updated;
        }
        return p;
      })
    );
    alert("Notice: Products cannot be deleted permanently from the database. Stock has been set to 0 (Out of Stock).");
  };

  // Customer Points Functions (100 Tk = 1 Pt, 3 months validity, 100 Pts = 75 Tk discount)
  const getCustomerPointsInfo = (phone) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 5) {
      return { found: false, validPoints: 0, discountTaka: 0, customerName: '', ledger: [] };
    }
    const customer = customers[cleanPhone];
    if (!customer) {
      return { found: false, validPoints: 0, discountTaka: 0, customerName: '', ledger: [] };
    }
    const now = Date.now();
    const validEntries = (customer.pointsLedger || []).filter(e => e.expiresAt > now && e.points > 0);
    const totalPoints = validEntries.reduce((sum, e) => sum + e.points, 0);
    // 100 points = 75 Taka discount (0.75 Tk per point)
    const discountTaka = Math.round(totalPoints * 0.75 * 100) / 100;
    return {
      found: true,
      phone: cleanPhone,
      customerName: customer.name || 'Customer',
      validPoints: totalPoints,
      discountTaka,
      ledger: validEntries
    };
  };

  const addCustomerPoints = (phone, name, totalAmount, invoiceNo) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 5) return 0;

    // 100 Taka purchase = 1 point
    const earnedPoints = Math.floor(Number(totalAmount || 0) / 100);
    if (earnedPoints <= 0) return 0;

    const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;
    const newEntry = {
      id: `pt-${Date.now()}`,
      points: earnedPoints,
      earnedAt: Date.now(),
      expiresAt: Date.now() + THREE_MONTHS_MS,
      invoiceNo
    };

    setCustomers(prev => {
      const existing = prev[cleanPhone] || { phone: cleanPhone, name: name || 'Customer', pointsLedger: [] };
      const updatedCust = {
        ...existing,
        name: name || existing.name,
        pointsLedger: [...(existing.pointsLedger || []), newEntry]
      };
      syncCustomerToSupabase(cleanPhone, updatedCust);
      return {
        ...prev,
        [cleanPhone]: updatedCust
      };
    });

    return earnedPoints;
  };

  const redeemCustomerPoints = (phone, pointsToRedeem) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const customer = customers[cleanPhone];
    if (!customer || !pointsToRedeem || pointsToRedeem <= 0) return 0;

    let remainingToDeduct = pointsToRedeem;
    const now = Date.now();

    const updatedLedger = (customer.pointsLedger || []).map(entry => {
      if (entry.expiresAt <= now || remainingToDeduct <= 0) return entry;
      if (entry.points <= remainingToDeduct) {
        remainingToDeduct -= entry.points;
        return { ...entry, points: 0 };
      } else {
        const updatedPoints = entry.points - remainingToDeduct;
        remainingToDeduct = 0;
        return { ...entry, points: updatedPoints };
      }
    }).filter(e => e.points > 0);

    const updatedCust = {
      ...customer,
      pointsLedger: updatedLedger
    };

    setCustomers(prev => ({
      ...prev,
      [cleanPhone]: updatedCust
    }));

    syncCustomerToSupabase(cleanPhone, updatedCust);

    // 100 points = 75 Taka discount (0.75 Tk per point)
    return Math.round(pointsToRedeem * 0.75 * 100) / 100;
  };

  // Hold Invoice: Supports up to 5 Multiple Customer Bills (Recall Invoice - 1 to 5)
  const holdInvoice = (meta = {}) => {
    if (cart.length === 0) {
      alert("Current invoice has no items to hold.");
      return null;
    }
    if (heldInvoices.length >= 5) {
      alert("Maximum 5 Recall Invoices reached! Please recall and finish or void an existing held customer bill first.");
      return null;
    }

    // Find first available slot between 1 and 5
    const existingSlots = heldInvoices.map(h => h.slot);
    let chosenSlot = 1;
    for (let s = 1; s <= 5; s++) {
      if (!existingSlots.includes(s)) {
        chosenSlot = s;
        break;
      }
    }

    const itemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
    let billTotal = 0;
    cart.forEach(item => {
      const p = getProductPricing(item.product);
      billTotal += p.finalPrice * item.qty;
    });

    const newHold = {
      slot: chosenSlot,
      title: `Recall Invoice - ${chosenSlot}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itemsCount,
      total: billTotal,
      cart: [...cart],
      cartDiscount,
      customerPhone: meta.customerPhone || '',
      customerName: meta.customerName || `Customer (Slot ${chosenSlot})`
    };

    setHeldInvoices(prev => [...prev, newHold].sort((a, b) => a.slot - b.slot));
    clearCart();
    return newHold;
  };

  // Recall Invoice: Restores specified slot (1 to 5) back to active bill
  const recallInvoice = (slotNumber) => {
    if (heldInvoices.length === 0) {
      alert("No held invoices available.");
      return null;
    }

    const target = heldInvoices.find(h => h.slot === Number(slotNumber)) || heldInvoices[0];
    if (!target) {
      alert("No held invoice found in Recall Slot: " + slotNumber);
      return null;
    }

    // Restore to cart
    setCart(target.cart);
    if (target.cartDiscount) setCartDiscount(target.cartDiscount);
    // Release the slot
    setHeldInvoices(prev => prev.filter(h => h.slot !== target.slot));
    return target;
  };

  const reprintLastInvoice = () => {
    if (transactions.length > 0) {
      setSelectedReceipt(transactions[0]);
    } else {
      alert("No recent invoices found to reprint.");
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
        heldInvoices,
        holdInvoice,
        recallInvoice,
        reprintLastInvoice,
        customers,
        getCustomerPointsInfo,
        addCustomerPoints,
        redeemCustomerPoints,
        cartDiscount,
        setCartDiscount,
        activeCustomer,
        setActiveCustomer,
        completeTransaction,
        selectedReceipt,
        setSelectedReceipt,
        findProductByBarcodeOrSerial,
        viewMode,
        setViewMode,
        openStoreWindow,
        openPosWindow,
        activeTab,
        setActiveTab,
        isOnline,
        supabaseStatus,
        syncWithSupabase,
        syncProductToSupabase,
        syncAllProductsToSupabase,
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
