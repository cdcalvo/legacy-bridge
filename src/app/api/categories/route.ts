/**
 * API Route: GET /api/categories
 * 
 * Returns available categories and summary statistics.
 */

import { NextResponse } from 'next/server';
import { getTransactionsUseCase } from '@/application/use-cases';
import { categoryRuleEngine } from '@/domain/rules';
import { APIResponse, CategorySummaryDTO } from '@/application/dtos';

export async function GET() {
  try {
    // Get category statistics from existing transactions
    const summary = await getTransactionsUseCase.getCategorySummary();
    
    // Get all possible categories from the rule engine
    const allCategories = categoryRuleEngine.getCategories();

    const response: APIResponse<{
      categories: string[];
      summary: CategorySummaryDTO[];
    }> = {
      success: true,
      data: {
        categories: allCategories,
        summary,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    const response: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
