/**
 * Application Use Case: Ingest Transactions
 * 
 * Orchestrates the complete flow of:
 * 1. Parsing XML data
 * 2. Categorizing transactions using rule engine
 * 3. Creating/linking merchants
 * 4. Persisting to database
 * 
 * This follows the Command pattern where each use case
 * represents a single business operation.
 */

import { xmlTransactionParser } from '@/infrastructure/parsers';
import { transactionRepository, merchantRepository } from '@/infrastructure/database';
import { categoryRuleEngine } from '@/domain/rules';
import { Transaction } from '@/domain/entities';
import { IngestionResultDTO, TransactionDTO } from '../dtos';

export class IngestTransactionsUseCase {
  /**
   * Execute the ingestion process
   */
  async execute(xmlData: string): Promise<IngestionResultDTO> {
    const errors: string[] = [];
    const savedTransactions: Transaction[] = [];

    try {
      // Step 1: Parse XML
      const parsedTransactions = await xmlTransactionParser.parse(xmlData);
      
      // Step 2: Process each transaction
      const processedTransactions: Transaction[] = [];

      for (const transaction of parsedTransactions) {
        try {
          // Step 2a: Categorize using rule engine
          const category = categoryRuleEngine.categorize(transaction.description);
          transaction.category = category;

          // Step 2b: Find or create merchant
          const merchantName = this.extractMerchantName(transaction.description);
          const merchant = await merchantRepository.findOrCreate(merchantName);

          if (!merchant || !merchant.id) {
            throw new Error(`Failed to create or find merchant: ${merchantName}`);
          }

          transaction.merchantId = merchant.id;

          processedTransactions.push(transaction);
        } catch (error) {
          console.error(`Error processing transaction ${transaction.txnId}:`, error);
          errors.push(
            `Error processing transaction ${transaction.txnId}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Step 3: Save all transactions
      if (processedTransactions.length > 0) {
        try {
          console.log(`Attempting to save ${processedTransactions.length} transactions to database...`);
          const saved = await transactionRepository.saveMany(processedTransactions);
          savedTransactions.push(...saved);
          console.log(`Successfully saved ${saved.length} transactions to database`);
        } catch (error) {
          console.error('Error saving transactions to database:', error);
          throw error;
        }
      }

      return {
        success: errors.length === 0,
        totalProcessed: parsedTransactions.length,
        totalSaved: savedTransactions.length,
        errors,
        transactions: savedTransactions.map(this.toDTO),
      };
    } catch (error) {
      return {
        success: false,
        totalProcessed: 0,
        totalSaved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error during ingestion'],
        transactions: [],
      };
    }
  }

  /**
   * Extract merchant name from transaction description
   */
  private extractMerchantName(description: string): string {
    // Take the first meaningful part of the description
    const parts = description.split(/[\s*#]+/);
    return parts[0] || description;
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
export const ingestTransactionsUseCase = new IngestTransactionsUseCase();
