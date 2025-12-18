/**
 * Infrastructure: Transaction Repository Implementation
 * 
 * Implements ITransactionRepository interface with PostgreSQL.
 */

import { db } from './connection';
import { Transaction } from '@/domain/entities';
import { ITransactionRepository } from '@/domain/interfaces';

interface TransactionRow {
  id: number;
  txn_id: string;
  description: string;
  raw_description: string;
  amount: string;
  currency: string;
  date: Date;
  category: string;
  merchant_id: number;
  created_at: Date;
  updated_at: Date;
}

export class TransactionRepository implements ITransactionRepository {
  private mapRowToTransaction(row: TransactionRow): Transaction {
    return {
      id: row.id,
      txnId: row.txn_id,
      description: row.description,
      rawDescription: row.raw_description,
      amount: parseFloat(row.amount),
      currency: row.currency,
      date: new Date(row.date),
      category: row.category,
      merchantId: row.merchant_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(): Promise<Transaction[]> {
    const result = await db.query<TransactionRow>(
      `SELECT t.*, m.name as merchant_name 
       FROM transactions t 
       LEFT JOIN merchants m ON t.merchant_id = m.id 
       ORDER BY t.date DESC`
    );
    return result.rows.map(this.mapRowToTransaction);
  }

  async findById(id: number): Promise<Transaction | null> {
    const result = await db.query<TransactionRow>(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapRowToTransaction(result.rows[0]) : null;
  }

  async findByTxnId(txnId: string): Promise<Transaction | null> {
    const result = await db.query<TransactionRow>(
      'SELECT * FROM transactions WHERE txn_id = $1',
      [txnId]
    );
    return result.rows[0] ? this.mapRowToTransaction(result.rows[0]) : null;
  }

  async findByCategory(category: string): Promise<Transaction[]> {
    const result = await db.query<TransactionRow>(
      'SELECT * FROM transactions WHERE category = $1 ORDER BY date DESC',
      [category]
    );
    return result.rows.map(this.mapRowToTransaction);
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const result = await db.query<TransactionRow>(
      `INSERT INTO transactions (txn_id, description, raw_description, amount, currency, date, category, merchant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (txn_id) DO UPDATE SET
         description = EXCLUDED.description,
         amount = EXCLUDED.amount,
         currency = EXCLUDED.currency,
         date = EXCLUDED.date,
         category = EXCLUDED.category,
         merchant_id = EXCLUDED.merchant_id,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        transaction.txnId,
        transaction.description,
        transaction.rawDescription || null,
        transaction.amount,
        transaction.currency,
        transaction.date,
        transaction.category || null,
        transaction.merchantId || null,
      ]
    );
    return this.mapRowToTransaction(result.rows[0]);
  }

  async saveMany(transactions: Transaction[]): Promise<Transaction[]> {
    const results: Transaction[] = [];

    await db.transaction(async (client) => {
      for (const transaction of transactions) {
        const result = await client.query<TransactionRow>(
          `INSERT INTO transactions (txn_id, description, raw_description, amount, currency, date, category, merchant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (txn_id) DO UPDATE SET
             description = EXCLUDED.description,
             amount = EXCLUDED.amount,
             currency = EXCLUDED.currency,
             date = EXCLUDED.date,
             category = EXCLUDED.category,
             merchant_id = EXCLUDED.merchant_id,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            transaction.txnId,
            transaction.description,
            transaction.rawDescription || null,
            transaction.amount,
            transaction.currency,
            transaction.date,
            transaction.category || null,
            transaction.merchantId || null,
          ]
        );
        results.push(this.mapRowToTransaction(result.rows[0]));
      }
    });

    return results;
  }

  async update(id: number, transaction: Partial<Transaction>): Promise<Transaction | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (transaction.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(transaction.description);
    }
    if (transaction.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(transaction.amount);
    }
    if (transaction.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(transaction.category);
    }

    if (fields.length === 0) return null;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await db.query<TransactionRow>(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] ? this.mapRowToTransaction(result.rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM transactions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

// Singleton instance
export const transactionRepository = new TransactionRepository();
