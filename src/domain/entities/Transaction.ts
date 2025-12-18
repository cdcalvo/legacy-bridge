/**
 * Domain Entity: Transaction
 * Represents a financial transaction in the system
 * This is a pure domain object with no external dependencies
 */
export interface Transaction {
  id?: number;
  txnId: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  merchantId?: number;
  category?: string;
  rawDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Factory function to create a valid Transaction entity
 */
export function createTransaction(params: {
  txnId: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  merchantId?: number;
  category?: string;
  rawDescription?: string;
}): Transaction {
  return {
    txnId: params.txnId,
    description: params.description.trim(),
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    date: params.date,
    merchantId: params.merchantId,
    category: params.category,
    rawDescription: params.rawDescription,
  };
}
