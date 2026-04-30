import type { MarketplaceBreakdown } from './types';

export function calculateMaterialCost(weightGrams: number, filamentCostPerKg: number): number {
  return (weightGrams / 1000) * filamentCostPerKg;
}

export function calculateEnergyCost(
  printTimeMinutes: number,
  printerWattage: number,
  energyCostPerKwh: number
): number {
  const hours = printTimeMinutes / 60;
  const kwh = (printerWattage / 1000) * hours;
  return kwh * energyCostPerKwh;
}

export function calculateTotalCost(
  materialCost: number,
  energyCost: number,
  additionalCost: number
): number {
  return materialCost + energyCost + additionalCost;
}

export function calculateSuggestedPrice(totalCost: number, profitMargin: number): number {
  return totalCost * (1 + profitMargin / 100);
}

export function smartRound(price: number): number {
  if (price <= 0) return 0;
  if (price < 5) return Math.ceil(price * 10 - 0.1) / 10;
  if (price < 20) return Math.ceil(price) - 0.1;
  if (price < 100) {
    const rounded = Math.ceil(price / 5) * 5 - 0.1;
    return rounded < price ? rounded + 5 : rounded;
  }
  const rounded = Math.ceil(price / 10) * 10 - 0.1;
  return rounded < price ? rounded + 10 : rounded;
}

export function calculateMarketplace(
  grossPrice: number,
  totalCost: number,
  shopeePercent: number,
  shopeeFixed: number,
  freeShipping: boolean,
  shippingCost: number
): MarketplaceBreakdown {
  const shopeePercentFee = grossPrice * (shopeePercent / 100);
  const effectiveShipping = freeShipping ? shippingCost : 0;
  const totalFees = shopeePercentFee + shopeeFixed + effectiveShipping;
  const netRevenue = grossPrice - totalFees;
  const netProfit = netRevenue - totalCost;
  const netMargin = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  const factor = 1 - shopeePercent / 100;
  const minPrice = factor > 0
    ? (totalCost + shopeeFixed + effectiveShipping) / factor
    : 0;

  return {
    grossPrice,
    shopeePercentFee,
    shopeeFixedFee: shopeeFixed,
    shippingCost: effectiveShipping,
    totalFees,
    netRevenue,
    netProfit,
    netMargin,
    minPrice,
  };
}

export function calculateIdealPrice(
  totalCost: number,
  desiredProfit: number,
  shopeePercent: number,
  shopeeFixed: number,
  freeShipping: boolean,
  shippingCost: number
): number {
  const factor = 1 - shopeePercent / 100;
  if (factor <= 0) return 0;
  const effectiveShipping = freeShipping ? shippingCost : 0;
  return (totalCost + desiredProfit + shopeeFixed + effectiveShipping) / factor;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
