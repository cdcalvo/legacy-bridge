import { Merchant } from '../entities/Merchant';

/**
 * Repository Interface: MerchantRepository
 * Defines the contract for merchant data persistence
 */
export interface IMerchantRepository {
  findAll(): Promise<Merchant[]>;
  findById(id: number): Promise<Merchant | null>;
  findByNormalizedName(normalizedName: string): Promise<Merchant | null>;
  save(merchant: Merchant): Promise<Merchant>;
  findOrCreate(name: string): Promise<Merchant>;
}
