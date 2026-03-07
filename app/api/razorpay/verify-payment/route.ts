import { NextRequest, NextResponse } from 'next/server'

// This endpoint belonged to a removed integration. Provide a safe fallback.
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This payment integration has been removed' },
    { status: 410 }
  )
}

