/**
 * Application Use Case: Get Transactions
 * 
 * Handles retrieval of transactions with optional filtering.
 */

import { transactionRepository } from '@/infrastructure/database';
import { Transaction } from '@/domain/entities';
import { TransactionDTO, CategorySummaryDTO } from '../dtos';

export class GetTransactionsUseCase {
  /**
   * Get all transactions, optionally filtered by category
   */
  async execute(category?: string): Promise<TransactionDTO[]> {
    let transactions: Transaction[];

    if (category && category !== 'all') {
      transactions = await transactionRepository.findByCategory(category);
    } else {
      transactions = await transactionRepository.findAll();
    }

    return transactions.map(this.toDTO);
  }

  /**
   * Get category summary statistics
   */
  async getCategorySummary(): Promise<CategorySummaryDTO[]> {
    const transactions = await transactionRepository.findAll();
    
    const summaryMap = new Map<string, { count: number; totalAmount: number }>();

    for (const transaction of transactions) {
      const category = transaction.category || 'Uncategorized';
      const existing = summaryMap.get(category) || { count: 0, totalAmount: 0 };
      
      summaryMap.set(category, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + transaction.amount,
      });
    }

    return Array.from(summaryMap.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      totalAmount: Math.round(stats.totalAmount * 100) / 100,
    }));
  }

  /**
   * Convert Transaction entity to DTO
   */
  private toDTO(transaction: Transaction): TransactionDTO {
    return {
      id: transaction.id!,
      txnId: transaction.txnId,
      description: transaction.description,
      rawDescription: transaction.rawDescription || '',
      amount: transaction.amount,
      currency: transaction.currency,
      date: transaction.date.toISOString().split('T')[0],
      category: transaction.category || 'Uncategorized',
      merchantId: transaction.merchantId || null,
    };
  }
}

// Singleton instance
export const getTransactionsUseCase = new GetTransactionsUseCase();
