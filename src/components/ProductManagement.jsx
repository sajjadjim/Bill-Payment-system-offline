import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProductPricing } from '../utils/pricing';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Barcode, 
  Printer, 
  Upload, 
  Check, 
  X, 
  Download, 
  RefreshCw,
  Database,
  Building2,
  Percent,
  Tag,
  CheckSquare,
  Square,
  Sparkles,
  LayoutGrid,
  Rows,
  Columns,
  Eye,
  FileText,
  Info,
  ShoppingCart
} from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function ProductManagement({ isAddModalOpen, setIsAddModalOpen }) {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    applyBulkDiscount,
    clearBulkDiscount,
    resetToSampleData, 
    shopSettings,
    compressProductImage,
    syncWithSupabase,
    syncAllProductsToSupabase,
    SUPABASE_SETUP_SQL,
    isAdmin,
    setActiveTab,
    addToCart
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');

  // View Layout State (Row / Table, Grid Cards, Column Compact List)
  const [viewLayout, setViewLayout] = useState(() => {
    try {
      return localStorage.getItem('grace_pos_product_view_layout') || 'row';
    } catch {
      return 'row';
    }
  });

  useEffect(() => {
    localStorage.setItem('grace_pos_product_view_layout', viewLayout);
  }, [viewLayout]);

  // Modal States
  const [editingProduct, setEditingProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [barcodePrintProduct, setBarcodePrintProduct] = useState(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isSyncingToDb, setIsSyncingToDb] = useState(false);
  const [dbSyncMsg, setDbSyncMsg] = useState(null);

  const handleSyncAllToDb = async () => {
    setIsSyncingToDb(true);
    setDbSyncMsg(null);
    try {
      const res = await syncAllProductsToSupabase(products);
      if (res?.success) {
        setDbSyncMsg(`Success: All ${res.count || products.length} products stored in Supabase Database!`);
      } else {
        setDbSyncMsg(`Sync status: ${res?.error?.message || 'Completed'}`);
      }
    } catch (e) {
      setDbSyncMsg(`Sync error: ${e.message}`);
    } finally {
      setIsSyncingToDb(false);
      setTimeout(() => setDbSyncMsg(null), 5000);
    }
  };

  // Multi-Selection State for Bulk Discounting (Persisted across hard refreshes!)
  const [selectedProductIds, setSelectedProductIds] = useState(() => {
    try {
      const saved = localStorage.getItem('grace_pos_selected_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('grace_pos_selected_product_ids', JSON.stringify(selectedProductIds));
  }, [selectedProductIds]);

  const [bulkDiscountType, setBulkDiscountType] = useState('percent');
  const [bulkDiscountValue, setBulkDiscountValue] = useState('10');

  // Standard & dynamic categories/brands
  const DEFAULT_CATEGORIES = [
    'Grocery & Grains',
    'Dairy & Eggs',
    'Beverages & Cold Drinks',
    'Snacks & Confectionery',
    'Cooking Essentials & Spices',
    'Personal Care & Hygiene',
    'Household & Cleaning',
    'Bakery & Biscuits',
    'Baby Food & Care',
    'Fresh Produce & Fruits',
    'Meat & Fish'
  ];

  const DEFAULT_BRANDS = [
    'Pran',
    'Aarong',
    'Akij',
    'Fresh',
    'Square',
    'City Group',
    'Teer',
    'Unilever',
    'Nestle',
    'Arla',
    'Olympic',
    'Radhuni',
    'Ruchi',
    'Dano',
    'Kazi Farms',
    'General'
  ];

  const availableCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...products.map(p => p.category).filter(Boolean)]));
  const availableBrands = Array.from(new Set([...DEFAULT_BRANDS, ...products.map(p => p.brand).filter(Boolean)]));

  // Form State for Adding / Editing (Including Description & Brand)
  const [formData, setFormData] = useState({
    name: '',
    brand: 'General',
    isCustomBrand: false,
    barcode: '',
    category: 'Grocery & Grains',
    isCustomCategory: false,
    description: '',
    price: '',
    costPrice: '',
    stock: '',
    unit: 'pcs',
    discountType: 'percent',
    discountValue: '0',
    image: ''
  });

  const [imageMeta, setImageMeta] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const categories = ['All', ...availableCategories];
  const brands = ['All', ...availableBrands];

  const filteredProducts = products.filter(p => {
    const matchesBrand = filterBrand === 'All' || p.brand === filterBrand;
    const matchesCat = filterCategory === 'All' || p.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.barcode.toLowerCase().includes(q) ||
      String(p.slNo) === q ||
      p.sku?.toLowerCase().includes(q);
    return matchesBrand && matchesCat && matchesQuery;
  });

  // Multi-select helpers
  const handleToggleSelectProduct = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  // Select all products belonging to a specific company in 1 click
  const handleSelectByCompany = (companyName) => {
    const matchingIds = products.filter(p => p.brand?.toLowerCase() === companyName.toLowerCase()).map(p => p.id);
    setSelectedProductIds(matchingIds);
  };

  // Apply discount to all selected products in 1 click
  const handleApplyBulkDiscount = () => {
    if (!isAdmin) {
      alert("Permission Denied: Only Administrator can apply bulk discounts.");
      return;
    }
    if (selectedProductIds.length === 0) return;
    const val = Number(bulkDiscountValue) || 0;
    applyBulkDiscount(selectedProductIds, {
      type: bulkDiscountType,
      value: val
    });
    alert(`Successfully applied ${val}${bulkDiscountType === 'percent' ? '% OFF' : ' Tk OFF'} to ${selectedProductIds.length} products!`);
  };

  const handleClearBulkDiscount = () => {
    if (!isAdmin) {
      alert("Permission Denied: Only Administrator can modify product discounts.");
      return;
    }
    if (selectedProductIds.length === 0) return;
    clearBulkDiscount(selectedProductIds);
    alert(`Discounts removed from ${selectedProductIds.length} products.`);
  };

  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert("Permission Denied: Only Administrator can add new products.");
      return;
    }
    setFormData({
      name: '',
      brand: 'General',
      isCustomBrand: false,
      barcode: '', // User writes or scans barcode; never auto-generated by default
      category: 'Grocery & Grains',
      isCustomCategory: false,
      description: '',
      price: '',
      costPrice: '',
      stock: '50',
      unit: 'pcs',
      discountType: 'percent',
      discountValue: '0',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
    });
    setImageMeta(null);
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    if (!isAdmin) {
      alert("Permission Denied: Only Administrator can edit products or change stock quantities.");
      return;
    }
    const isCustomCat = !availableCategories.includes(product.category);
    const isCustomBr = !availableBrands.includes(product.brand);
    setFormData({
      name: product.name,
      brand: product.brand || 'General',
      isCustomBrand: isCustomBr,
      barcode: product.barcode,
      category: product.category || 'General Grocery',
      isCustomCategory: isCustomCat,
      description: product.description || '',
      price: String(product.price),
      costPrice: String(product.costPrice || ''),
      stock: String(product.stock),
      unit: product.unit || 'pcs',
      discountType: product.discount?.type || 'percent',
      discountValue: String(product.discount?.value || '0'),
      image: product.image || ''
    });
    setImageMeta(null);
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressProductImage(file, 150 * 1024);
      setImageMeta(compressed);
      setFormData(prev => ({ ...prev, image: compressed.dataUrl }));
    } catch {
      alert("Error compressing image.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert("Please provide product name and selling price.");
      return;
    }

    const cleanBarcode = formData.barcode.trim();
    if (!cleanBarcode) {
      alert("Please scan or enter product barcode, or click 'Auto-Generate Barcode'.");
      return;
    }

    const discountObj = {
      type: formData.discountType,
      value: Number(formData.discountValue || 0)
    };

    const finalBrand = formData.brand.trim() || 'General';
    const finalCategory = formData.category.trim() || 'General Grocery';

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        brand: finalBrand,
        barcode: cleanBarcode,
        category: finalCategory,
        description: formData.description?.trim() || '',
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        unit: formData.unit,
        discount: discountObj,
        image: formData.image
      });
      setDbSyncMsg(`Product "${formData.name}" updated & saved to Database!`);
    } else {
      const res = await addProduct({
        name: formData.name.trim(),
        brand: finalBrand,
        barcode: cleanBarcode,
        category: finalCategory,
        description: formData.description?.trim() || '',
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        unit: formData.unit,
        discount: discountObj,
        image: formData.image
      });
      const prodId = res?.product?.id || 'New Product';
      setDbSyncMsg(`New product "${formData.name}" (ID: ${prodId}) added & stored to Database!`);
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
    setImageMeta(null);
    setTimeout(() => setDbSyncMsg(null), 4000);
  };

  const handleGenerateBarcode = () => {
    const randomEan = '894' + Math.floor(1000000000 + Math.random() * 9000000000);
    setFormData(prev => ({ ...prev, barcode: randomEan }));
  };

  const exportProductsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `products_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={22} color="#15803d" />
            <span>Product Catalog, Brands & Bulk Discounts</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Manage {products.length} products, filter by company (Pran, Aarong, Akij), and click any product to view in-depth details
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('pos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#15803d',
              border: 'none',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Return to POS Billing [F1]"
          >
            <span>🛒 ← Return to POS Terminal [F1]</span>
          </button>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Database size={15} />
            <span>Supabase SQL</span>
          </button>

          <button
            onClick={exportProductsJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            <span>Export Backup</span>
          </button>

          <button
            onClick={handleSyncAllToDb}
            disabled={isSyncingToDb}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isSyncingToDb ? '#94a3b8' : '#15803d',
              border: 'none',
              color: '#ffffff',
              padding: '9px 15px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: isSyncingToDb ? 'wait' : 'pointer'
            }}
            title="Upload/Sync all catalog products to Supabase Database"
          >
            <Upload size={16} />
            <span>{isSyncingToDb ? 'Syncing to DB...' : 'Sync All to Database'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#15803d',
              border: 'none',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Plus size={17} />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {dbSyncMsg && (
        <div style={{
          background: '#f0fdf4',
          border: '1.5px solid #15803d',
          color: '#15803d',
          padding: '10px 16px',
          borderRadius: '8px',
          fontWeight: 800,
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={18} color="#15803d" />
          <span>{dbSyncMsg}</span>
        </div>
      )}

      {/* MULTI-PRODUCT BULK DISCOUNT TOOLBAR */}
      {(selectedProductIds.length > 0 || isAdmin) && (
        <div style={{
          background: selectedProductIds.length > 0 ? '#f0fdf4' : '#ffffff',
          border: selectedProductIds.length > 0 ? '1.5px solid #15803d' : '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={18} color="#15803d" />
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                Multi-Product Discount Engine:
              </strong>
            </div>

            <span style={{
              background: selectedProductIds.length > 0 ? '#15803d' : '#f1f5f9',
              color: selectedProductIds.length > 0 ? '#ffffff' : '#64748b',
              fontSize: '11.5px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '12px'
            }}>
              {selectedProductIds.length} items selected
            </span>

            {/* Quick Select by Company */}
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick Select:</span>
              {['Pran', 'Aarong', 'Akij', 'Fresh'].map(comp => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => handleSelectByCompany(comp)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#15803d',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  All {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Value Input & Apply */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <button
                type="button"
                onClick={() => setBulkDiscountType('percent')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: bulkDiscountType === 'percent' ? '#15803d' : 'transparent',
                  color: bulkDiscountType === 'percent' ? '#ffffff' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                % OFF
              </button>
              <button
                type="button"
                onClick={() => setBulkDiscountType('flat')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: bulkDiscountType === 'flat' ? '#15803d' : 'transparent',
                  color: bulkDiscountType === 'flat' ? '#ffffff' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tk OFF
              </button>
            </div>

            <input
              type="number"
              min="0"
              placeholder="10"
              value={bulkDiscountValue}
              onChange={(e) => setBulkDiscountValue(e.target.value)}
              style={{
                width: '65px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 700,
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                outline: 'none'
              }}
            />

            <button
              type="button"
              onClick={handleApplyBulkDiscount}
              disabled={selectedProductIds.length === 0}
              style={{
                background: selectedProductIds.length > 0 ? '#15803d' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: selectedProductIds.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Tag size={13} />
              <span>Apply to {selectedProductIds.length} Items</span>
            </button>

            {selectedProductIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearBulkDiscount}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Remove Discount
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar with Company Selector & VIEW SWITCHER (Row, Grid, Column) */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '11px', top: '9px' }} />
          <input
            type="text"
            placeholder="Search name, barcode, or company (Pran, Aarong, Akij)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Company / Brand Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={16} color="#15803d" />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Brand:</span>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '7px 10px',
              color: '#0f172a',
              fontSize: '12.5px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Category Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '7px 10px',
              color: '#0f172a',
              fontSize: '12.5px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* VIEW LAYOUT TOGGLE BUTTONS: Row, Grid, Column */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <button
            type="button"
            onClick={() => setViewLayout('row')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '5px',
              border: 'none',
              background: viewLayout === 'row' ? '#ffffff' : 'transparent',
              color: viewLayout === 'row' ? '#15803d' : '#64748b',
              fontWeight: viewLayout === 'row' ? 700 : 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: viewLayout === 'row' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
            title="Row / Table View"
          >
            <Rows size={13} />
            <span>Row View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewLayout('grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '5px',
              border: 'none',
              background: viewLayout === 'grid' ? '#ffffff' : 'transparent',
              color: viewLayout === 'grid' ? '#15803d' : '#64748b',
              fontWeight: viewLayout === 'grid' ? 700 : 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: viewLayout === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
            title="Grid / Cards View"
          >
            <LayoutGrid size={13} />
            <span>Grid View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewLayout('column')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '5px',
              border: 'none',
              background: viewLayout === 'column' ? '#ffffff' : 'transparent',
              color: viewLayout === 'column' ? '#15803d' : '#64748b',
              fontWeight: viewLayout === 'column' ? 700 : 600,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: viewLayout === 'column' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
            title="Column / Compact Cards View"
          >
            <Columns size={13} />
            <span>Column View</span>
          </button>
        </div>

        <button
          onClick={resetToSampleData}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: 'auto'
          }}
          title="Reset to default items from the receipt photo"
        >
          <RefreshCw size={12} />
          <span>Reset Sample Data</span>
        </button>
      </div>

      {/* ========================================================
          1. ROW VIEW (TABULAR DATA ROWS)
      ======================================================== */}
      {viewLayout === 'row' && (
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
                  <th style={{ padding: '10px 14px', width: '38px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                      onChange={handleSelectAllFiltered}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '10px 10px', width: '45px' }}>SL#</th>
                  <th style={{ padding: '10px 10px', width: '55px' }}>Photo</th>
                  <th style={{ padding: '10px 14px' }}>Product Name</th>
                  <th style={{ padding: '10px 14px' }}>Company / Brand</th>
                  <th style={{ padding: '10px 14px' }}>Barcode</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Main Price</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Discount / Offer</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>After Discount</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLow = p.stock <= 10;
                    const isRealImage = p.image && (p.image.startsWith('http') || p.image.startsWith('data:'));
                    const pricing = getProductPricing(p);
                    const isSelected = selectedProductIds.includes(p.id);

                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isSelected ? '#f0fdf4' : 'transparent',
                          transition: 'background 0.12s'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectProduct(p.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>

                        {/* Serial Number */}
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#15803d',
                            background: '#f0fdf4',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            border: '1px solid #bbf7d0'
                          }}>
                            #{p.slNo}
                          </span>
                        </td>

                        {/* Photo (clickable to open details) */}
                        <td style={{ padding: '10px 10px' }}>
                          <div 
                            onClick={() => setDetailProduct(p)}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Click to view full specifications"
                          >
                            {isRealImage ? (
                              <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '18px' }}>{p.image || '📦'}</span>
                            )}
                          </div>
                        </td>

                        {/* Product Name (clickable to open details) */}
                        <td style={{ padding: '10px 14px' }}>
                          <div 
                            onClick={() => setDetailProduct(p)}
                            style={{ cursor: 'pointer' }}
                            title="Click to open full product details & description"
                          >
                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '13px' }}>{p.name}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Unit: {p.unit || 'pcs'} • {p.category}</span>
                            {p.description && (
                              <span style={{ fontSize: '10.5px', color: '#15803d', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                                📝 {p.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Company / Brand Badge (from database brand column) */}
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            background: '#f0fdf4',
                            color: '#15803d',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #bbf7d0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Building2 size={12} />
                            <span>{p.brand || 'General'}</span>
                          </span>
                        </td>

                        {/* Barcode */}
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#64748b' }}>
                            {p.barcode}
                          </span>
                        </td>

                        {/* Main / Original Price (Before Discount) */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: pricing.hasDiscount ? '#94a3b8' : '#0f172a', textDecoration: pricing.hasDiscount ? 'line-through' : 'none' }}>
                          Tk {pricing.originalPrice.toFixed(0)}
                        </td>

                        {/* Discount / Offer Badge */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          {pricing.hasDiscount ? (
                            <span style={{
                              background: '#fee2e2',
                              color: '#e11d48',
                              border: '1px solid #fecaca',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              🔥 {pricing.badge}
                            </span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '11px' }}>—</span>
                          )}
                        </td>

                        {/* After Discount Price */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                          Tk {pricing.finalPrice.toFixed(0)}
                        </td>

                        {/* Stock Quantity */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#f8fafc',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#475569'
                                }}
                                title="Decrease Stock (-1)"
                              >
                                -
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (!isAdmin) return;
                                const newQty = prompt(`Edit Stock Quantity for ${p.name}:`, p.stock);
                                if (newQty !== null && !isNaN(Number(newQty))) {
                                  updateProduct(p.id, { stock: Math.max(0, parseInt(newQty, 10)) });
                                }
                              }}
                              style={{
                                background: p.stock <= 0 ? '#fee2e2' : isLow ? '#fef3c7' : '#f0fdf4',
                                color: p.stock <= 0 ? '#dc2626' : isLow ? '#d97706' : '#15803d',
                                border: `1px solid ${p.stock <= 0 ? '#fecaca' : isLow ? '#fde68a' : '#bbf7d0'}`,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: isAdmin ? 'pointer' : 'default',
                                minWidth: '40px'
                              }}
                              title="Stock quantity"
                            >
                              {p.stock <= 0 ? '0 (স্টক শেষ)' : p.stock}
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => updateProduct(p.id, { stock: p.stock + 1 })}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  background: '#f8fafc',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#475569'
                                }}
                                title="Increase Stock (+1)"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions: View In-Depth Details & Edit */}
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setDetailProduct(p)}
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#0f172a',
                                padding: '6px 10px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                                fontSize: '11.5px'
                              }}
                              title="View In-Depth Information & Description"
                            >
                              <Eye size={13} color="#15803d" />
                              <span>Details</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleOpenEdit(p)}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  color: '#334155',
                                  padding: '6px 10px',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700,
                                  fontSize: '11.5px'
                                }}
                                title="Edit Product Details, Price, or Stock"
                              >
                                <Edit3 size={13} />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          2. GRID VIEW (VISUAL PRODUCT CARDS)
      ======================================================== */}
      {viewLayout === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '16px'
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', background: '#ffffff', borderRadius: '10px', color: '#94a3b8' }}>
              No products found matching your search.
            </div>
          ) : (
            filteredProducts.map(p => {
              const isLow = p.stock <= 10;
              const isOutOfStock = p.stock <= 0;
              const isRealImage = p.image && (p.image.startsWith('http') || p.image.startsWith('data:'));
              const pricing = getProductPricing(p);
              const isSelected = selectedProductIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  style={{
                    background: '#ffffff',
                    border: isSelected ? '2px solid #15803d' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  {/* Card Header: Checkbox & Brand Badge */}
                  <div style={{
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectProduct(p.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        #{p.slNo}
                      </span>
                    </label>

                    {/* Brand Badge from database brand column */}
                    <span style={{
                      background: '#f0fdf4',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #bbf7d0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Building2 size={11} />
                      <span>{p.brand || 'General'}</span>
                    </span>
                  </div>

                  {/* Product Image Preview */}
                  <div 
                    onClick={() => setDetailProduct(p)}
                    style={{
                      height: '160px',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                    title="Click to view in-depth details"
                  >
                    {isRealImage ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '48px' }}>{p.image || '📦'}</span>
                    )}

                    {pricing.hasDiscount && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: '#e11d48',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        🔥 {pricing.badge}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      {p.category}
                    </span>

                    <h4 
                      onClick={() => setDetailProduct(p)}
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: 0,
                        cursor: 'pointer',
                        lineHeight: 1.3,
                        minHeight: '35px'
                      }}
                      title="Click to view details"
                    >
                      {p.name}
                    </h4>

                    {p.description && (
                      <p style={{
                        fontSize: '11px',
                        color: '#475569',
                        margin: '2px 0 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {p.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto', paddingTop: '4px' }}>
                      <Barcode size={13} color="#94a3b8" />
                      <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {p.barcode}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                      <div>
                        {pricing.hasDiscount && (
                          <span style={{ fontSize: '11.5px', color: '#94a3b8', textDecoration: 'line-through', marginRight: '6px', fontFamily: 'var(--font-mono)' }}>
                            Tk {pricing.originalPrice.toFixed(0)}
                          </span>
                        )}
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                          Tk {pricing.finalPrice.toFixed(0)}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isOutOfStock ? '#fee2e2' : isLow ? '#fef3c7' : '#f0fdf4',
                        color: isOutOfStock ? '#dc2626' : isLow ? '#d97706' : '#15803d'
                      }}>
                        {isOutOfStock ? '0 in stock' : `${p.stock} ${p.unit || 'pcs'}`}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Details & Edit Buttons */}
                  <div style={{
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    gap: '6px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setDetailProduct(p)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        padding: '6px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Eye size={13} color="#15803d" />
                      <span>Details</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '6px',
                          borderRadius: '5px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          3. COLUMN VIEW (HIGH-DENSITY COMPACT CARDS)
      ======================================================== */}
      {viewLayout === 'column' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '12px'
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', background: '#ffffff', borderRadius: '10px', color: '#94a3b8' }}>
              No products found matching your search.
            </div>
          ) : (
            filteredProducts.map(p => {
              const isLow = p.stock <= 10;
              const isOutOfStock = p.stock <= 0;
              const isRealImage = p.image && (p.image.startsWith('http') || p.image.startsWith('data:'));
              const pricing = getProductPricing(p);
              const isSelected = selectedProductIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  style={{
                    background: '#ffffff',
                    border: isSelected ? '2px solid #15803d' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectProduct(p.id)}
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Thumbnail Photo */}
                  <div
                    onClick={() => setDetailProduct(p)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Click to view details"
                  >
                    {isRealImage ? (
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '24px' }}>{p.image || '📦'}</span>
                    )}
                  </div>

                  {/* Middle Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {/* Brand from database brand column */}
                      <span style={{
                        background: '#f0fdf4',
                        color: '#15803d',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        border: '1px solid #bbf7d0'
                      }}>
                        {p.brand || 'General'}
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                        #{p.slNo}
                      </span>
                      {pricing.hasDiscount && (
                        <span style={{
                          background: '#fee2e2',
                          color: '#e11d48',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px'
                        }}>
                          🔥 {pricing.badge}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => setDetailProduct(p)}
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 2px 0',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title="Click to view details"
                    >
                      {p.name}
                    </h4>

                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{p.barcode}</span>
                      <span>•</span>
                      <span>Stock: <strong style={{ color: isOutOfStock ? '#dc2626' : isLow ? '#d97706' : '#15803d' }}>{p.stock}</strong> {p.unit || 'pcs'}</span>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      {pricing.hasDiscount && (
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through', display: 'block', fontFamily: 'var(--font-mono)' }}>
                          Tk {pricing.originalPrice.toFixed(0)}
                        </span>
                      )}
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                        Tk {pricing.finalPrice.toFixed(0)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setDetailProduct(p)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="View In-Depth Specifications"
                      >
                        <Eye size={12} color="#15803d" />
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Edit Product"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 950,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            maxWidth: '540px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {editingProduct ? 'Edit Product & Specifications' : 'Add New Product to Inventory'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pran Frooto Mango Juice 250ml"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Company / Brand: Select option + Write option */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Company / Brand *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isCustomBrand: !prev.isCustomBrand }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '0'
                      }}
                      title="Switch between dropdown selection and writing custom brand"
                    >
                      {formData.isCustomBrand ? '📋 Select list' : '✏️ + Write Brand'}
                    </button>
                  </div>
                  {formData.isCustomBrand ? (
                    <input
                      type="text"
                      required
                      placeholder="Type brand name (e.g. Pran, Aarong, Akij)"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      style={{
                        width: '100%',
                        background: '#f0fdf4',
                        border: '1.5px solid #15803d',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#0f172a',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <select
                      value={formData.brand}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setFormData(prev => ({ ...prev, isCustomBrand: true, brand: '' }));
                        } else {
                          setFormData(prev => ({ ...prev, brand: e.target.value }));
                        }
                      }}
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#0f172a',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {availableBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="__NEW__">✨ + Write New Brand...</option>
                    </select>
                  )}
                </div>

                {/* Category: Select option + Write option */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isCustomCategory: !prev.isCustomCategory }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '0'
                      }}
                      title="Switch between dropdown selection and writing custom category"
                    >
                      {formData.isCustomCategory ? '📋 Select list' : '✏️ + Write Category'}
                    </button>
                  </div>
                  {formData.isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Type category name (e.g. Dairy & Eggs)"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      style={{
                        width: '100%',
                        background: '#f0fdf4',
                        border: '1.5px solid #15803d',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#0f172a',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setFormData(prev => ({ ...prev, isCustomCategory: true, category: '' }));
                        } else {
                          setFormData(prev => ({ ...prev, category: e.target.value }));
                        }
                      }}
                      style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#0f172a',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW__">✨ + Write New Category...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Barcode */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Barcode (Scan with scanner or enter manually) *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Generate a random barcode only if the product has no physical barcode"
                  >
                    ⚡ Auto-Generate Barcode
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Scan barcode with scanner or type barcode manually..."
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#0f172a',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              {/* NEW FIELD: Product Description & Specifications */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Product Description / বিবরন (Details, Specs, Ingredients)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter product description, ingredients, weight/volume specifications, or usage instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Price & Discount Settings */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Main Selling Price (Tk) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="e.g. 120"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1.5px solid #15803d',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#15803d',
                        fontSize: '14px',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Cost Price (Tk)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 100"
                      value={formData.costPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#0f172a',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Discount settings */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#e11d48' }}>
                    Special Offer / Discount:
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, discountType: 'percent' }))}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: formData.discountType === 'percent' ? '#e11d48' : '#e2e8f0',
                        color: formData.discountType === 'percent' ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      % OFF
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, discountType: 'flat' }))}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: formData.discountType === 'flat' ? '#e11d48' : '#e2e8f0',
                        color: formData.discountType === 'flat' ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Flat Tk OFF
                    </button>
                  </div>

                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    style={{
                      width: '75px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Photo Upload with under 150KB auto-compression */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Real Photo (Auto-compressed &lt; 150 KB)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '6px',
                    padding: '10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#475569',
                    fontWeight: 600
                  }}>
                    <Upload size={15} color="#15803d" />
                    <span>{isCompressing ? 'Compressing under 150 KB...' : 'Upload Real Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {formData.image && (
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid #15803d',
                      background: '#ffffff'
                    }}>
                      <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: '#0f172a',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Unit of Measure
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: '#0f172a',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="pkt">Packet (pkt)</option>
                    <option value="bot">Bottle (bot)</option>
                    <option value="pot">Pot / Cup</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gm">Gram (gm)</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                    background: '#15803d',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingProduct ? 'Save Changes' : 'Save to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Depth Product Details Modal (Showing Brand from DB & Description Field) */}
      {detailProduct && (
        <ProductDetailsModal
          product={detailProduct}
          shopName={shopSettings.shopName}
          onClose={() => setDetailProduct(null)}
          onEdit={() => {
            const p = detailProduct;
            setDetailProduct(null);
            handleOpenEdit(p);
          }}
          onPrintBarcode={() => {
            const p = detailProduct;
            setDetailProduct(null);
            setBarcodePrintProduct(p);
          }}
          onAddToCart={() => {
            addToCart(detailProduct, 1);
            alert(`"${detailProduct.name}" added to POS Cart!`);
          }}
          onUpdateStock={(newStock) => {
            updateProduct(detailProduct.id, { stock: newStock });
            setDetailProduct(prev => prev ? { ...prev, stock: newStock } : null);
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* Supabase SQL Modal */}
      {isSqlModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            maxWidth: '650px',
            width: '100%',
            padding: '20px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="#15803d" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Supabase Database Setup (Copy & Run SQL)
                </h3>
              </div>
              <button onClick={() => setIsSqlModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <textarea
              readOnly
              value={SUPABASE_SETUP_SQL.trim()}
              style={{
                width: '100%',
                height: '240px',
                background: '#0f172a',
                color: '#34d399',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                outline: 'none',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                ✓ Connected to bbmfbdxuvptemeewadnq.supabase.co
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SETUP_SQL.trim());
                    alert("SQL copied to clipboard!");
                  }}
                  style={{
                    background: '#15803d',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Copy SQL Script
                </button>
                <button
                  onClick={() => {
                    syncWithSupabase();
                    setIsSqlModalOpen(false);
                  }}
                  style={{
                    background: '#166534',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Sticker Print Modal */}
      {barcodePrintProduct && (
        <BarcodeLabelModal
          product={barcodePrintProduct}
          shopName={shopSettings.shopName}
          onClose={() => setBarcodePrintProduct(null)}
        />
      )}
    </div>
  );
}

/**
 * In-Depth Product Details Modal Component
 * Displays product image, brand from database brand column, barcode SVG,
 * pricing breakdown, stock levels, and the newly added description field!
 */
function ProductDetailsModal({ 
  product, 
  shopName, 
  onClose, 
  onEdit, 
  onPrintBarcode, 
  onAddToCart, 
  onUpdateStock,
  isAdmin 
}) {
  const barcodeSvgRef = useRef(null);
  const pricing = getProductPricing(product);

  useEffect(() => {
    if (barcodeSvgRef.current && product?.barcode) {
      try {
        JsBarcode(barcodeSvgRef.current, product.barcode, {
          format: "CODE128",
          width: 1.8,
          height: 44,
          displayValue: true,
          fontSize: 13,
          margin: 4
        });
      } catch (err) {
        console.error("Barcode render error:", err);
      }
    }
  }, [product]);

  const isRealImage = product.image && (product.image.startsWith('http') || product.image.startsWith('data:'));
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;
  const marginPerUnit = product.costPrice ? (pricing.finalPrice - product.costPrice).toFixed(2) : null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 990,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '92vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d'
            }}>
              <Info size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Product In-Depth Specifications
              </h3>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Database ID: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{product.id}</strong> • SL #{product.slNo}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px' }}>
            {/* Left Column: Image & Barcode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                width: '100%',
                height: '220px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {isRealImage ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#ffffff' }}
                  />
                ) : (
                  <span style={{ fontSize: '64px' }}>{product.image || '📦'}</span>
                )}
                {pricing.hasDiscount && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: '#e11d48',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}>
                    🔥 {pricing.badge}
                  </div>
                )}
              </div>

              {/* Barcode Preview & Print */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg ref={barcodeSvgRef} style={{ maxWidth: '100%' }}></svg>
                <button
                  type="button"
                  onClick={onPrintBarcode}
                  style={{
                    marginTop: '4px',
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '6px',
                    borderRadius: '5px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <Printer size={13} />
                  <span>Print Shelf Label</span>
                </button>
              </div>
            </div>

            {/* Right Column: Detailed Specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  {/* Brand Name directly from database brand column */}
                  <span style={{
                    background: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <Building2 size={13} />
                    <span>Brand: {product.brand || 'General'}</span>
                  </span>

                  <span style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600
                  }}>
                    {product.category || 'General Grocery'}
                  </span>

                  <span style={{
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '11.5px',
                    fontWeight: 600
                  }}>
                    Unit: <strong>{product.unit || 'pcs'}</strong>
                  </span>
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                  {product.name}
                </h2>
              </div>

              {/* Pricing Grid */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Regular Selling Price:</span>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: pricing.hasDiscount ? '#94a3b8' : '#0f172a',
                    textDecoration: pricing.hasDiscount ? 'line-through' : 'none',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Tk {pricing.originalPrice.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 700, display: 'block' }}>Customer Billing Price:</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                    Tk {pricing.finalPrice.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Active Offer / Discount:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: pricing.hasDiscount ? '#e11d48' : '#64748b' }}>
                    {pricing.hasDiscount ? `${pricing.badge} (Save Tk ${pricing.discountAmount.toFixed(2)})` : 'None (Regular Price)'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Stock Purchase Cost:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                    {product.costPrice ? `Tk ${Number(product.costPrice).toFixed(2)}` : 'N/A'}
                    {marginPerUnit && (
                      <span style={{ fontSize: '11px', color: '#15803d', marginLeft: '6px' }}>
                        (Profit: +Tk {marginPerUnit})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Stock Inventory Status */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={16} color="#475569" />
                  <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>Current Available Stock:</span>
                  <strong style={{
                    fontSize: '13px',
                    color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#15803d'
                  }}>
                    {isOutOfStock ? '0 (Out of Stock)' : `${product.stock} ${product.unit || 'pcs'}`}
                  </strong>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => onUpdateStock(Math.max(0, product.stock - 1))}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '13px'
                      }}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const val = prompt(`Set Stock Quantity for ${product.name}:`, product.stock);
                        if (val !== null && !isNaN(Number(val))) {
                          onUpdateStock(Math.max(0, parseInt(val, 10)));
                        }
                      }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Set Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStock(product.stock + 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '13px'
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Product Description Field (New Field Display) */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                  <FileText size={15} color="#15803d" />
                  <strong style={{ fontSize: '12.5px' }}>Product Description / বিবরন</strong>
                </div>
                <div style={{
                  fontSize: '12.5px',
                  color: product.description ? '#334155' : '#94a3b8',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {product.description?.trim() ? product.description : "No description provided yet for this product. Click 'Edit Product' to add description, ingredients, or specifications."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onAddToCart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#15803d',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShoppingCart size={15} />
            <span>Add to Active POS Cart</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {isAdmin && (
              <button
                type="button"
                onClick={onEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={14} />
                <span>Edit Product</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarcodeLabelModal({ product, shopName, onClose }) {
  const barcodeSvgRef = useRef(null);
  const pricing = getProductPricing(product);

  useEffect(() => {
    if (barcodeSvgRef.current && product?.barcode) {
      try {
        JsBarcode(barcodeSvgRef.current, product.barcode, {
          format: "CODE128",
          width: 1.8,
          height: 48,
          displayValue: true,
          fontSize: 13,
          margin: 4
        });
      } catch (err) {
        console.error("Barcode render error:", err);
      }
    }
  }, [product]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        maxWidth: '400px',
        width: '100%',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Shelf Barcode Label (SL #{product.slNo})
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: '#ffffff',
          color: '#000000',
          padding: '14px 18px',
          borderRadius: '6px',
          border: '1px dashed #000000',
          textAlign: 'center',
          width: '270px'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {shopName || "Grace Super Shop"} • {product.brand || 'General'}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, margin: '4px 0 2px 0', lineHeight: 1.2 }}>
            {product.name}
          </div>
          
          {pricing.hasDiscount ? (
            <div style={{ margin: '4px 0' }}>
              <span style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through', marginRight: '6px' }}>
                Tk {pricing.originalPrice.toFixed(0)}
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#000000' }}>
                Tk {pricing.finalPrice.toFixed(0)}
              </span>
              <span style={{ fontSize: '10px', background: '#000', color: '#fff', padding: '1px 4px', borderRadius: '2px', marginLeft: '6px' }}>
                {pricing.badge}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: '16px', fontWeight: 800, margin: '4px 0', color: '#000000' }}>
              Tk {pricing.originalPrice.toFixed(2)}
            </div>
          )}

          <svg ref={barcodeSvgRef} style={{ maxWidth: '100%' }}></svg>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            style={{
              flex: 1,
              background: '#15803d',
              border: 'none',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Printer size={14} />
            <span>Print Sticker</span>
          </button>
        </div>
      </div>
    </div>
  );
}
