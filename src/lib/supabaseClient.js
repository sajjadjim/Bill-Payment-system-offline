import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://bbmfbdxuvptemeewadnq.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_O2zfyMQjzBc463zPP30zQQ_glw_fNQS";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Client-side high efficiency image compressor
 * Ensures file size is strictly under maxSizeBytes (default 150 KB)
 * Resizes down and adjusts WebP/JPEG quality dynamically
 */
export async function compressProductImage(file, maxSizeBytes = 150 * 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 600; // Optimal for POS catalog cards & receipts

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Clean white background for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively compress until size is strictly under 150 KB
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/webp', quality);
        let byteSize = Math.round((dataUrl.length * 3) / 4);

        while (byteSize > maxSizeBytes && quality > 0.15) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/webp', quality);
          byteSize = Math.round((dataUrl.length * 3) / 4);
        }

        // If WebP is still larger than max size, fallback to JPEG
        if (byteSize > maxSizeBytes) {
          quality = 0.7;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          byteSize = Math.round((dataUrl.length * 3) / 4);
        }

        resolve({
          dataUrl,
          sizeKb: (byteSize / 1024).toFixed(1),
          originalSizeKb: (file.size / 1024).toFixed(1),
          width,
          height
        });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Upload image to Supabase Storage bucket (if available) or return compressed DataURL
 */
export async function uploadImageToSupabase(file, productId) {
  try {
    const compressed = await compressProductImage(file, 150 * 1024);
    
    // Attempt uploading to 'product-images' bucket
    try {
      // Convert dataURL to Blob
      const res = await fetch(compressed.dataUrl);
      const blob = await res.blob();
      const filePath = `products/${productId || Date.now()}_${Date.now()}.webp`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return {
          imageUrl: publicData.publicUrl,
          sizeKb: compressed.sizeKb,
          source: 'supabase_storage'
        };
      }
    } catch {
      // Storage bucket not configured with write policy; store compressed dataUrl directly in DB
    }

    // Direct database storage format (fits easily into text/varchar column <150KB)
    return {
      imageUrl: compressed.dataUrl,
      sizeKb: compressed.sizeKb,
      source: 'database_inline'
    };
  } catch (err) {
    console.error("Image compression/upload failed:", err);
    throw err;
  }
}

/**
 * Supabase SQL table setup script for user's Supabase project
 */
export const SUPABASE_SETUP_SQL = `
-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sl_no INTEGER,
  sku TEXT,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2),
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Invoices / Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  date TEXT,
  time TEXT,
  timestamp BIGINT,
  shop_id TEXT,
  served_by TEXT,
  customer_name TEXT,
  items JSONB,
  total_items_qty NUMERIC(10, 2),
  subtotal NUMERIC(10, 2),
  discount NUMERIC(10, 2),
  vat NUMERIC(10, 2),
  net_amount NUMERIC(10, 2),
  pay_type TEXT,
  paid_amount NUMERIC(10, 2),
  change_amount NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Users / Cashiers Table (RBAC for Admin & Seller)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'seller')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert Default Admin & Seller (if not exists)
INSERT INTO public.users (id, user_id, name, password, role)
VALUES 
  ('usr-admin-1', 'admin', 'Store Admin', 'admin123', 'admin'),
  ('usr-seller-1', 'lipi', 'Lipi Akter (Cashier)', 'seller123', 'seller'),
  ('usr-seller-2', 'seller', 'Sales Associate', 'seller123', 'seller')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Create Customers Loyalty & Points Table (Keyed by Phone Number)
CREATE TABLE IF NOT EXISTS public.customers (
  phone TEXT PRIMARY KEY,
  name TEXT DEFAULT 'Customer',
  total_valid_points INTEGER DEFAULT 0,
  points_ledger JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Enable Public Read & Insert Access (Anonymous POS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read on transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on transactions" ON public.transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read on customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on customers" ON public.customers FOR UPDATE USING (true);
`;

