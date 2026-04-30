import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Box,
  Pencil,
  Copy,
  Trash2,
  Download,
  Calculator,
  Filter,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { usePieces, useCategories } from '../lib/hooks';
import { formatCurrency, formatTime } from '../lib/calculations';
import type { Piece } from '../lib/types';

function exportData(pieces: Piece[], format: 'csv' | 'json') {
  let content: string;
  let mimeType: string;
  let ext: string;

  if (format === 'json') {
    content = JSON.stringify(pieces, null, 2);
    mimeType = 'application/json';
    ext = 'json';
  } else {
    const headers = [
      'Nome',
      'Categoria',
      'Peso (g)',
      'Custo Material',
      'Tempo (min)',
      'Custo Energia',
      'Custos Extras',
      'Custo Total',
      'Margem (%)',
      'Preco Final',
      'Taxa Shopee (%)',
      'Taxa Fixa (R$)',
      'Frete Gratis',
      'Custo Frete',
      'Lucro Liquido',
      'Margem Liquida (%)',
    ];
    const rows = pieces.map((p) => [
      p.name,
      (p.category as any)?.name || '',
      p.weight_grams,
      p.material_cost.toFixed(2),
      p.print_time_minutes,
      p.energy_cost.toFixed(2),
      p.additional_cost.toFixed(2),
      p.total_cost.toFixed(2),
      p.profit_margin,
      p.final_price.toFixed(2),
      p.shopee_fee_percent,
      p.shopee_fixed_fee.toFixed(2),
      p.free_shipping ? 'Sim' : 'Nao',
      p.shipping_cost.toFixed(2),
      p.net_profit.toFixed(2),
      p.net_margin.toFixed(1),
    ]);
    content = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    mimeType = 'text/csv';
    ext = 'csv';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pecas-3d.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PiecesPage() {
  const { pieces, loading, remove } = usePieces();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = pieces;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter((p) => p.category_id === categoryFilter);
    }
    return list;
  }, [pieces, search, categoryFilter]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await remove(id);
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Pecas</h1>
          <p className="text-sm text-surface-500 mt-1">
            {pieces.length} peca{pieces.length !== 1 ? 's' : ''} cadastrada
            {pieces.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pieces.length > 0 && (
            <>
              <button
                className="btn-secondary"
                onClick={() => exportData(filtered, 'csv')}
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button
                className="btn-secondary"
                onClick={() => exportData(filtered, 'json')}
              >
                <Download className="w-4 h-4" /> JSON
              </button>
            </>
          )}
          <Link to="/calculator" className="btn-primary">
            <Calculator className="w-4 h-4" /> Nova Peca
          </Link>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Buscar pecas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <select
            className="input-field pl-10 pr-8 sm:w-48"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-8">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Box className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-surface-700">
            {search || categoryFilter
              ? 'Nenhuma peca encontrada'
              : 'Nenhuma peca cadastrada'}
          </h3>
          <p className="text-xs text-surface-500 mt-1 mb-4">
            {search || categoryFilter
              ? 'Tente alterar os filtros'
              : 'Crie sua primeira peca na calculadora'}
          </p>
          {!search && !categoryFilter && (
            <Link to="/calculator" className="btn-primary inline-flex">
              <Calculator className="w-4 h-4" /> Criar Peca
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    <th className="text-left px-4 py-3 font-medium text-surface-600">
                      Peca
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-surface-600">
                      Categoria
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600">
                      Custo
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600">
                      Preco
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600">
                      <div className="flex items-center justify-end gap-1">
                        <Store className="w-3.5 h-3.5 text-orange-500" />
                        Liquido
                      </div>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600">
                      Margem
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-surface-600">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filtered.map((piece) => {
                    const hasShopee = piece.shopee_fee_percent > 0 || piece.shopee_fixed_fee > 0;
                    const isLoss = hasShopee && piece.net_profit < 0;
                    return (
                      <tr
                        key={piece.id}
                        className={`hover:bg-surface-50/50 transition-colors ${
                          isLoss ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-surface-900">{piece.name}</p>
                              <p className="text-xs text-surface-400">
                                {piece.weight_grams}g &middot;{' '}
                                {formatTime(piece.print_time_minutes)}
                              </p>
                            </div>
                            {isLoss && (
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-surface-600">
                          {piece.category?.name || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-surface-900">
                          {formatCurrency(piece.total_cost)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-brand-700">
                          {formatCurrency(piece.final_price)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {hasShopee ? (
                            <div>
                              <p
                                className={`font-semibold ${
                                  piece.net_profit < 0
                                    ? 'text-red-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {formatCurrency(piece.net_profit)}
                              </p>
                              <p className="text-[11px] text-surface-400">
                                Shopee {piece.shopee_fee_percent}%
                                {piece.free_shipping ? ' + frete' : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-surface-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {hasShopee ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                piece.net_margin < 0
                                  ? 'bg-red-50 text-red-700'
                                  : piece.net_margin < 15
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {piece.net_margin.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              {piece.profit_margin}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/calculator?edit=${piece.id}`}
                              className="p-1.5 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/calculator?duplicate=${piece.id}`}
                              className="p-1.5 rounded-md text-surface-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                              title="Duplicar"
                            >
                              <Copy className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(piece.id)}
                              disabled={deleting === piece.id}
                              className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((piece) => {
              const hasShopee = piece.shopee_fee_percent > 0 || piece.shopee_fixed_fee > 0;
              const isLoss = hasShopee && piece.net_profit < 0;
              return (
                <div
                  key={piece.id}
                  className={`card p-4 ${isLoss ? 'border-red-200 bg-red-50/20' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-surface-900">{piece.name}</p>
                        <p className="text-xs text-surface-500">
                          {piece.category?.name || 'Sem categoria'} &middot;{' '}
                          {piece.weight_grams}g &middot;{' '}
                          {formatTime(piece.print_time_minutes)}
                        </p>
                      </div>
                      {isLoss && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                    {hasShopee ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          piece.net_margin < 0
                            ? 'bg-red-50 text-red-700'
                            : piece.net_margin < 15
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {piece.net_margin.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        {piece.profit_margin}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-surface-500">Custo</p>
                      <p className="text-sm font-medium">
                        {formatCurrency(piece.total_cost)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-surface-500">Preco</p>
                      <p className="text-sm font-semibold text-brand-700">
                        {formatCurrency(piece.final_price)}
                      </p>
                    </div>
                    {hasShopee && (
                      <div className="text-right">
                        <p className="text-xs text-surface-500 flex items-center gap-1 justify-end">
                          <Store className="w-3 h-3 text-orange-500" /> Liquido
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            piece.net_profit < 0 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(piece.net_profit)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-surface-100">
                    <Link
                      to={`/calculator?edit=${piece.id}`}
                      className="btn-secondary py-1.5 px-3 text-xs flex-1"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </Link>
                    <Link
                      to={`/calculator?duplicate=${piece.id}`}
                      className="btn-secondary py-1.5 px-3 text-xs flex-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicar
                    </Link>
                    <button
                      onClick={() => handleDelete(piece.id)}
                      disabled={deleting === piece.id}
                      className="btn-danger py-1.5 px-3 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
