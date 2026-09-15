import { NextRequest, NextResponse } from 'next/server'
import { firebaseConfig } from '@/lib/firebase-config'
import {
  isValidAgentDataKey,
  loadSocietySnapshotAsAgent,
  loadSocietySnapshotFromToken,
} from '@/lib/load-society-snapshot'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ORIGINS = [
  'https://app.ashna.ai',
  'https://banu-hashim-pay.vercel.app',
]

function isAllowedOrigin(origin: string) {
  return (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  )
}

function corsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const allowOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

function readBearer(request: NextRequest) {
  const header = request.headers.get('authorization') || ''
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim()
  }
  return request.nextUrl.searchParams.get('access_token')?.trim() || ''
}

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request)
  const agentKey = request.nextUrl.searchParams.get('key')
  const idToken = readBearer(request)

  try {
    if (isValidAgentDataKey(agentKey)) {
      const snapshot = await loadSocietySnapshotAsAgent()
      return NextResponse.json(snapshot, { headers })
    }

    if (!idToken) {
      return NextResponse.json(
        { error: 'This URL needs the Ashna data key or a signed-in Firebase token.' },
        { status: 401, headers },
      )
    }

    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        cache: 'no-store',
      },
    )

    const identity = await lookup.json()
    const user = identity.users?.[0]
    if (!lookup.ok || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired login.' },
        { status: 401, headers },
      )
    }

    const snapshot = await loadSocietySnapshotFromToken(idToken, {
      uid: user.localId,
      email: user.email || null,
      displayName: user.displayName || null,
    })

    return NextResponse.json(snapshot, { headers })
  } catch (error) {
    console.error('[agent-society]', error)
    return NextResponse.json(
      { error: 'Could not load society records.' },
      { status: 500, headers },
    )
  }
}
