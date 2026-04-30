import { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Trash2,
  X,
  Save,
  Pencil,
  Box,
  Minus,
  Store,
  Truck,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePieces, useKits } from '../lib/hooks';
import {
  calculateSuggestedPrice,
  calculateMarketplace,
  smartRound,
  formatCurrency,
} from '../lib/calculations';
import type { Kit } from '../lib/types';

interface KitFormItem {
  piece_id: string;
  quantity: number;
}

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 1,
  help,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
  help?: string;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <div className="relative">
        <input
          type="number"
          className={`input-field ${suffix ? 'pr-14' : ''}`}
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          step={step}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 font-medium">
            {suffix}
          </span>
        )}
      </div>
      {help && <p className="text-xs text-surface-400 mt-1">{help}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
          checked ? 'bg-brand-600' : 'bg-surface-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-surface-700">{label}</span>
    </div>
  );
}

export default function KitsPage() {
  const { pieces } = usePieces();
  const { kits, loading, refetch, remove } = useKits();
  const [showForm, setShowForm] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [margin, setMargin] = useState(100);
  const [items, setItems] = useState<KitFormItem[]>([]);
  const [shopeePercent, setShopeePercent] = useState(14);
  const [shopeeFixed, setShopeeFixed] = useState(2);
  const [freeShipping, setFreeShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState(15);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const kitCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const piece = pieces.find((p) => p.id === item.piece_id);
      return sum + (piece ? piece.total_cost * item.quantity : 0);
    }, 0);
  }, [items, pieces]);

  const kitSuggested = calculateSuggestedPrice(kitCost, margin);
  const kitFinal = smartRound(kitSuggested);

  const marketplace = useMemo(
    () =>
      calculateMarketplace(
        kitFinal,
        kitCost,
        shopeePercent,
        shopeeFixed,
        freeShipping,
        shippingCost
      ),
    [kitFinal, kitCost, shopeePercent, shopeeFixed, freeShipping, shippingCost]
  );

  const hasMarketplace = shopeePercent > 0 || shopeeFixed > 0;
  const isLoss = hasMarketplace && marketplace.netProfit < 0;

  const resetForm = () => {
    setName('');
    setDescription('');
    setMargin(100);
    setItems([]);
    setShopeePercent(14);
    setShopeeFixed(2);
    setFreeShipping(false);
    setShippingCost(15);
    setEditingKit(null);
    setShowForm(false);
  };

  const openEdit = (kit: Kit) => {
    setEditingKit(kit);
    setName(kit.name);
    setDescription(kit.description);
    setMargin(kit.profit_margin);
    setShopeePercent(kit.shopee_fee_percent || 14);
    setShopeeFixed(kit.shopee_fixed_fee || 2);
    setFreeShipping(kit.free_shipping || false);
    setShippingCost(kit.shipping_cost || 15);
    setItems(
      kit.kit_items?.map((ki) => ({
        piece_id: ki.piece_id,
        quantity: ki.quantity,
      })) || []
    );
    setShowForm(true);
  };

  const addItem = () => {
    if (pieces.length === 0) return;
    setItems([...items, { piece_id: pieces[0].id, quantity: 1 }]);
  };

  const updateItem = (index: number, partial: Partial<KitFormItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...partial } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || items.length === 0) return;
    setSaving(true);

    const kitData = {
      name: name.trim(),
      description: description.trim(),
      profit_margin: margin,
      total_cost: kitCost,
      final_price: kitFinal,
      shopee_fee_percent: shopeePercent,
      shopee_fixed_fee: shopeeFixed,
      free_shipping: freeShipping,
      shipping_cost: shippingCost,
      net_revenue: marketplace.netRevenue,
      net_profit: marketplace.netProfit,
      net_margin: marketplace.netMargin,
      updated_at: new Date().toISOString(),
    };

    if (editingKit) {
      await supabase.from('kits').update(kitData).eq('id', editingKit.id);
      await supabase.from('kit_items').delete().eq('kit_id', editingKit.id);
      await supabase.from('kit_items').insert(
        items.map((item) => ({
          kit_id: editingKit.id,
          piece_id: item.piece_id,
          quantity: item.quantity,
        }))
      );
    } else {
      const { data: newKit } = await supabase
        .from('kits')
        .insert(kitData)
        .select()
        .maybeSingle();
      if (newKit) {
        await supabase.from('kit_items').insert(
          items.map((item) => ({
            kit_id: newKit.id,
            piece_id: item.piece_id,
            quantity: item.quantity,
          }))
        );
      }
    }

    setSaving(false);
    resetForm();
    refetch();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await remove(id);
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Kits</h1>
          <p className="text-sm text-surface-500 mt-1">
            Agrupe pecas e defina precos de kits
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
            disabled={pieces.length === 0}
          >
            <Plus className="w-4 h-4" /> Novo Kit
          </button>
        )}
      </div>

      {pieces.length === 0 && !loading && (
        <div className="card p-12 text-center mb-6">
          <Box className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-surface-700">
            Cadastre pecas primeiro
          </h3>
          <p className="text-xs text-surface-500 mt-1">
            Voce precisa ter pecas cadastradas para criar kits
          </p>
        </div>
      )}

      {/* Kit Form */}
      {showForm && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-900">
              {editingKit ? 'Editar Kit' : 'Novo Kit'}
            </h2>
            <button onClick={resetForm} className="p-1 text-surface-400 hover:text-surface-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="input-label">Nome do Kit *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Kit Organizador Escritorio"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label">Descricao</label>
              <input
                type="text"
                className="input-field"
                placeholder="Descricao opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Kit items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-surface-700">
                Pecas do Kit
              </label>
              <button
                onClick={addItem}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Peca
              </button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-surface-200 p-6 text-center">
                <p className="text-sm text-surface-500">
                  Adicione pecas ao kit
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => {
                  const piece = pieces.find((p) => p.id === item.piece_id);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 border border-surface-200"
                    >
                      <select
                        className="input-field flex-1"
                        value={item.piece_id}
                        onChange={(e) =>
                          updateItem(index, { piece_id: e.target.value })
                        }
                      >
                        {pieces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.total_cost)})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateItem(index, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          className="p-1 rounded bg-white border border-surface-300 text-surface-600 hover:bg-surface-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateItem(index, { quantity: item.quantity + 1 })
                          }
                          className="p-1 rounded bg-white border border-surface-300 text-surface-600 hover:bg-surface-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-surface-700 w-24 text-right">
                        {formatCurrency(
                          (piece?.total_cost || 0) * item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 text-surface-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Margin */}
          <div className="mb-6">
            <NumberInput
              label="Margem de Lucro"
              value={margin}
              onChange={setMargin}
              suffix="%"
              step={5}
            />
          </div>

          {/* Marketplace section */}
          <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-5 mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-surface-800">
                Taxas de Marketplace (Shopee)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput
                label="Taxa da Shopee"
                value={shopeePercent}
                onChange={setShopeePercent}
                suffix="%"
                step={0.5}
                help="Comissao sobre o valor (14% a 20%)"
              />
              <NumberInput
                label="Taxa Fixa por Venda"
                value={shopeeFixed}
                onChange={setShopeeFixed}
                suffix="R$"
                step={0.5}
                help="Taxa fixa da plataforma"
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-surface-500" />
              <span className="text-sm font-medium text-surface-700">Frete</span>
            </div>
            <Toggle
              checked={freeShipping}
              onChange={setFreeShipping}
              label="Frete gratis (incluso no preco)"
            />
            <NumberInput
              label="Custo Medio do Frete"
              value={shippingCost}
              onChange={setShippingCost}
              suffix="R$"
              step={1}
              help={
                freeShipping
                  ? 'Sera descontado do seu lucro'
                  : 'Pago pelo cliente'
              }
            />
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="rounded-lg bg-emerald-50 px-4 py-3 space-y-2">
              <h4 className="text-xs font-semibold text-emerald-800">Venda Direta</h4>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Custo Total</span>
                <span className="font-medium">{formatCurrency(kitCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Lucro Bruto</span>
                <span className="font-medium">
                  {formatCurrency(kitFinal - kitCost)}
                </span>
              </div>
              <hr className="border-emerald-200" />
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-emerald-800">
                  Preco Final
                </span>
                <span className="text-xl font-bold text-emerald-800">
                  {formatCurrency(kitFinal)}
                </span>
              </div>
            </div>

            {hasMarketplace && (
              <div
                className={`rounded-lg px-4 py-3 space-y-2 ${
                  isLoss
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-orange-50 border border-orange-200'
                }`}
              >
                <h4
                  className={`text-xs font-semibold ${
                    isLoss ? 'text-red-800' : 'text-orange-800'
                  }`}
                >
                  Via Shopee
                </h4>
                <div className="flex justify-between text-sm">
                  <span className={isLoss ? 'text-red-700' : 'text-orange-700'}>
                    Taxas
                  </span>
                  <span className="font-medium text-red-600">
                    - {formatCurrency(marketplace.totalFees)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={isLoss ? 'text-red-700' : 'text-orange-700'}>
                    Valor Liquido
                  </span>
                  <span className="font-medium">
                    {formatCurrency(marketplace.netRevenue)}
                  </span>
                </div>
                <hr className={isLoss ? 'border-red-200' : 'border-orange-200'} />
                <div className="flex justify-between items-end">
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        isLoss ? 'text-red-700' : 'text-orange-700'
                      }`}
                    >
                      Lucro Liquido
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        marketplace.netProfit < 0
                          ? 'text-red-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(marketplace.netProfit)}
                    </p>
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      marketplace.netMargin < 0
                        ? 'text-red-500'
                        : marketplace.netMargin < 15
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {marketplace.netMargin.toFixed(1)}% margem
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alerts */}
          {isLoss && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3 mb-6">
              <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  PREJUIZO! Este kit da prejuizo na Shopee
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Preco minimo para nao ter prejuizo:{' '}
                  <strong>{formatCurrency(marketplace.minPrice)}</strong>
                </p>
              </div>
            </div>
          )}

          {hasMarketplace && !isLoss && marketplace.netMargin < 15 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Lucro baixo</p>
                <p className="text-xs text-amber-700 mt-1">
                  A margem liquida e de apenas{' '}
                  <strong>{marketplace.netMargin.toFixed(1)}%</strong>.
                  Considere aumentar o preco ou a margem.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-surface-100">
            <button className="btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !name.trim() || items.length === 0}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : editingKit ? 'Atualizar' : 'Salvar Kit'}
            </button>
          </div>
        </div>
      )}

      {/* Kits list */}
      {loading ? (
        <div className="card p-8">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        </div>
      ) : kits.length === 0 && !showForm ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-surface-700">
            Nenhum kit criado
          </h3>
          <p className="text-xs text-surface-500 mt-1">
            Agrupe pecas em kits para venda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kits.map((kit) => {
            const kitHasShopee = kit.shopee_fee_percent > 0 || kit.shopee_fixed_fee > 0;
            const kitIsLoss = kitHasShopee && kit.net_profit < 0;
            return (
              <div
                key={kit.id}
                className={`card p-5 ${kitIsLoss ? 'border-red-200' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-surface-900">
                        {kit.name}
                      </h3>
                      {kit.description && (
                        <p className="text-xs text-surface-500 mt-0.5">
                          {kit.description}
                        </p>
                      )}
                    </div>
                    {kitIsLoss && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(kit)}
                      className="p-1.5 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(kit.id)}
                      disabled={deleting === kit.id}
                      className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {kit.kit_items?.map((ki) => (
                    <div
                      key={ki.id}
                      className="flex items-center justify-between text-sm px-3 py-1.5 rounded bg-surface-50"
                    >
                      <span className="text-surface-700">
                        {ki.quantity}x {ki.piece?.name || 'Peca removida'}
                      </span>
                      <span className="text-surface-500">
                        {formatCurrency(
                          (ki.piece?.total_cost || 0) * ki.quantity
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                  <div>
                    <p className="text-xs text-surface-500">Custo</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(kit.total_cost)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-surface-500">Preco</p>
                    <p className="text-lg font-bold text-brand-700">
                      {formatCurrency(kit.final_price)}
                    </p>
                  </div>
                  {kitHasShopee ? (
                    <div className="text-right">
                      <p className="text-xs text-surface-500 flex items-center gap-1 justify-end">
                        <Store className="w-3 h-3 text-orange-500" /> Liquido
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          kit.net_profit < 0 ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(kit.net_profit)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-xs text-surface-500">Margem</p>
                      <p className="text-sm font-medium">{kit.profit_margin}%</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
