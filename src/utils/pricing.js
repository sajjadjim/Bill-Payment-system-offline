/**
 * Helper to compute discount, savings, and final price for any product
 */
export function getProductPricing(product) {
  const originalPrice = Number(product?.price || 0);
  if (!product || !product.discount || Number(product.discount.value || 0) <= 0) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      discountAmount: 0,
      hasDiscount: false,
      badge: null
    };
  }

  let discountAmount = 0;
  let badge = '';

  if (product.discount.type === 'percent') {
    discountAmount = Math.round(((originalPrice * Number(product.discount.value)) / 100) * 100) / 100;
    badge = `${product.discount.value}% OFF`;
  } else {
    discountAmount = Math.min(originalPrice, Number(product.discount.value));
    badge = `Tk ${product.discount.value} OFF`;
  }

  const finalPrice = Math.max(0, Math.round((originalPrice - discountAmount) * 100) / 100);

  return {
    originalPrice,
    finalPrice,
    discountAmount,
    hasDiscount: discountAmount > 0,
    badge
  };
}
