/**
 * Domain Entity: Merchant
 * Represents a merchant/vendor in the system
 */
export interface Merchant {
  id?: number;
  name: string;
  normalizedName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Factory function to create a valid Merchant entity
 */
export function createMerchant(name: string): Merchant {
  return {
    name: name.trim(),
    normalizedName: normalizeMerchantName(name),
  };
}

/**
 * Normalize merchant name for consistent storage and lookup
 * Removes special characters, extra spaces, and standardizes format
 */
export function normalizeMerchantName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[*#@!$%^&()_+=\[\]{}|\\:";'<>?,./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')[0]; // Get the primary merchant identifier
}
