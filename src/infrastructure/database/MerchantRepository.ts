/**
 * Infrastructure: Merchant Repository Implementation
 * 
 * Implements IMerchantRepository interface with PostgreSQL.
 */

import { db } from './connection';
import { Merchant, createMerchant, normalizeMerchantName } from '@/domain/entities';
import { IMerchantRepository } from '@/domain/interfaces';

export class MerchantRepository implements IMerchantRepository {
  async findAll(): Promise<Merchant[]> {
    const result = await db.query<Merchant>(
      'SELECT id, name, normalized_name as "normalizedName", created_at as "createdAt", updated_at as "updatedAt" FROM merchants ORDER BY name'
    );
    return result.rows;
  }

  async findById(id: number): Promise<Merchant | null> {
    const result = await db.query<Merchant>(
      'SELECT id, name, normalized_name as "normalizedName", created_at as "createdAt", updated_at as "updatedAt" FROM merchants WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByNormalizedName(normalizedName: string): Promise<Merchant | null> {
    const result = await db.query<Merchant>(
      'SELECT id, name, normalized_name as "normalizedName", created_at as "createdAt", updated_at as "updatedAt" FROM merchants WHERE normalized_name = $1',
      [normalizedName.toUpperCase()]
    );
    return result.rows[0] || null;
  }

  async save(merchant: Merchant): Promise<Merchant> {
    const result = await db.query<Merchant>(
      `INSERT INTO merchants (name, normalized_name) 
       VALUES ($1, $2) 
       RETURNING id, name, normalized_name as "normalizedName", created_at as "createdAt", updated_at as "updatedAt"`,
      [merchant.name, merchant.normalizedName]
    );
    return result.rows[0];
  }

  async findOrCreate(name: string): Promise<Merchant> {
    const normalizedName = normalizeMerchantName(name);
    
    // Try to find existing merchant
    const existing = await this.findByNormalizedName(normalizedName);
    if (existing) {
      return existing;
    }

    // Create new merchant
    const merchant = createMerchant(name);
    return this.save(merchant);
  }
}

// Singleton instance
export const merchantRepository = new MerchantRepository();
