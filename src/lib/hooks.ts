import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { Category, Piece, Kit } from './types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (name: string) => {
    const { data } = await supabase
      .from('categories')
      .insert({ name })
      .select()
      .maybeSingle();
    if (data) setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  };

  return { categories, loading, refetch: fetch, add };
}

export function usePieces() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('pieces')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    setPieces((data as Piece[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id: string) => {
    await supabase.from('pieces').delete().eq('id', id);
    setPieces((prev) => prev.filter((p) => p.id !== id));
  };

  return { pieces, loading, refetch: fetch, remove };
}

export function useKits() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('kits')
      .select('*, kit_items(*, piece:pieces(*))')
      .order('created_at', { ascending: false });
    setKits((data as Kit[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id: string) => {
    await supabase.from('kits').delete().eq('id', id);
    setKits((prev) => prev.filter((k) => k.id !== id));
  };

  return { kits, loading, refetch: fetch, remove };
}

export function useDashboardStats(pieces: Piece[], kits: Kit[]) {
  const totalPieces = pieces.length;
  const totalKits = kits.length;

  const avgCost = totalPieces > 0
    ? pieces.reduce((sum, p) => sum + p.total_cost, 0) / totalPieces
    : 0;

  const totalRevenue = pieces.reduce((sum, p) => sum + p.final_price, 0)
    + kits.reduce((sum, k) => sum + k.final_price, 0);

  const totalCost = pieces.reduce((sum, p) => sum + p.total_cost, 0)
    + kits.reduce((sum, k) => sum + k.total_cost, 0);

  const totalProfit = totalRevenue - totalCost;

  const avgMargin = totalPieces > 0
    ? pieces.reduce((sum, p) => sum + p.profit_margin, 0) / totalPieces
    : 0;

  const piecesWithShopee = pieces.filter(
    (p) => p.shopee_fee_percent > 0 || p.shopee_fixed_fee > 0
  );
  const kitsWithShopee = kits.filter(
    (k) => k.shopee_fee_percent > 0 || k.shopee_fixed_fee > 0
  );

  const totalNetProfit = piecesWithShopee.reduce((sum, p) => sum + p.net_profit, 0)
    + kitsWithShopee.reduce((sum, k) => sum + k.net_profit, 0);

  const totalFees = piecesWithShopee.reduce(
    (sum, p) => sum + (p.final_price - p.net_revenue), 0
  ) + kitsWithShopee.reduce(
    (sum, k) => sum + (k.final_price - k.net_revenue), 0
  );

  const hasMarketplaceData = piecesWithShopee.length > 0 || kitsWithShopee.length > 0;

  const piecesAtLoss = piecesWithShopee.filter((p) => p.net_profit < 0).length;

  return {
    totalPieces,
    totalKits,
    avgCost,
    totalRevenue,
    totalCost,
    totalProfit,
    avgMargin,
    totalNetProfit,
    totalFees,
    hasMarketplaceData,
    piecesAtLoss,
  };
}
