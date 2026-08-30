'use client';

import { useState, useEffect } from 'react';
import { ProductOption, SelectedOption } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface OptionSelectorProps {
  productId: string;
  productName: string;
  basePrice: number;
  onOptionsSelected: (options: SelectedOption[], totalPrice: number) => void;
  onCancel: () => void;
}

interface GroupedOptions {
  [optionGroup: string]: ProductOption[];
}

export default function OptionSelector({
  productId,
  productName,
  basePrice,
  onOptionsSelected,
  onCancel,
}: OptionSelectorProps) {
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOptions();
  }, [productId]);

  async function fetchOptions() {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('product_options')
        .select('*')
        .eq('product_id', productId)
        .eq('is_available', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setOptions(data || []);
    } catch (err: any) {
      console.error('Error fetching options:', err);
      setError('Gagal memuatkan opsyen produk');
    } finally {
      setLoading(false);
    }
  }

  const groupedOptions: GroupedOptions = options.reduce((acc, option) => {
    if (!acc[option.option_group]) {
      acc[option.option_group] = [];
    }
    acc[option.option_group].push(option);
    return acc;
  }, {} as GroupedOptions);

  function handleOptionToggle(option: ProductOption) {
    const optionGroup = option.option_group;
    const existingOptionIndex = selectedOptions.findIndex(
      (opt) => opt.option_group === optionGroup
    );

    if (existingOptionIndex >= 0) {
      const newSelected = [...selectedOptions];
      newSelected[existingOptionIndex] = {
        option_id: option.id,
        option_group: option.option_group,
        option_name: option.option_name,
        price_adjustment: option.price_adjustment,
      };
      setSelectedOptions(newSelected);
    } else {
      setSelectedOptions([
        ...selectedOptions,
        {
          option_id: option.id,
          option_group: option.option_group,
          option_name: option.option_name,
          price_adjustment: option.price_adjustment,
        },
      ]);
    }
  }

  function isOptionSelected(optionId: string): boolean {
    return selectedOptions.some((opt) => opt.option_id === optionId);
  }

  function calculateTotalPrice(): number {
    const optionsTotal = selectedOptions.reduce(
      (sum, opt) => sum + opt.price_adjustment,
      0
    );
    return basePrice + optionsTotal;
  }

  function handleConfirm() {
    const totalPrice = calculateTotalPrice();
    onOptionsSelected(selectedOptions, totalPrice);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <p className="text-center text-gray-600">Memuatkan opsyen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <p className="text-center text-red-600 mb-4">{error}</p>
          <button onClick={onCancel} className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    onOptionsSelected([], basePrice);
    return null;
  }

  const totalPrice = calculateTotalPrice();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Pilih Opsyen</h2>
          <p className="text-gray-600 text-sm">{productName}</p>
          <p className="text-slate-600 font-semibold mt-1">Harga Asas: RM{basePrice.toFixed(2)}</p>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
            <div key={groupName} className="mb-6 last:mb-0">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                {groupName}
                <span className="ml-2 text-xs text-gray-500 font-normal">(Pilih satu)</span>
              </h3>

              <div className="space-y-2">
                {groupOptions.map((option) => {
                  const isSelected = isOptionSelected(option.id);
                  const priceText = option.price_adjustment === 0 ? 'Percuma' : `+RM${option.price_adjustment.toFixed(2)}`;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionToggle(option)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${
                        isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                            isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="font-medium text-gray-800">{option.option_name}</span>
                        </div>
                        <span className={`text-sm font-semibold ${
                          option.price_adjustment === 0 ? 'text-green-600' : 'text-slate-600'
                        }`}>
                          {priceText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 p-4">
          {selectedOptions.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Pilihan Anda:</p>
              {selectedOptions.map((opt) => (
                <div key={opt.option_id} className="text-sm text-gray-700 flex justify-between">
                  <span>{opt.option_group}: <b>{opt.option_name}</b></span>
                  {opt.price_adjustment > 0 && (
                    <span className="text-slate-600">+RM{opt.price_adjustment.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700 font-semibold">Jumlah:</span>
            <span className="text-2xl font-bold text-slate-600">RM{totalPrice.toFixed(2)}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold">
              Batal
            </button>
            <button onClick={handleConfirm} className="flex-1 bg-yellow-400 text-slate-900 py-3 rounded-lg hover:bg-yellow-500 transition font-semibold">
              Tambah ke Bakul
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
