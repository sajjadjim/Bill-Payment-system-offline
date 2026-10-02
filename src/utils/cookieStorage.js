/**
 * Browser Cookie Storage Utility
 * Optimized for ultra-fast POS bill calculation and product barcode scanning.
 * Saves products into browser cookies (document.cookie) for 0ms payment retrieval.
 */

export function setCookie(name, value, days = 30) {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(serialized)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (err) {
    console.warn(`Error setting cookie "${name}":`, err);
  }
}

export function getCookie(name) {
  try {
    const nameEQ = encodeURIComponent(name) + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const raw = decodeURIComponent(c.substring(nameEQ.length, c.length));
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
    }
  } catch (err) {
    console.warn(`Error reading cookie "${name}":`, err);
  }
  return null;
}

export function removeCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

/**
 * Save products to browser cookies for fastest payment lookup
 * Stores essential fast-billing fields in cookie, and stores full catalog backup
 */
export function saveProductsToCookie(products) {
  if (!Array.isArray(products)) return;
  try {
    // Fast-lookup dataset (stripped of heavy base64 strings so it fits smoothly in cookie store)
    const fastLookupProducts = products.map(p => ({
      id: String(p.id),
      b: String(p.barcode || ''),
      n: String(p.name || ''),
      p: Number(p.price || 0),
      cp: Number(p.costPrice || 0),
      s: Number(p.stock || 0),
      br: String(p.brand || 'General'),
      cat: String(p.category || 'General Grocery'),
      sku: String(p.sku || ''),
      sl: Number(p.slNo || 0),
      d: p.discount || null
    }));

    // Split into 3KB chunks for maximum browser cookie compatibility
    const jsonStr = JSON.stringify(fastLookupProducts);
    const CHUNK_SIZE = 3000;
    const totalChunks = Math.ceil(jsonStr.length / CHUNK_SIZE);

    setCookie('pos_prod_total_chunks', totalChunks, 30);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = jsonStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      setCookie(`pos_prod_chunk_${i}`, chunk, 30);
    }

    // Timestamp & item count cookie for instant cache validation
    setCookie('pos_prod_meta', {
      count: products.length,
      updatedAt: Date.now()
    }, 30);

    // Also persist full catalog to localStorage as image backup
    localStorage.setItem('grace_pos_products', JSON.stringify(products));
  } catch (err) {
    console.warn("Failed to write products to browser cookies:", err);
  }
}

/**
 * Retrieve cached products directly from browser cookies
 */
export function getProductsFromCookie() {
  try {
    const totalChunks = Number(getCookie('pos_prod_total_chunks')) || 0;
    if (totalChunks > 0) {
      let assembledJson = '';
      for (let i = 0; i < totalChunks; i++) {
        const chunk = getCookie(`pos_prod_chunk_${i}`);
        if (chunk) assembledJson += chunk;
      }

      if (assembledJson) {
        const fastList = JSON.parse(assembledJson);
        if (Array.isArray(fastList) && fastList.length > 0) {
          return fastList.map(item => ({
            id: item.id,
            barcode: item.b,
            name: item.n,
            price: item.p,
            costPrice: item.cp,
            stock: item.s,
            brand: item.br,
            category: item.cat,
            sku: item.sku,
            slNo: item.sl,
            discount: item.d,
            unit: 'pcs',
            image: ''
          }));
        }
      }
    }
  } catch (err) {
    console.warn("Error reading products from cookie:", err);
  }

  // Fallback to localStorage if cookies not yet initialized
  try {
    const saved = localStorage.getItem('grace_pos_products');
    if (saved) return JSON.parse(saved);
  } catch {}

  return null;
}
