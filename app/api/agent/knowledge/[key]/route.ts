import { NextRequest, NextResponse } from 'next/server'
import { isValidAgentDataKey, loadSocietySnapshotAsAgent } from '@/lib/load-society-snapshot'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function knowledgeHtml(briefing: string) {
  const escaped = briefing
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Banuhashim Society live payment records</title>
  <meta name="robots" content="noindex, nofollow" />
</head>
<body>
  <article>
    <h1>Banuhashim Society live payment book</h1>
    <p>Full live Firebase records: every member, paid and unpaid for each month, and every transaction.</p>
    <pre>${escaped}</pre>
  </article>
</body>
</html>`
}

async function handleKnowledgeRequest(key: string | undefined) {
  if (!process.env.ASHNA_AGENT_DATA_KEY || !process.env.FIREBASE_AGENT_EMAIL || !process.env.FIREBASE_AGENT_PASSWORD) {
    return NextResponse.json(
      { error: 'Agent data source is not configured on the server.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  if (!isValidAgentDataKey(key)) {
    return NextResponse.json(
      { error: 'Invalid data key.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const snapshot = await loadSocietySnapshotAsAgent()
    return new NextResponse(knowledgeHtml(snapshot.briefing), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[agent-knowledge]', error)
    return NextResponse.json(
      { error: 'Could not load live society records from Firebase.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params
  return handleKnowledgeRequest(key || request.nextUrl.searchParams.get('key') || undefined)
}
