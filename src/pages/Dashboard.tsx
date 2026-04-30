import { Link } from 'react-router-dom';
import {
  Box,
  Package,
  TrendingUp,
  DollarSign,
  Calculator,
  ArrowRight,
  BarChart3,
  Target,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { usePieces, useKits, useDashboardStats } from '../lib/hooks';
import { formatCurrency, formatTime } from '../lib/calculations';
import type { Piece } from '../lib/types';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="stat-card group hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <span className="text-2xl font-bold text-surface-900 mt-1">{value}</span>
      {sub && <span className="text-xs text-surface-500">{sub}</span>}
    </div>
  );
}

function RecentPieceRow({ piece }: { piece: Piece }) {
  const hasShopee = piece.shopee_fee_percent > 0 || piece.shopee_fixed_fee > 0;
  const isLoss = hasShopee && piece.net_profit < 0;

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isLoss ? 'bg-red-50' : 'bg-brand-50'
          }`}
        >
          {isLoss ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <Box className="w-4 h-4 text-brand-600" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-surface-900 truncate">{piece.name}</p>
          <p className="text-xs text-surface-500">
            {piece.weight_grams}g &middot; {formatTime(piece.print_time_minutes)}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="text-sm font-semibold text-surface-900">
          {formatCurrency(piece.final_price)}
        </p>
        {hasShopee ? (
          <p
            className={`text-xs font-medium ${
              piece.net_profit < 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            Liq: {formatCurrency(piece.net_profit)}
          </p>
        ) : (
          <p className="text-xs text-brand-600">
            Custo: {formatCurrency(piece.total_cost)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { pieces, loading: piecesLoading } = usePieces();
  const { kits, loading: kitsLoading } = useKits();
  const stats = useDashboardStats(pieces, kits);

  const loading = piecesLoading || kitsLoading;
  const recentPieces = pieces.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-sm text-surface-500 mt-1">
            Visao geral dos seus custos e pecas
          </p>
        </div>
        <Link to="/calculator" className="btn-primary">
          <Calculator className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Peca</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-surface-200 rounded w-20 mb-3" />
              <div className="h-8 bg-surface-200 rounded w-28" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              icon={Box}
              label="Total de Pecas"
              value={String(stats.totalPieces)}
              sub={`${stats.totalKits} kit${stats.totalKits !== 1 ? 's' : ''} criados`}
              color="bg-brand-50 text-brand-600"
            />
            <StatCard
              icon={DollarSign}
              label="Custo Medio"
              value={formatCurrency(stats.avgCost)}
              sub="Por peca"
              color="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Lucro Bruto"
              value={formatCurrency(stats.totalProfit)}
              sub={`Receita: ${formatCurrency(stats.totalRevenue)}`}
              color="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon={Target}
              label="Margem Media"
              value={`${stats.avgMargin.toFixed(0)}%`}
              sub="De lucro sobre custo"
              color="bg-sky-50 text-sky-600"
            />
          </div>

          {/* Marketplace stats row */}
          {stats.hasMarketplaceData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="stat-card group hover:shadow-md transition-shadow duration-200 border-orange-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">
                    Taxas Shopee
                  </span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600 mt-1">
                  - {formatCurrency(stats.totalFees)}
                </span>
                <span className="text-xs text-surface-500">Total descontado</span>
              </div>
              <div className="stat-card group hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">
                    Lucro Liquido
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      stats.totalNetProfit < 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <span
                  className={`text-2xl font-bold mt-1 ${
                    stats.totalNetProfit < 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(stats.totalNetProfit)}
                </span>
                <span className="text-xs text-surface-500">Apos taxas Shopee</span>
              </div>
              {stats.piecesAtLoss > 0 && (
                <div className="stat-card group hover:shadow-md transition-shadow duration-200 border-red-100 bg-red-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      Atencao
                    </span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-700 mt-1">
                    {stats.piecesAtLoss}
                  </span>
                  <span className="text-xs text-red-600">
                    Peca{stats.piecesAtLoss !== 1 ? 's' : ''} com prejuizo
                  </span>
                </div>
              )}
            </div>
          )}

          {!stats.hasMarketplaceData && <div className="mb-4" />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent pieces */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
                <h2 className="text-sm font-semibold text-surface-900">
                  Pecas Recentes
                </h2>
                <Link
                  to="/pieces"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="px-4 divide-y divide-surface-100">
                {recentPieces.length === 0 ? (
                  <div className="py-10 text-center">
                    <Box className="w-10 h-10 text-surface-300 mx-auto mb-2" />
                    <p className="text-sm text-surface-500">
                      Nenhuma peca cadastrada ainda
                    </p>
                    <Link
                      to="/calculator"
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 mt-1 inline-block"
                    >
                      Criar primeira peca
                    </Link>
                  </div>
                ) : (
                  recentPieces.map((p) => <RecentPieceRow key={p.id} piece={p} />)
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="card">
              <div className="px-5 py-4 border-b border-surface-100">
                <h2 className="text-sm font-semibold text-surface-900">
                  Acoes Rapidas
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <Link
                  to="/calculator"
                  className="flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center group-hover:bg-brand-200 transition-colors">
                    <Calculator className="w-5 h-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      Calcular Nova Peca
                    </p>
                    <p className="text-xs text-surface-500">
                      Custos, preco e taxas Shopee
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-400 ml-auto group-hover:text-brand-600 transition-colors" />
                </Link>

                <Link
                  to="/kits"
                  className="flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <Package className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">Criar Kit</p>
                    <p className="text-xs text-surface-500">
                      Agrupe pecas e defina precos
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-400 ml-auto group-hover:text-brand-600 transition-colors" />
                </Link>

                <Link
                  to="/pieces"
                  className="flex items-center gap-4 p-4 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                    <BarChart3 className="w-5 h-5 text-sky-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      Ver Historico
                    </p>
                    <p className="text-xs text-surface-500">
                      Busque, filtre e exporte pecas
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-400 ml-auto group-hover:text-brand-600 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
