import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const p = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
}

function toCSVField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const csvPath = '/Users/sajjadhossainjim/Downloads/products_rows.csv';
const backupPath = '/Users/sajjadhossainjim/Downloads/products_rows.backup.csv';

const raw = fs.readFileSync(csvPath, 'utf8');
fs.writeFileSync(backupPath, raw, 'utf8');
console.log('Original backup saved to:', backupPath);

const rows = parseCSV(raw);
const header = rows[0];

const priceIdx = header.indexOf('price');
const costPriceIdx = header.indexOf('cost_price');
const stockIdx = header.indexOf('stock');
const slNoIdx = header.indexOf('sl_no');
const barcodeIdx = header.indexOf('barcode');
const nameIdx = header.indexOf('name');
const brandIdx = header.indexOf('brand');
const catIdx = header.indexOf('category');
const descIdx = header.indexOf('description');
const unitIdx = header.indexOf('unit');
const imgIdx = header.indexOf('image');
const idIdx = header.indexOf('id');
const skuIdx = header.indexOf('sku');

const cleanedProducts = [];
const cleanedCSVRows = [header.map(toCSVField).join(',')];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  
  // Clean price & cost_price - remove any commas!
  const price = Number((r[priceIdx] || '0').replace(/,/g, '').trim()) || 0;
  const costPrice = Number((r[costPriceIdx] || '0').replace(/,/g, '').trim()) || 0;
  const stock = Number((r[stockIdx] || '0').replace(/,/g, '').trim()) || 0;
  const slNo = Number((r[slNoIdx] || i).replace(/,/g, '').trim()) || i;
  
  let barcode = (r[barcodeIdx] || '').trim();
  if (barcode.includes('E+') || barcode.includes('e+')) {
    try {
      const num = Number(barcode);
      if (!isNaN(num)) {
        barcode = BigInt(Math.round(num)).toString();
      }
    } catch {}
  }
  if (!barcode) {
    barcode = '894' + String(1000000000 + i);
  }

  r[priceIdx] = price.toString();
  r[costPriceIdx] = costPrice.toString();
  r[stockIdx] = stock.toString();
  r[slNoIdx] = slNo.toString();
  r[barcodeIdx] = barcode;

  cleanedCSVRows.push(r.map(toCSVField).join(','));

  cleanedProducts.push({
    id: r[idIdx] || (`product-${String(i).padStart(4, '0')}`),
    slNo: slNo,
    sku: r[skuIdx] || (`PRD-${String(i).padStart(4, '0')}`),
    barcode: barcode,
    name: r[nameIdx] || `Product ${i}`,
    brand: r[brandIdx] || 'General',
    category: r[catIdx] || 'General Grocery',
    price: price,
    costPrice: costPrice,
    stock: stock,
    description: r[descIdx] || '',
    unit: r[unitIdx] || 'pcs',
    image: r[imgIdx] || ''
  });
}

// Write cleaned CSV
fs.writeFileSync(csvPath, cleanedCSVRows.join('\n'), 'utf8');
console.log('Cleaned CSV successfully overwritten to:', csvPath);

// Generate SQL insert file
const sqlLines = [
  '-- 1. Enable RLS and public policies for products',
  'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;',
  'DROP POLICY IF EXISTS "Allow public read on products" ON public.products;',
  'CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);',
  'DROP POLICY IF EXISTS "Allow public insert on products" ON public.products;',
  'CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);',
  'DROP POLICY IF EXISTS "Allow public update on products" ON public.products FOR UPDATE USING (true);',
  'CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);',
  'DROP POLICY IF EXISTS "Allow public delete on products" ON public.products FOR DELETE USING (true);',
  'CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);',
  '',
  '-- 2. Insert all 173 products'
];

cleanedProducts.forEach(p => {
  const esc = (s) => (s ? "'" + String(s).replace(/'/g, "''") + "'" : "''");
  
  sqlLines.push(
    `INSERT INTO public.products (id, sl_no, sku, barcode, name, brand, category, price, cost_price, stock, description, unit, image) ` +
    `VALUES (${esc(p.id)}, ${p.slNo}, ${esc(p.sku)}, ${esc(p.barcode)}, ${esc(p.name)}, ${esc(p.brand)}, ${esc(p.category)}, ${p.price}, ${p.costPrice}, ${p.stock}, ${esc(p.description)}, ${esc(p.unit)}, ${esc(p.image)}) ` +
    `ON CONFLICT (id) DO UPDATE SET ` +
    `sl_no = EXCLUDED.sl_no, sku = EXCLUDED.sku, barcode = EXCLUDED.barcode, name = EXCLUDED.name, brand = EXCLUDED.brand, category = EXCLUDED.category, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, description = EXCLUDED.description, unit = EXCLUDED.unit, image = EXCLUDED.image;`
  );
});

const sqlPath = '/Users/sajjadhossainjim/Downloads/insert_all_products.sql';
fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8');
console.log('SQL insert script written to:', sqlPath);

// Also generate full JavaScript array for defaultProducts.js
const defaultProductsContent = `export const DEFAULT_SHOP_SETTINGS = {
  shopName: "Swapno Super Shop",
  address: "Amtola Mirpur, Dhaka-1216",
  cell: "01310191458",
  vatRegNo: "001092713-0101",
  shopId: "ZAVI",
  servedBy: "L61627",
  vatPercentage: 0,
  enableTax: false,
  footerNote: "Goods sold are not returnable without receipt within 3 days. Thank you for shopping with us!"
};

export const DEFAULT_PRODUCTS = ${JSON.stringify(cleanedProducts, null, 2)};
`;

fs.writeFileSync(path.resolve('./src/data/defaultProducts.js'), defaultProductsContent, 'utf8');
console.log('Updated src/data/defaultProducts.js with all ' + cleanedProducts.length + ' products.');
