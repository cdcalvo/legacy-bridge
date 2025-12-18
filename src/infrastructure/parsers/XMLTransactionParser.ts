/**
 * Infrastructure: XML Transaction Parser
 * 
 * Handles parsing of legacy XML transaction data.
 * Implements data sanitization for dirty/inconsistent data.
 */

import { parseStringPromise } from 'xml2js';
import { Transaction, createTransaction } from '@/domain/entities';

interface RawXMLTransaction {
  txn_id: string[];
  description: string[];
  amount: string[];
  currency: string[];
  date: string[];
}

interface ParsedXMLResult {
  transactions: {
    transaction: RawXMLTransaction[];
  };
}

export class XMLTransactionParser {
  /**
   * Parse XML string into Transaction entities
   */
  async parse(xmlString: string): Promise<Transaction[]> {
    try {
      const result = (await parseStringPromise(xmlString)) as ParsedXMLResult;
      const rawTransactions = result.transactions?.transaction || [];

      return rawTransactions.map((raw) => this.transformTransaction(raw));
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform raw XML transaction to domain entity
   */
  private transformTransaction(raw: RawXMLTransaction): Transaction {
    return createTransaction({
      txnId: this.sanitizeString(raw.txn_id[0]),
      description: this.sanitizeDescription(raw.description[0]),
      amount: this.sanitizeAmount(raw.amount[0]),
      currency: this.sanitizeString(raw.currency[0]),
      date: this.parseDate(raw.date[0]),
      rawDescription: raw.description[0],
    });
  }

  /**
   * Sanitize amount - handles currency symbols and formatting
   * Examples: "$5.50" -> 5.50, "1,200.00" -> 1200.00
   */
  private sanitizeAmount(amount: string): number {
    // Remove currency symbols and whitespace
    const cleaned = amount.replace(/[$€£¥,\s]/g, '');
    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      throw new Error(`Invalid amount format: ${amount}`);
    }

    return Math.round(parsed * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Sanitize description - clean up messy merchant strings
   * Examples: "AMZN Mktp US*123" -> "AMZN Mktp US"
   */
  private sanitizeDescription(description: string): string {
    return description
      .replace(/\*\d+/g, '') // Remove *123 patterns
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Parse various date formats into Date object
   * Handles: "2023/10/01", "Oct 02, 2023", "2023-10-03"
   */
  private parseDate(dateString: string): Date {
    const cleaned = dateString.trim();

    // Try ISO format: 2023-10-03
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return new Date(cleaned);
    }

    // Try slash format: 2023/10/01
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleaned)) {
      return new Date(cleaned.replace(/\//g, '-'));
    }

    // Try verbose format: Oct 02, 2023
    const verboseMatch = cleaned.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (verboseMatch) {
      const [, month, day, year] = verboseMatch;
      const monthIndex = this.getMonthIndex(month);
      if (monthIndex !== -1) {
        return new Date(parseInt(year), monthIndex, parseInt(day));
      }
    }

    // Fallback to Date constructor
    const parsed = new Date(cleaned);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    return parsed;
  }

  /**
   * Get month index from month name
   */
  private getMonthIndex(month: string): number {
    const months: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };

    return months[month.toLowerCase()] ?? -1;
  }

  /**
   * Basic string sanitization
   */
  private sanitizeString(value: string): string {
    return value?.trim() || '';
  }
}

// Singleton instance
export const xmlTransactionParser = new XMLTransactionParser();
