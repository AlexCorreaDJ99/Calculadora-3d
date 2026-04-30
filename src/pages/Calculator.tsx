import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Zap,
  Wrench,
  Tag,
  Store,
  ChevronRight,
  ChevronLeft,
  Save,
  Check,
  AlertTriangle,
  TrendingDown,
  Truck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCategories } from '../lib/hooks';
import {
  calculateMaterialCost,
  calculateEnergyCost,
  calculateTotalCost,
  calculateSuggestedPrice,
  calculateMarketplace,
  calculateIdealPrice,
  smartRound,
  formatCurrency,
} from '../lib/calculations';
import type { PieceFormData } from '../lib/types';

const STEPS = [
  { id: 'material', label: 'Material', icon: Layers },
  { id: 'energy', label: 'Energia', icon: Zap },
  { id: 'costs', label: 'Custos', icon: Wrench },
  { id: 'sale', label: 'Venda', icon: Tag },
  { id: 'marketplace', label: 'Shopee', icon: Store },
];

const DEFAULT_FORM: PieceFormData = {
  name: '',
  category_id: '',
  weight_grams: 0,
  filament_cost_per_kg: 120,
  print_time_minutes: 0,
  printer_wattage: 200,
  energy_cost_per_kwh: 0.75,
  additional_cost: 0,
  profit_margin: 100,
  shopee_fee_percent: 14,
  shopee_fixed_fee: 2,
  free_shipping: false,
  shipping_cost: 15,
  notes: '',
};

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

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const duplicateId = params.get('duplicate');

  const { categories } = useCategories();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PieceFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [useSmartRound, setUseSmartRound] = useState(true);
  const [loadingPiece, setLoadingPiece] = useState(!!editId || !!duplicateId);

  useEffect(() => {
    const id = editId || duplicateId;
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('pieces')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        setForm({
          name: duplicateId ? `${data.name} (copia)` : data.name,
          category_id: data.category_id || '',
          weight_grams: data.weight_grams,
          filament_cost_per_kg: data.filament_cost_per_kg,
          print_time_minutes: data.print_time_minutes,
          printer_wattage: data.printer_wattage,
          energy_cost_per_kwh: data.energy_cost_per_kwh,
          additional_cost: data.additional_cost,
          profit_margin: data.profit_margin,
          shopee_fee_percent: data.shopee_fee_percent || 14,
          shopee_fixed_fee: data.shopee_fixed_fee || 2,
          free_shipping: data.free_shipping || false,
          shipping_cost: data.shipping_cost || 15,
          notes: data.notes,
        });
      }
      setLoadingPiece(false);
    })();
  }, [editId, duplicateId]);

  const materialCost = useMemo(
    () => calculateMaterialCost(form.weight_grams, form.filament_cost_per_kg),
    [form.weight_grams, form.filament_cost_per_kg]
  );

  const energyCost = useMemo(
    () =>
      calculateEnergyCost(
        form.print_time_minutes,
        form.printer_wattage,
        form.energy_cost_per_kwh
      ),
    [form.print_time_minutes, form.printer_wattage, form.energy_cost_per_kwh]
  );

  const totalCost = useMemo(
    () => calculateTotalCost(materialCost, energyCost, form.additional_cost),
    [materialCost, energyCost, form.additional_cost]
  );

  const suggestedPrice = useMemo(
    () => calculateSuggestedPrice(totalCost, form.profit_margin),
    [totalCost, form.profit_margin]
  );

  const finalPrice = useMemo(
    () => (useSmartRound ? smartRound(suggestedPrice) : suggestedPrice),
    [suggestedPrice, useSmartRound]
  );

  const marketplace = useMemo(
    () =>
      calculateMarketplace(
        finalPrice,
        totalCost,
        form.shopee_fee_percent,
        form.shopee_fixed_fee,
        form.free_shipping,
        form.shipping_cost
      ),
    [finalPrice, totalCost, form.shopee_fee_percent, form.shopee_fixed_fee, form.free_shipping, form.shipping_cost]
  );

  const hasMarketplace = form.shopee_fee_percent > 0 || form.shopee_fixed_fee > 0;
  const isLoss = hasMarketplace && marketplace.netProfit < 0;
  const isLowProfit = hasMarketplace && !isLoss && marketplace.netMargin < 15;

  const idealPrice = useMemo(() => {
    const desired = totalCost * 0.3;
    return calculateIdealPrice(
      totalCost,
      desired,
      form.shopee_fee_percent,
      form.shopee_fixed_fee,
      form.free_shipping,
      form.shipping_cost
    );
  }, [totalCost, form.shopee_fee_percent, form.shopee_fixed_fee, form.free_shipping, form.shipping_cost]);

  const realMargin = totalCost > 0 ? ((finalPrice - totalCost) / totalCost) * 100 : 0;

  const update = (partial: Partial<PieceFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setStep(0);
      return;
    }
    setSaving(true);
    const record = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      weight_grams: form.weight_grams,
      filament_cost_per_kg: form.filament_cost_per_kg,
      material_cost: materialCost,
      print_time_minutes: form.print_time_minutes,
      printer_wattage: form.printer_wattage,
      energy_cost_per_kwh: form.energy_cost_per_kwh,
      energy_cost: energyCost,
      additional_cost: form.additional_cost,
      total_cost: totalCost,
      profit_margin: form.profit_margin,
      suggested_price: suggestedPrice,
      final_price: finalPrice,
      shopee_fee_percent: form.shopee_fee_percent,
      shopee_fixed_fee: form.shopee_fixed_fee,
      free_shipping: form.free_shipping,
      shipping_cost: form.shipping_cost,
      net_revenue: marketplace.netRevenue,
      net_profit: marketplace.netProfit,
      net_margin: marketplace.netMargin,
      notes: form.notes,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      await supabase.from('pieces').update(record).eq('id', editId);
    } else {
      await supabase.from('pieces').insert(record);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate('/pieces'), 800);
  };

  const timeHours = Math.floor(form.print_time_minutes / 60);
  const timeMin = form.print_time_minutes % 60;
  const lastStep = STEPS.length - 1;

  if (loadingPiece) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">
          {editId ? 'Editar Peca' : 'Calculadora de Custos'}
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          Preencha os dados para calcular o custo e preco de venda
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              i === step
                ? i === 4
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-brand-600 text-white shadow-sm'
                : i < step
                ? i === 4
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-brand-50 text-brand-700'
                : 'bg-surface-100 text-surface-500'
            }`}
          >
            <s.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card p-6">
          {/* Step 0: Material */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" /> Material e Identificacao
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="input-label">Nome da Peca *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Suporte para celular"
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Categoria</label>
                  <select
                    className="input-field"
                    value={form.category_id}
                    onChange={(e) => update({ category_id: e.target.value })}
                  >
                    <option value="">Selecionar...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Observacoes</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Anotacoes opcionais"
                    value={form.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                  />
                </div>
              </div>
              <hr className="border-surface-100" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput
                  label="Peso da Peca"
                  value={form.weight_grams}
                  onChange={(v) => update({ weight_grams: v })}
                  suffix="gramas"
                  step={0.1}
                />
                <NumberInput
                  label="Custo do Filamento"
                  value={form.filament_cost_per_kg}
                  onChange={(v) => update({ filament_cost_per_kg: v })}
                  suffix="R$/kg"
                  step={1}
                  help="Preco do rolo por quilo"
                />
              </div>
              <div className="rounded-lg bg-brand-50 px-4 py-3">
                <p className="text-xs text-brand-700 font-medium">Custo do Material</p>
                <p className="text-xl font-bold text-brand-800 mt-0.5">
                  {formatCurrency(materialCost)}
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Energy */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Energia Eletrica
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="input-label">Tempo de Impressao</label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        className="input-field pr-10"
                        value={timeHours || ''}
                        onChange={(e) => {
                          const h = Number(e.target.value);
                          update({ print_time_minutes: h * 60 + timeMin });
                        }}
                        min={0}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400">
                        h
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        className="input-field pr-12"
                        value={timeMin || ''}
                        onChange={(e) => {
                          const m = Math.min(59, Math.max(0, Number(e.target.value)));
                          update({ print_time_minutes: timeHours * 60 + m });
                        }}
                        min={0}
                        max={59}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400">
                        min
                      </span>
                    </div>
                  </div>
                </div>
                <NumberInput
                  label="Consumo da Impressora"
                  value={form.printer_wattage}
                  onChange={(v) => update({ printer_wattage: v })}
                  suffix="Watts"
                  help="Potencia media (100-400W)"
                />
                <NumberInput
                  label="Custo da Energia"
                  value={form.energy_cost_per_kwh}
                  onChange={(v) => update({ energy_cost_per_kwh: v })}
                  suffix="R$/kWh"
                  step={0.01}
                  help="Veja na sua conta de luz"
                />
              </div>
              <div className="rounded-lg bg-amber-50 px-4 py-3">
                <p className="text-xs text-amber-700 font-medium">Custo de Energia</p>
                <p className="text-xl font-bold text-amber-800 mt-0.5">
                  {formatCurrency(energyCost)}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Additional Costs */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-surface-600" /> Custos Adicionais
              </h2>
              <NumberInput
                label="Custos Extras"
                value={form.additional_cost}
                onChange={(v) => update({ additional_cost: v })}
                suffix="R$"
                step={0.5}
                help="Manutencao, desgaste, falhas, acabamento..."
              />
              <div className="rounded-lg bg-surface-100 px-4 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-600">Material</span>
                  <span className="font-medium">{formatCurrency(materialCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-600">Energia</span>
                  <span className="font-medium">{formatCurrency(energyCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-600">Extras</span>
                  <span className="font-medium">
                    {formatCurrency(form.additional_cost)}
                  </span>
                </div>
                <hr className="border-surface-300" />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-surface-900">
                    Custo Total
                  </span>
                  <span className="text-lg font-bold text-surface-900">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Sale */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" /> Preco de Venda
              </h2>
              <NumberInput
                label="Margem de Lucro"
                value={form.profit_margin}
                onChange={(v) => update({ profit_margin: v })}
                suffix="%"
                step={5}
                help="Percentual sobre o custo total"
              />
              <Toggle
                checked={useSmartRound}
                onChange={setUseSmartRound}
                label="Arredondamento inteligente"
              />
              <div className="rounded-lg bg-emerald-50 px-4 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Custo Total</span>
                  <span className="font-medium">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">Preco Sugerido</span>
                  <span className="font-medium">{formatCurrency(suggestedPrice)}</span>
                </div>
                <hr className="border-emerald-200" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Preco Final</p>
                    <p className="text-3xl font-bold text-emerald-800">
                      {formatCurrency(finalPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-600">Lucro bruto</p>
                    <p className="text-sm font-semibold text-emerald-700">
                      {realMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-emerald-600">
                      {formatCurrency(finalPrice - totalCost)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Marketplace / Shopee */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" /> Taxas de Marketplace (Shopee)
              </h2>
              <p className="text-xs text-surface-500 -mt-3">
                Configure as taxas da Shopee para calcular o lucro liquido real da venda
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberInput
                  label="Taxa da Shopee"
                  value={form.shopee_fee_percent}
                  onChange={(v) => update({ shopee_fee_percent: v })}
                  suffix="%"
                  step={0.5}
                  help="Comissao sobre o valor total (14% a 20%)"
                />
                <NumberInput
                  label="Taxa Fixa por Venda"
                  value={form.shopee_fixed_fee}
                  onChange={(v) => update({ shopee_fixed_fee: v })}
                  suffix="R$"
                  step={0.5}
                  help="Taxa fixa da plataforma (R$ 2 a R$ 4)"
                />
              </div>

              {/* Shipping section */}
              <div className="rounded-lg border border-surface-200 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-surface-500" />
                  <span className="text-sm font-medium text-surface-700">Frete</span>
                </div>
                <Toggle
                  checked={form.free_shipping}
                  onChange={(v) => update({ free_shipping: v })}
                  label="Frete gratis (incluso no preco)"
                />
                <NumberInput
                  label="Custo Medio do Frete"
                  value={form.shipping_cost}
                  onChange={(v) => update({ shipping_cost: v })}
                  suffix="R$"
                  step={1}
                  help={
                    form.free_shipping
                      ? 'Este valor sera descontado do seu lucro'
                      : 'Frete pago pelo cliente (nao afeta seu lucro)'
                  }
                />
              </div>

              {/* Breakdown */}
              <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-4 space-y-3">
                <h3 className="text-sm font-semibold text-orange-900">
                  Resumo da Venda na Shopee
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Preco de Venda (bruto)</span>
                  <span className="font-medium">{formatCurrency(finalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">
                    Taxa Shopee ({form.shopee_fee_percent}%)
                  </span>
                  <span className="font-medium text-red-600">
                    - {formatCurrency(marketplace.shopeePercentFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Taxa Fixa</span>
                  <span className="font-medium text-red-600">
                    - {formatCurrency(marketplace.shopeeFixedFee)}
                  </span>
                </div>
                {form.free_shipping && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-700">Frete Gratis</span>
                    <span className="font-medium text-red-600">
                      - {formatCurrency(marketplace.shippingCost)}
                    </span>
                  </div>
                )}
                <hr className="border-orange-200" />
                <div className="flex justify-between text-sm">
                  <span className="text-orange-800 font-medium">Valor Liquido Recebido</span>
                  <span className="font-semibold text-orange-900">
                    {formatCurrency(marketplace.netRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">Custo de Producao</span>
                  <span className="font-medium">- {formatCurrency(totalCost)}</span>
                </div>
                <hr className="border-orange-200" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-orange-700 font-medium">Lucro Liquido</p>
                    <p
                      className={`text-2xl font-bold ${
                        marketplace.netProfit < 0
                          ? 'text-red-600'
                          : marketplace.netMargin < 15
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(marketplace.netProfit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-orange-600">Margem real</p>
                    <p
                      className={`text-sm font-semibold ${
                        marketplace.netMargin < 0
                          ? 'text-red-600'
                          : marketplace.netMargin < 15
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {marketplace.netMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {isLoss && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
                  <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      PREJUIZO! Voce esta perdendo dinheiro
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Com esse preco, voce tera um prejuizo de{' '}
                      <strong>{formatCurrency(Math.abs(marketplace.netProfit))}</strong> por venda.
                      O preco minimo para nao ter prejuizo e{' '}
                      <strong>{formatCurrency(marketplace.minPrice)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {isLowProfit && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Lucro baixo
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Sua margem liquida e de apenas{' '}
                      <strong>{marketplace.netMargin.toFixed(1)}%</strong>.
                      Considere aumentar o preco de venda. Para uma margem de 30%, o preco ideal seria{' '}
                      <strong>{formatCurrency(smartRound(idealPrice))}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Price suggestions */}
              <div className="rounded-lg border border-surface-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-surface-800">
                  Precos Sugeridos (com taxas Shopee)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[15, 30, 50].map((targetMargin) => {
                    const desired = totalCost * (targetMargin / 100);
                    const ideal = calculateIdealPrice(
                      totalCost,
                      desired,
                      form.shopee_fee_percent,
                      form.shopee_fixed_fee,
                      form.free_shipping,
                      form.shipping_cost
                    );
                    const rounded = smartRound(ideal);
                    return (
                      <div
                        key={targetMargin}
                        className="text-center p-3 rounded-lg bg-surface-50 border border-surface-200"
                      >
                        <p className="text-[11px] text-surface-500 font-medium">
                          Margem {targetMargin}%
                        </p>
                        <p className="text-sm font-bold text-surface-900 mt-0.5">
                          {formatCurrency(rounded)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-surface-400">
                  Precos ja incluem taxas Shopee{form.free_shipping ? ' e frete gratis' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100">
            <button
              className="btn-secondary"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            {step < lastStep ? (
              <button
                className="btn-primary"
                onClick={() => setStep(Math.min(lastStep, step + 1))}
              >
                Proximo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || saved || !form.name.trim()}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" /> Salvo!
                  </>
                ) : saving ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />{' '}
                    {editId ? 'Atualizar' : 'Salvar Peca'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Live summary sidebar */}
        <div className="card p-5 h-fit sticky top-6 space-y-4">
          <h3 className="text-sm font-semibold text-surface-900">Resumo em Tempo Real</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-surface-500">Nome</p>
              <p className="text-sm font-medium text-surface-900 truncate">
                {form.name || 'Sem nome'}
              </p>
            </div>
            <hr className="border-surface-100" />
            <SummaryRow label="Material" value={materialCost} />
            <SummaryRow label="Energia" value={energyCost} />
            <SummaryRow label="Extras" value={form.additional_cost} />
            <hr className="border-surface-100" />
            <SummaryRow label="Custo Total" value={totalCost} bold />
            <SummaryRow
              label={`Margem (${form.profit_margin}%)`}
              value={suggestedPrice - totalCost}
            />
            <hr className="border-surface-100" />
            <div>
              <p className="text-xs text-surface-500">Preco Final</p>
              <p className="text-2xl font-bold text-brand-700">
                {formatCurrency(finalPrice)}
              </p>
            </div>

            {/* Marketplace summary in sidebar */}
            {hasMarketplace && (
              <>
                <hr className="border-surface-100" />
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-orange-500" />
                    <p className="text-xs font-semibold text-surface-700">Shopee</p>
                  </div>
                  <SummaryRow
                    label="Taxas totais"
                    value={marketplace.totalFees}
                    negative
                  />
                  <SummaryRow label="Valor liquido" value={marketplace.netRevenue} />
                  <hr className="border-surface-100" />
                  <div>
                    <p className="text-xs text-surface-500">Lucro Liquido</p>
                    <p
                      className={`text-lg font-bold ${
                        marketplace.netProfit < 0
                          ? 'text-red-600'
                          : marketplace.netMargin < 15
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(marketplace.netProfit)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        marketplace.netMargin < 0
                          ? 'text-red-500'
                          : marketplace.netMargin < 15
                          ? 'text-amber-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {marketplace.netMargin.toFixed(1)}% de margem
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  negative,
}: {
  label: string;
  value: number;
  bold?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span
        className={`text-xs ${bold ? 'font-semibold text-surface-900' : 'text-surface-500'}`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${
          bold
            ? 'font-bold text-surface-900'
            : negative
            ? 'font-medium text-red-600'
            : 'font-medium text-surface-700'
        }`}
      >
        {negative ? '- ' : ''}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
