/**
 * API Route: POST /api/setup
 * 
 * Initializes the database schema.
 * Should only be called once during initial setup.
 */

import { NextResponse } from 'next/server';
import { db, ALL_DDL } from '@/infrastructure/database';
import { APIResponse } from '@/application/dtos';

export async function POST() {
  try {
    // Execute all DDL statements
    await db.query(ALL_DDL);

    const response: APIResponse<{ message: string }> = {
      success: true,
      data: { message: 'Database schema created successfully' },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Setup error:', error);

    const response: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during setup',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}
