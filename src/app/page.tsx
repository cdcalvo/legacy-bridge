'use client';

/**
 * Main Dashboard Page
 * 
 * Container component that orchestrates the UI.
 * Handles state management and API calls.
 */

import { useState, useEffect, useCallback } from 'react';
import { TransactionTable, CategoryFilter, XMLIngester } from '@/presentation/components';
import { TransactionDTO, CategorySummaryDTO, APIResponse, IngestionResultDTO } from '@/application/dtos';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [summary, setSummary] = useState<CategorySummaryDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize database on first load
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const response = await fetch('/api/setup', { method: 'POST' });
        if (response.ok) {
          setSetupStatus('success');
        } else {
          setSetupStatus('error');
        }
      } catch {
        setSetupStatus('error');
      }
    };

    setupDatabase();
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' 
        ? '/api/transactions' 
        : `/api/transactions?category=${encodeURIComponent(selectedCategory)}`;
      
      const response = await fetch(url);
      const data: APIResponse<TransactionDTO[]> = await response.json();

      if (data.success && data.data) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data: APIResponse<{ categories: string[]; summary: CategorySummaryDTO[] }> = await response.json();

      if (data.success && data.data) {
        setCategories(data.data.categories);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // Load data when setup is complete
  useEffect(() => {
    if (setupStatus === 'success') {
      fetchTransactions();
      fetchCategories();
    }
  }, [setupStatus, fetchTransactions, fetchCategories]);

  // Handle XML ingestion
  const handleIngest = async (xml: string) => {
    setIngesting(true);
    setNotification(null);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml }),
      });

      const data: APIResponse<IngestionResultDTO> = await response.json();

      if (data.success && data.data) {
        setNotification({
          type: 'success',
          message: `Successfully ingested ${data.data.totalSaved} transactions`,
        });
        
        // Refresh data
        await fetchTransactions();
        await fetchCategories();
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to ingest data',
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to ingest data',
      });
    } finally {
      setIngesting(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Legacy Bridge</h1>
              <p className="text-sm text-slate-400">Acme Corp Transaction Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                setupStatus === 'success' 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : setupStatus === 'error'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {setupStatus === 'success' ? 'Connected' : setupStatus === 'error' ? 'DB Error' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg border ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-current opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* XML Ingester */}
        <div className="mb-8">
          <XMLIngester onIngest={handleIngest} loading={ingesting} />
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Filter by Category</h2>
          <CategoryFilter
            categories={categories}
            summary={summary}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Transactions</h2>
            <p className="text-sm text-slate-400">
              {selectedCategory === 'all' 
                ? 'Showing all transactions' 
                : `Filtered by: ${selectedCategory}`}
            </p>
          </div>
          <TransactionTable transactions={transactions} loading={loading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            Legacy Bridge Middleware • Built with Next.js & Clean Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}
