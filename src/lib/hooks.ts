import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { Category, Piece, Kit } from './types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      setCategories(data ?? []);
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (e) {
      console.error('Error adding category:', e);
      return null;
    }
  };

  return { categories, loading, refetch: fetch, add };
}

export function usePieces() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pieces')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPieces((data as Piece[]) ?? []);
    } catch (e) {
      console.error('Error fetching pieces:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id: string) => {
    try {
      const { error } = await supabase.from('pieces').delete().eq('id', id);
      if (error) throw error;
      setPieces((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Error deleting piece:', e);
    }
  };

  return { pieces, loading, refetch: fetch, remove };
}

export function useKits() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('kits')
        .select('*, kit_items(*, piece:pieces(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setKits((data as Kit[]) ?? []);
    } catch (e) {
      console.error('Error fetching kits:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id: string) => {
    try {
      const { error } = await supabase.from('kits').delete().eq('id', id);
      if (error) throw error;
      setKits((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      console.error('Error deleting kit:', e);
    }
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
