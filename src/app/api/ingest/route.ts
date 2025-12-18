/**
 * API Route: POST /api/ingest
 * 
 * Ingests XML transaction data from the legacy system.
 * Body: { xml: "<transactions>...</transactions>" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ingestTransactionsUseCase } from '@/application/use-cases';
import { APIResponse, IngestionResultDTO } from '@/application/dtos';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received ingestion request...');
    const body = await request.json();
    const { xml } = body;

    if (!xml) {
      const response: APIResponse<null> = {
        success: false,
        error: 'XML data is required',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    console.log('🔄 Starting ingestion process...');
    const result = await ingestTransactionsUseCase.execute(xml);

    console.log('📊 Ingestion result:', {
      success: result.success,
      totalProcessed: result.totalProcessed,
      totalSaved: result.totalSaved,
      errors: result.errors.length
    });

    const response: APIResponse<IngestionResultDTO> = {
      success: result.success,
      data: result,
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: result.success ? 200 : 207 // 207 Multi-Status for partial success
    });
  } catch (error) {
    console.error('❌ Ingestion error:', error);

    const response: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during ingestion',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
