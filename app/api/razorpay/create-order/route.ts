import { NextRequest, NextResponse } from 'next/server'

// This endpoint was part of a removed integration. Keep a safe fallback
// to avoid runtime errors from client calls that may still exist.
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This payment integration has been removed' },
    { status: 410 }
  )
}

