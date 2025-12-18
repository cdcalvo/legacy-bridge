/**
 * API Route: GET /api/transactions
 * 
 * Returns all transactions, with optional category filter.
 * Query params: ?category=eCommerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsUseCase } from '@/application/use-cases';
import { APIResponse, TransactionDTO } from '@/application/dtos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const transactions = await getTransactionsUseCase.execute(category);

    const response: APIResponse<TransactionDTO[]> = {
      success: true,
      data: transactions,
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
