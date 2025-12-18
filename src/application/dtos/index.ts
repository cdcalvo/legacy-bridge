/**
 * Application Layer: Data Transfer Objects (DTOs)
 * 
 * DTOs define the shape of data exchanged between layers.
 * They provide a clean contract for API responses.
 */

export interface TransactionDTO {
  id: number;
  txnId: string;
  description: string;
  rawDescription: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  merchantId: number | null;
}

export interface MerchantDTO {
  id: number;
  name: string;
  normalizedName: string;
}

export interface IngestionResultDTO {
  success: boolean;
  totalProcessed: number;
  totalSaved: number;
  errors: string[];
  transactions: TransactionDTO[];
}

export interface CategorySummaryDTO {
  category: string;
  count: number;
  totalAmount: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
