/**
 * Database Schema DDL Scripts
 * 
 * Normalized schema design:
 * - merchants: Stores unique merchant information
 * - transactions: Stores transaction data with foreign key to merchants
 * 
 * Design decisions:
 * - SERIAL for auto-incrementing IDs (PostgreSQL best practice)
 * - DECIMAL(15,2) for amounts to avoid floating point issues
 * - Separate merchants table for data normalization
 * - Indexes on frequently queried columns
 * - Timestamps for auditing
 */

export const CREATE_MERCHANTS_TABLE = `
CREATE TABLE IF NOT EXISTS merchants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_merchants_normalized_name ON merchants(normalized_name);
`;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  txn_id VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(500) NOT NULL,
  raw_description VARCHAR(500),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  date DATE NOT NULL,
  category VARCHAR(100),
  merchant_id INTEGER REFERENCES merchants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_txn_id ON transactions(txn_id);
`;

export const DROP_TABLES = `
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;
`;

export const ALL_DDL = `
${DROP_TABLES}
${CREATE_MERCHANTS_TABLE}
${CREATE_TRANSACTIONS_TABLE}
`;
