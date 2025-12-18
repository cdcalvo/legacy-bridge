/**
 * Category Rules Configuration
 * 
 * This is the extensible rule configuration that allows adding new
 * categorization rules without modifying the core engine logic.
 * 
 * To add a new rule:
 * 1. Add a new entry to the CATEGORY_RULES array
 * 2. Define the keywords that trigger the category
 * 3. Optionally set a priority (higher = evaluated first)
 */

export interface CategoryRule {
  category: string;
  keywords: string[];
  priority?: number;
  description?: string;
}

/**
 * Extensible rules configuration
 * Add new rules here without modifying the rule engine
 */
export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'eCommerce',
    keywords: ['AMZN', 'AMAZON', 'EBAY', 'PAYPAL', 'ETSY', 'SHOPIFY', 'ALIBABA'],
    priority: 10,
    description: 'Online shopping and marketplaces',
  },
  {
    category: 'Transport & Food',
    keywords: ['STARBUCKS', 'UBER', 'LYFT', 'DOORDASH', 'GRUBHUB', 'MCDONALD', 'SUBWAY'],
    priority: 10,
    description: 'Transportation and food services',
  },
  {
    category: 'Entertainment',
    keywords: ['NETFLIX', 'SPOTIFY', 'HULU', 'DISNEY', 'HBO', 'APPLE MUSIC', 'YOUTUBE'],
    priority: 5,
    description: 'Streaming and entertainment services',
  },
  {
    category: 'Travel',
    keywords: ['AIRLINE', 'HOTEL', 'AIRBNB', 'BOOKING', 'EXPEDIA', 'MARRIOTT', 'HILTON'],
    priority: 5,
    description: 'Travel and accommodation',
  },
  {
    category: 'Utilities',
    keywords: ['ELECTRIC', 'GAS', 'WATER', 'INTERNET', 'PHONE', 'MOBILE', 'COMCAST', 'ATT'],
    priority: 3,
    description: 'Utility bills and services',
  },
];

/**
 * Default category when no rules match
 */
export const DEFAULT_CATEGORY = 'Uncategorized';
