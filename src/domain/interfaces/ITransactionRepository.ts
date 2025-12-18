import { Transaction } from '../entities/Transaction';

/**
 * Repository Interface: TransactionRepository
 * Defines the contract for transaction data persistence
 * Following the Dependency Inversion Principle
 */
export interface ITransactionRepository {
  findAll(): Promise<Transaction[]>;
  findById(id: number): Promise<Transaction | null>;
  findByTxnId(txnId: string): Promise<Transaction | null>;
  findByCategory(category: string): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<Transaction>;
  saveMany(transactions: Transaction[]): Promise<Transaction[]>;
  update(id: number, transaction: Partial<Transaction>): Promise<Transaction | null>;
  delete(id: number): Promise<boolean>;
}
