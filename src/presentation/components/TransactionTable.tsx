'use client';

/**
 * Presentation Component: TransactionTable
 * 
 * Displays transactions in a sortable, filterable table.
 * Follows the presentational/container pattern.
 */

import { TransactionDTO } from '@/application/dtos';

interface TransactionTableProps {
  transactions: TransactionDTO[];
  loading?: boolean;
}

export function TransactionTable({ transactions, loading }: TransactionTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-slate-700 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-800 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <svg
          className="mx-auto h-12 w-12 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium">No transactions</h3>
        <p className="mt-1 text-sm">Ingest some XML data to see transactions here.</p>
      </div>
    );
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'eCommerce': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Transport & Food': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'Entertainment': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Travel': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Utilities': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Uncategorized': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    };
    return colors[category] || colors['Uncategorized'];
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Transaction ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {transactions.map((transaction) => (
            <tr 
              key={transaction.id} 
              className="hover:bg-slate-800/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">
                {transaction.txnId}
              </td>
              <td className="px-6 py-4 text-sm text-slate-200">
                <div>{transaction.description}</div>
                {transaction.rawDescription !== transaction.description && (
                  <div className="text-xs text-slate-500 mt-1">
                    Original: {transaction.rawDescription}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-200">
                {formatCurrency(transaction.amount, transaction.currency)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {formatDate(transaction.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                    transaction.category
                  )}`}
                >
                  {transaction.category}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
