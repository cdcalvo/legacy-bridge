'use client';

/**
 * Presentation Component: CategoryFilter
 * 
 * Provides category filtering UI with summary statistics.
 */

import { CategorySummaryDTO } from '@/application/dtos';

interface CategoryFilterProps {
  categories: string[];
  summary: CategorySummaryDTO[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({
  categories,
  summary,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const getCategoryStats = (category: string): CategorySummaryDTO | undefined => {
    return summary.find((s) => s.category === category);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = summary.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCount = summary.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All ({totalCount})
        </button>
        {categories.map((category) => {
          const stats = getCategoryStats(category);
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {category} {stats ? `(${stats.count})` : ''}
            </button>
          );
        })}
      </div>

      {summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-white">{totalCount}</div>
            <div className="text-sm text-slate-400">Total Transactions</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-slate-400">Total Amount</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">{categories.length}</div>
            <div className="text-sm text-slate-400">Categories</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-orange-400">
              {formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0)}
            </div>
            <div className="text-sm text-slate-400">Avg. Transaction</div>
          </div>
        </div>
      )}
    </div>
  );
}
