export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Piece {
  id: string;
  name: string;
  category_id: string | null;
  weight_grams: number;
  filament_cost_per_kg: number;
  material_cost: number;
  print_time_minutes: number;
  printer_wattage: number;
  energy_cost_per_kwh: number;
  energy_cost: number;
  additional_cost: number;
  total_cost: number;
  profit_margin: number;
  suggested_price: number;
  final_price: number;
  shopee_fee_percent: number;
  shopee_fixed_fee: number;
  free_shipping: boolean;
  shipping_cost: number;
  net_revenue: number;
  net_profit: number;
  net_margin: number;
  notes: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  profit_margin: number;
  total_cost: number;
  final_price: number;
  shopee_fee_percent: number;
  shopee_fixed_fee: number;
  free_shipping: boolean;
  shipping_cost: number;
  net_revenue: number;
  net_profit: number;
  net_margin: number;
  created_at: string;
  updated_at: string;
  kit_items?: KitItem[];
}

export interface KitItem {
  id: string;
  kit_id: string;
  piece_id: string;
  quantity: number;
  piece?: Piece;
}

export interface PieceFormData {
  name: string;
  category_id: string;
  weight_grams: number;
  filament_cost_per_kg: number;
  print_time_minutes: number;
  printer_wattage: number;
  energy_cost_per_kwh: number;
  additional_cost: number;
  profit_margin: number;
  shopee_fee_percent: number;
  shopee_fixed_fee: number;
  free_shipping: boolean;
  shipping_cost: number;
  notes: string;
}

export interface MarketplaceBreakdown {
  grossPrice: number;
  shopeePercentFee: number;
  shopeeFixedFee: number;
  shippingCost: number;
  totalFees: number;
  netRevenue: number;
  netProfit: number;
  netMargin: number;
  minPrice: number;
}
