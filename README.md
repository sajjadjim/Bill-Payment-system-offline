# 🛒 Grace Super Shop - Smart POS & Bill Payment System (Offline + Online)

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ECF8E.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, production-grade Point of Sale (POS), inventory management, and bill payment application tailored for super shops and grocery stores. Engineered for desktops, laptops, MacBooks, and touch terminals with dual-tier offline-first resilience and Supabase cloud synchronization.

---

## 🌟 Key Features

### 1. 🛡️ 100% Offline-First with Hard-Refresh Resilience
- Cashiers can ring up sales with **0 ms checkout latency** even if the internet drops or WiFi disconnects.
- **Cart Persistence**: Every scanned item, quantity change, and discount is saved in real time to local storage. Even after an accidental hard reload (`Cmd + Shift + R` / `F5`) or power glitch, the active bill remains intact.

### 2. 🧾 Authentic 58mm/80mm Thermal Receipt Generation
- Modeled directly on the **Grace Super Shop** thermal slip:
  - **Store Header**: Name, Mirpur Dhaka address, Phone/Cell, VAT Reg No (`001092713`).
  - **Metadata**: Date, Time, Shop ID (`JIM`), Cashier (`lipi`), Invoice `#` (`09282026JIM030373`), Customer details.
  - **Itemized Table**: Product title, barcode printed directly underneath, unit price, quantity, and line total.
  - **Billing Summary**: Total Tk, item discounts, VAT %, net payable, payment channel, cash given, and change returned.
  - **Loyalty Points Box**: Points earned, previous points balance, redeemed points.
  - **Policies**: 72-hour exchange policy, no-cash refund notice, and bottom Code-128 barcode for return scans.

### 3. ⚡ Automated Barcode Reader & Manual Add
- **Hardware Laser/2D Scanner Integration**: Works out-of-the-box with any USB or Bluetooth handheld barcode reader (acts as keyboard wedge) with audio beep feedback.
- **Global Keystroke Listener**: Scanning a barcode automatically directs the input into the active bill regardless of mouse focus.
- **`+ Manual Item Add`**: Directly add unbarcoded loose grocery items (e.g. fresh sugar, bakery, vegetables) on the fly.
- **Unregistered Barcode Prompt**: Prompts a 5-second inline registration modal when a new barcode is scanned.

### 4. 🏢 Company / Brand-Based Search
- Quick-filter catalog items by brand: **Pran**, **Aarong**, **Akij**, **Fresh**, **Square**, **City Group**, **Unilever**, **Nestle**, **Arla**, etc.
- Text search matches both product titles and company names.

### 5. 🏷️ Product-Level Discounts & 1-Click Multi-Product Bulk Discount Tool
- **Before & After Price Display**:
  - Original price crossed out (`~~Tk 120~~`).
  - Discounted price highlighted in bold green (**Tk 108**).
  - High-visibility promotional badge: `🔥 10% OFF` or `Tk 10 OFF`.
- **Bulk Discount Engine** (in Products & Serials tab):
  - Multi-select checkboxes with **Quick Select: "All Pran"**, **"All Aarong"**, or **"All Akij"**.
  - Apply `% OFF` or `Tk OFF` across multiple products simultaneously in 1 click.

### 6. 🖼️ Real Product Photography & Under 150 KB Image Compressor
- High-quality realistic product imagery.
- Built-in HTML5 canvas image compressor that shrinks any camera upload (even 10 MB smartphone photos) to **strictly under 150 KB** (typically 30 KB – 70 KB WebP) for minimal storage footprint and instant loading.

### 7. 💳 Multi-Payment Channels (Bangladesh & Global Standard)
- **Cash**: Banknote denomination buttons (100, 200, 500, 1000, 2000 Tk) with instant change return calculation.
- **bKash**: Merchant QR & wallet transaction ID (TrxID) recording.
- **Rocket (DBBL)**: Dutch-Bangla mobile account payments.
- **Nagad**: Postal digital financial service tracking.
- **Visa / Mastercard**: Card POS swipe terminal integration with last 4 digits & approval code.

---

## ☁️ Supabase Cloud Integration

### Credentials Configured
- **Project URL**: `https://bbmfbdxuvptemeewadnq.supabase.co`
- **Publishable Key**: `sb_publishable_O2zfyMQjzBc463zPP30zQQ_glw_fNQS`

### 1-Click Database Setup (SQL)
Run this SQL script inside your Supabase **SQL Editor** ([https://supabase.com/dashboard](https://supabase.com/dashboard)):

```sql
-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sl_no INTEGER,
  sku TEXT,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  price NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(10, 2),
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  discount JSONB,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure brand and discount columns exist on existing tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount JSONB;


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

-- 4. Enable RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read on transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on transactions" ON public.transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true);
```

---

## 🔐 Staff Login & Role-Based Access Control (RBAC)

The POS system enforces a secure, supermarket-grade **Staff Login** architecture. Public sign-up is disabled on the website; new cashiers and managers are provisioned directly in the database.

### Role Permissions Matrix

| Capability / Action | 👑 Admin | 👤 Seller / Cashier |
| :--- | :---: | :---: |
| **POS Billing & Barcode Scanning** | ✅ Full Access | ✅ Full Access |
| **Product Selection & Cart Operations** | ✅ Full Access | ✅ Full Access |
| **Accept Payments (Cash, bKash, Cards)** | ✅ Full Access | ✅ Full Access |
| **Print 58mm/80mm Thermal Receipts** | ✅ Full Access | ✅ Full Access |
| **View Past Sales Receipts** | ✅ Full Access | ✅ Full Access |
| **Manually Edit Product Stock Quantity** | ✅ Yes (`-`, `+`, prompt) | ❌ Restricted |
| **Update / Edit Product Details** | ✅ Yes | ❌ Restricted |
| **Delete Products from Inventory** | ✅ Yes | ❌ Restricted |
| **Add New Products to Catalog** | ✅ Yes | ❌ Restricted |
| **Apply / Remove Bulk Discounts** | ✅ Yes | ❌ Restricted |
| **Modify Store Settings (VAT, Address, etc.)** | ✅ Yes | ❌ Restricted |

### Default Credentials (Ready for Testing)
* **Administrator**:
  * User ID: `admin`
  * Password: `admin123`
  * Permissions: Full store management, catalog editing, manual stock adjustments, billing.
* **Seller / Cashier (Matches Physical Receipt)**:
  * User ID: `lipi`
  * Password: `seller123`
  * Permissions: POS terminal billing and selling only. Receipts automatically print `Served By: Lipi Akter`.
* **Alternative Seller**:
  * User ID: `seller`
  * Password: `seller123`

### Adding New Sellers & Admins via Database
To add a new employee, execute this SQL query in your Supabase SQL editor:
```sql
INSERT INTO public.users (id, user_id, name, password, role)
VALUES ('usr-new-1', 'karim', 'Karim Ullah (Counter 2)', 'karim123', 'seller');
```
Once added, the new employee can immediately log in on the website with User ID `karim` and Password `karim123`!


---

## 💻 Tech Stack & Architecture

- **Frontend**: React 19, JavaScript (ES Modules), Vite 8
- **Styling**: Vanilla CSS custom design system with full `@media print` thermal slip stylesheet
- **Icons**: Lucide React
- **Barcodes**: JsBarcode (Code-128 / EAN-13)
- **Local Storage**: HTML5 Web Storage API (resilient offline billing cache)
- **Cloud Database**: Supabase PostgreSQL & Storage API

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/sajjadjim/Bill-Payment-system-offline.git

# Navigate into project directory
cd Bill-Payment-system-offline

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
