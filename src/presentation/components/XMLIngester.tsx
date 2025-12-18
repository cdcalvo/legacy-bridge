'use client';

/**
 * Presentation Component: XMLIngester
 * 
 * Provides UI for ingesting XML transaction data.
 */

import { useState } from 'react';

interface XMLIngesterProps {
  onIngest: (xml: string) => Promise<void>;
  loading?: boolean;
}

const SAMPLE_XML = `<transactions>
  <transaction>
    <txn_id>tx_001</txn_id>
    <description>AMZN Mktp US*123</description>
    <amount>120.50</amount>
    <currency>USD</currency>
    <date>2023/10/01</date>
  </transaction>
  <transaction>
    <txn_id>tx_002</txn_id>
    <description>Starbucks Store 2291</description>
    <amount>$5.50</amount>
    <currency>USD</currency>
    <date>Oct 02, 2023</date>
  </transaction>
  <transaction>
    <txn_id>tx_003</txn_id>
    <description>PAYPAL *EBAY</description>
    <amount>1200.00</amount>
    <currency>EUR</currency>
    <date>2023-10-03</date>
  </transaction>
</transactions>`;

export function XMLIngester({ onIngest, loading }: XMLIngesterProps) {
  const [xml, setXml] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!xml.trim()) {
      setError('Please enter XML data');
      return;
    }

    try {
      await onIngest(xml);
      setXml('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest data');
    }
  };

  const loadSampleData = () => {
    setXml(SAMPLE_XML);
    setError(null);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Ingest Legacy XML Data</h2>
        <button
          type="button"
          onClick={loadSampleData}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Load Sample Data
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          placeholder="Paste your XML transaction data here..."
          className="w-full h-48 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />

        {error && (
          <div className="mt-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Ingest Transactions
            </>
          )}
        </button>
      </form>
    </div>
  );
}
