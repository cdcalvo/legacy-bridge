/**
 * Rule Engine: CategoryRuleEngine
 * 
 * Implements the Strategy Pattern for extensible transaction categorization.
 * The engine evaluates rules from the configuration without needing modification
 * when new rules are added.
 * 
 * Design Principles:
 * - Open/Closed Principle: Open for extension, closed for modification
 * - Single Responsibility: Only handles categorization logic
 * - Dependency Injection: Rules are injected via configuration
 */

import { CategoryRule, CATEGORY_RULES, DEFAULT_CATEGORY } from './categoryRules.config';

export class CategoryRuleEngine {
  private rules: CategoryRule[];

  constructor(rules: CategoryRule[] = CATEGORY_RULES) {
    // Sort rules by priority (higher priority first)
    this.rules = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Categorize a transaction based on its description
   * @param description - The transaction description to categorize
   * @returns The matched category or default category
   */
  categorize(description: string): string {
    const upperDescription = description.toUpperCase();

    for (const rule of this.rules) {
      if (this.matchesRule(upperDescription, rule)) {
        return rule.category;
      }
    }

    return DEFAULT_CATEGORY;
  }

  /**
   * Check if a description matches a rule's keywords
   */
  private matchesRule(description: string, rule: CategoryRule): boolean {
    return rule.keywords.some((keyword) => description.includes(keyword.toUpperCase()));
  }

  /**
   * Categorize multiple transactions efficiently
   */
  categorizeMany(descriptions: string[]): string[] {
    return descriptions.map((desc) => this.categorize(desc));
  }

  /**
   * Add a new rule dynamically at runtime
   */
  addRule(rule: CategoryRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Get all current rules (useful for debugging/admin)
   */
  getRules(): CategoryRule[] {
    return [...this.rules];
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    const categories = new Set(this.rules.map((r) => r.category));
    categories.add(DEFAULT_CATEGORY);
    return Array.from(categories);
  }
}

// Singleton instance for consistent usage across the application
export const categoryRuleEngine = new CategoryRuleEngine();
