import { firebaseConfig } from '@/lib/firebase-config'
import {
  buildSocietySnapshot,
  type SocietyMember,
  type SocietySnapshot,
  type SocietyTransaction,
} from '@/lib/society-snapshot'

function decodeFirestoreValue(value: any): any {
  if (!value || typeof value !== 'object') return null
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('booleanValue' in value) return value.booleanValue
  if ('timestampValue' in value) return value.timestampValue
  if ('nullValue' in value) return null
  return null
}

function decodeDocument(doc: { name?: string; fields?: Record<string, any> }) {
  const id = doc.name?.split('/').pop() || ''
  const fields: Record<string, any> = {}
  for (const [key, value] of Object.entries(doc.fields || {})) {
    fields[key] = decodeFirestoreValue(value)
  }
  return { id, ...fields }
}

async function firestoreList(idToken: string, collection: string, pageSize = 300) {
  const documents: Array<{ id: string; [key: string]: any }> = []
  let pageToken = ''

  for (let i = 0; i < 8; i++) {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}`,
    )
    url.searchParams.set('pageSize', String(pageSize))
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: 'no-store',
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Firestore ${collection} failed: ${response.status} ${detail.slice(0, 200)}`)
    }

    const payload = await response.json()
    for (const item of payload.documents || []) {
      documents.push(decodeDocument(item))
    }

    pageToken = payload.nextPageToken || ''
    if (!pageToken) break
  }

  return documents
}

export async function signInAgentUser() {
  const email = process.env.FIREBASE_AGENT_EMAIL
  const password = process.env.FIREBASE_AGENT_PASSWORD
  if (!email || !password) {
    throw new Error('FIREBASE_AGENT_EMAIL and FIREBASE_AGENT_PASSWORD are not set')
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      cache: 'no-store',
    },
  )

  const payload = await response.json()
  if (!response.ok || !payload.idToken) {
    throw new Error(payload.error?.message || 'Agent Firebase login failed')
  }

  return {
    idToken: payload.idToken as string,
    uid: payload.localId as string,
    email: (payload.email as string) || email,
    displayName: (payload.displayName as string) || 'Ashna Agent',
  }
}

export async function loadSocietySnapshotFromToken(
  idToken: string,
  viewer: { uid: string; email: string | null; displayName: string | null },
): Promise<SocietySnapshot> {
  const [userDocs, txnDocs, settingsDocs] = await Promise.all([
    firestoreList(idToken, 'users'),
    firestoreList(idToken, 'transactions'),
    firestoreList(idToken, 'settings'),
  ])

  const members: SocietyMember[] = userDocs.map((doc) => ({
    id: doc.id,
    displayName: doc.displayName || 'Unknown',
    email: doc.email || '',
    role: doc.role || 'member',
  }))

  const transactions: SocietyTransaction[] = txnDocs.map((doc) => {
    const raw = doc.timestamp
    const timestamp =
      typeof raw === 'number' ? raw : raw ? new Date(raw).getTime() : Date.now()
    return {
      id: doc.id,
      userId: doc.userId || '',
      userName: doc.userName || 'Unknown',
      amount: Number(doc.amount) || 0,
      reason: doc.reason || '',
      timestamp,
    }
  })

  const settings = settingsDocs.find((doc) => doc.id === 'global')
  const monthlyAmount = Number(settings?.monthlyPaymentAmount) || 30

  return buildSocietySnapshot({
    viewer,
    members,
    transactions,
    monthlyAmount,
  })
}

export async function loadSocietySnapshotAsAgent() {
  const agent = await signInAgentUser()
  return loadSocietySnapshotFromToken(agent.idToken, {
    uid: agent.uid,
    email: agent.email,
    displayName: agent.displayName,
  })
}

export function isValidAgentDataKey(key: string | undefined | null) {
  const expected = process.env.ASHNA_AGENT_DATA_KEY
  if (!key || !expected) return false
  return key === expected
}
