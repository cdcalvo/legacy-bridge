-- ============================================
-- Legacy Bridge - Database Schema DDL
-- PostgreSQL Schema for Transaction Management
-- ============================================

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;

-- ============================================
-- MERCHANTS TABLE
-- ============================================
-- Stores unique merchant/vendor information
-- Normalized to avoid data redundancy
-- ============================================
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique merchants by normalized name
    CONSTRAINT uq_merchants_normalized_name UNIQUE (normalized_name)
);

-- Index for fast merchant lookups
CREATE INDEX idx_merchants_normalized_name ON merchants(normalized_name);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
-- Stores individual transaction records
-- Foreign key to merchants for normalization
-- ============================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    txn_id VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    raw_description VARCHAR(500),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    date DATE NOT NULL,
    category VARCHAR(100),
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique transaction IDs
    CONSTRAINT uq_transactions_txn_id UNIQUE (txn_id),
    
    -- Ensure valid amounts
    CONSTRAINT chk_transactions_amount_positive CHECK (amount >= 0),
    
    -- Ensure valid currency codes (ISO 4217)
    CONSTRAINT chk_transactions_currency_length CHECK (LENGTH(currency) = 3)
);

-- Indexes for common query patterns
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_txn_id ON transactions(txn_id);

-- ============================================
-- SCHEMA DESIGN RATIONALE
-- ============================================
-- 
-- 1. NORMALIZATION (3NF):
--    - Merchants are stored separately to avoid duplication
--    - Each transaction references a merchant via foreign key
--    - This allows for merchant-level analytics
--
-- 2. DATA TYPES:
--    - DECIMAL(15,2) for amounts: Avoids floating-point precision issues
--    - VARCHAR(3) for currency: Follows ISO 4217 standard
--    - TIMESTAMP WITH TIME ZONE: Ensures timezone awareness
--
-- 3. CONSTRAINTS:
--    - Unique transaction IDs prevent duplicate imports
--    - Foreign key with ON DELETE SET NULL preserves transactions
--    - Check constraints ensure data integrity
--
-- 4. INDEXES:
--    - Category index: Fast filtering by spending category
--    - Date index: Efficient date range queries
--    - Merchant index: Quick merchant lookups
--
-- 5. SCALABILITY CONSIDERATIONS:
--    - SERIAL IDs for efficient inserts
--    - Normalized design reduces storage requirements
--    - Indexes optimized for expected query patterns
-- ============================================
