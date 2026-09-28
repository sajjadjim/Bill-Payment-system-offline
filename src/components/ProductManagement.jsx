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
  Sparkles
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
    SUPABASE_SETUP_SQL
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [barcodePrintProduct, setBarcodePrintProduct] = useState(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

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

  // Form State for Adding / Editing
  const [formData, setFormData] = useState({
    name: '',
    brand: 'General',
    barcode: '',
    category: 'Grocery & Grains',
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

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];

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
    if (selectedProductIds.length === 0) return;
    const val = Number(bulkDiscountValue) || 0;
    applyBulkDiscount(selectedProductIds, {
      type: bulkDiscountType,
      value: val
    });
    alert(`Successfully applied ${val}${bulkDiscountType === 'percent' ? '% OFF' : ' Tk OFF'} to ${selectedProductIds.length} products!`);
  };

  const handleClearBulkDiscount = () => {
    if (selectedProductIds.length === 0) return;
    clearBulkDiscount(selectedProductIds);
    alert(`Discounts removed from ${selectedProductIds.length} products.`);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      brand: 'General',
      barcode: String(Math.floor(8941000000000 + Math.random() * 999999999)),
      category: 'Grocery & Grains',
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
    setFormData({
      name: product.name,
      brand: product.brand || 'General',
      barcode: product.barcode,
      category: product.category,
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

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert("Please provide product name and selling price.");
      return;
    }

    const discountObj = {
      type: formData.discountType,
      value: Number(formData.discountValue || 0)
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        brand: formData.brand.trim() || 'General',
        barcode: formData.barcode.trim(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        unit: formData.unit,
        discount: discountObj,
        image: formData.image
      });
    } else {
      addProduct({
        name: formData.name,
        brand: formData.brand.trim() || 'General',
        barcode: formData.barcode.trim(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        unit: formData.unit,
        discount: discountObj,
        image: formData.image
      });
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
    setImageMeta(null);
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
            <Package size={22} color="#059669" />
            <span>Product Catalog, Brands & Bulk Discounts</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Manage {products.length} products, filter by company (Pran, Aarong, Akij), and apply multi-product discounts in 1 click
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setIsSqlModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
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
            onClick={handleOpenAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#059669',
              border: 'none',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Plus size={17} />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* MULTI-PRODUCT BULK DISCOUNT TOOLBAR */}
      <div style={{
        background: selectedProductIds.length > 0 ? '#ecfdf5' : '#ffffff',
        border: selectedProductIds.length > 0 ? '1.5px solid #059669' : '1px solid #e2e8f0',
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
            <Sparkles size={18} color="#059669" />
            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
              Multi-Product Discount Engine:
            </strong>
          </div>

          <span style={{
            background: selectedProductIds.length > 0 ? '#059669' : '#f1f5f9',
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
                  color: '#2563eb',
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
                background: bulkDiscountType === 'percent' ? '#059669' : 'transparent',
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
                background: bulkDiscountType === 'flat' ? '#059669' : 'transparent',
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
              background: selectedProductIds.length > 0 ? '#059669' : '#cbd5e1',
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

      {/* Filter and Search Bar with Company Selector */}
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
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
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

        {/* Company Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={16} color="#2563eb" />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Company:</span>
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

      {/* Products Table with Selection Checkboxes & Discount Pricing Display */}
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
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          border: '1px solid #a7f3d0'
                        }}>
                          #{p.slNo}
                        </span>
                      </td>

                      {/* Photo */}
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isRealImage ? (
                            <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '18px' }}>{p.image || '📦'}</span>
                          )}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td style={{ padding: '10px 14px' }}>
                        <strong style={{ color: '#0f172a', display: 'block', fontSize: '13px' }}>{p.name}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Unit: {p.unit || 'pcs'} • {p.category}</span>
                      </td>

                      {/* Company / Brand Badge */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid #bfdbfe'
                        }}>
                          {p.brand || 'General'}
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
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                        Tk {pricing.finalPrice.toFixed(0)}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          background: isLow ? '#fee2e2' : '#ecfdf5',
                          color: isLow ? '#dc2626' : '#059669',
                          border: `1px solid ${isLow ? '#fecaca' : '#a7f3d0'}`,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {p.stock}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Edit Product & Discount"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
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
      </div>

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
            maxWidth: '520px',
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
                {editingProduct ? 'Edit Product & Discount' : 'Add New Product to Inventory'}
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
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Company / Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pran, Aarong, Akij"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
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
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy & Eggs"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Barcode (EAN-13 / Code-128) *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Auto-Generate Barcode
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8941101010722"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#2563eb',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    outline: 'none'
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
                        border: '1.5px solid #059669',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#059669',
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
                    <Upload size={15} color="#059669" />
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
                      border: '1px solid #059669',
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
                  {editingProduct ? 'Save Changes' : 'Save to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                <Database size={20} color="#2563eb" />
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
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                ✓ Connected to bbmfbdxuvptemeewadnq.supabase.co
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SETUP_SQL.trim());
                    alert("SQL copied to clipboard!");
                  }}
                  style={{
                    background: '#2563eb',
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
                    background: '#059669',
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
              background: '#059669',
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
