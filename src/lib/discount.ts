// Utility functions for calculating bulk discounts

export interface DiscountInfo {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  totalSavings: number;
}

export const calculateBulkDiscount = (originalPrice: number, quantity: number): DiscountInfo => {
  let discountPerUnit = 0;
  
  // Apply discount rules based on quantity
  if (quantity >= 50) {
    discountPerUnit = 2; // 2 MZN discount for 50+ items
  }
  
  // Ensure discount doesn't exceed the original price
  const effectiveDiscount = Math.min(discountPerUnit, originalPrice);
  const discountedPrice = Math.max(0, originalPrice - effectiveDiscount);
  const totalSavings = effectiveDiscount * quantity;
  
  return {
    originalPrice,
    discountedPrice,
    discountAmount: effectiveDiscount,
    totalSavings
  };
};

export const getDiscountTier = (quantity: number): string => {
  if (quantity >= 50) {
    return "50+ pães - Desconto de 2 MZN por unidade";
  }
  return "Nenhum desconto aplicado";
};