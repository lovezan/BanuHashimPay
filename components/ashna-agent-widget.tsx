'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import {
  buildSocietySnapshot,
  type SocietyMember,
  type SocietySnapshot,
  type SocietyTransaction,
} from '@/lib/society-snapshot'

const SCRIPT_ID = 'ashna-agent-widget-script'
const SCRIPT_SRC = 'https://app.ashna.ai/embed/agent-widget.js'
const AGENT_ID = '6aa92b64833645000a89f006'
const ASHNA_ORIGIN = 'https://app.ashna.ai'
const TOKEN =
  process.env.NEXT_PUBLIC_ASHNA_EMBED_TOKEN ||
  'eyJhbGciOiJIUzI1NiJ9.eyJhZ2VudElkIjoiNmFhOTJiNjQ4MzM2NDUwMDBhODlmMDA2IiwidXNlcklkIjoiNjdkMDdkOWJkNzAxN2MyZWJlODRhOTZjIiwiYWxsb3dlZE9yaWdpbnMiOlsiYmFudS1oYXNoaW0tcGF5LnZlcmNlbC5hcHAiXSwib3JpZ2luRG9tYWluIjoiYmFudS1oYXNoaW0tcGF5LnZlcmNlbC5hcHAiLCJhc3NpZ25lZE9yZ0lkIjoiIiwiaWF0IjoxNzg5NDcxOTE1LCJpc3MiOiJhc2huYUFJIiwiYXVkIjoiYXNobmFBSSIsInN1YiI6IjZhYTkyYjY0ODMzNjQ1MDAwYTg5ZjAwNiJ9.e6en08yNnIYqwpf6KXnDK8Xg766d5b1OLioL4SeBxLg'

declare global {
  interface Window {
    AgentWidget?: {
      destroy: () => void
      on?: (event: string, callback: (data?: unknown) => void) => void
    }
    __BANUHASHIM_AGENT_CONTEXT__?: SocietySnapshot
  }
}

function removeWidget() {
  try {
    window.AgentWidget?.destroy()
  } catch {}
  document.getElementById(SCRIPT_ID)?.remove()
  delete window.__BANUHASHIM_AGENT_CONTEXT__
}

function mountWidget() {
  if (document.getElementById(SCRIPT_ID) || window.AgentWidget) return

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = SCRIPT_SRC
  script.async = true
  script.setAttribute('data-agent-id', AGENT_ID)
  script.setAttribute('data-token', TOKEN)
  script.setAttribute('data-view', 'sidebar')
  script.setAttribute('data-icon-color', '#b49a88')
  script.setAttribute('data-icon-shape', 'circle')
  script.setAttribute('data-icon-style', 'message-circle')
  script.setAttribute('data-position', 'right')
  script.setAttribute(
    'data-theme',
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  document.body.appendChild(script)
}

function findWidgetIframe() {
  const hosts = document.querySelectorAll('ashna-agent-widget')
  for (const host of hosts) {
    const iframe = host.shadowRoot?.querySelector('iframe')
    if (iframe instanceof HTMLIFrameElement) return iframe
  }
  return document.querySelector<HTMLIFrameElement>('iframe[title="AshnaAI Chat"]')
}

function postContextToIframe(snapshot: SocietySnapshot, accessToken: string) {
  const iframe = findWidgetIframe()
  const target = iframe?.contentWindow
  if (!target) return false

  const contextUrl = `${window.location.origin}/api/agent/society`
  const payload = {
    source: 'banuhashim-pay',
    type: 'ashna:page-context',
    context: snapshot.briefing,
    data: snapshot,
    accessToken,
    contextUrl,
  }

  target.postMessage(payload, ASHNA_ORIGIN)
  target.postMessage({ ...payload, type: 'page-context' }, ASHNA_ORIGIN)
  target.postMessage({ ...payload, type: 'ashna:context' }, ASHNA_ORIGIN)
  target.postMessage(
    {
      source: 'banuhashim-pay',
      type: 'ashna:auth',
      accessToken,
      contextUrl,
      user: snapshot.viewer,
    },
    ASHNA_ORIGIN,
  )

  return true
}

function toMillis(value: unknown) {
  if (!value) return Date.now()
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime()
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime()
  }
  return Date.now()
}

export default function AshnaAgentWidget() {
  const [briefing, setBriefing] = useState('')

  useEffect(() => {
    let cancelled = false
    let accessToken = ''
    let snapshot: SocietySnapshot | null = null
    let members: SocietyMember[] = []
    let transactions: SocietyTransaction[] = []
    let monthlyAmount = 30
    let viewer: User | null = null
    let deliverTimer: number | null = null

    const rebuild = () => {
      if (!viewer) return
      snapshot = buildSocietySnapshot({
        viewer: {
          uid: viewer.uid,
          email: viewer.email,
          displayName: viewer.displayName,
        },
        members,
        transactions,
        monthlyAmount,
      })
      window.__BANUHASHIM_AGENT_CONTEXT__ = snapshot
      setBriefing(snapshot.briefing)
      queueDeliver()
    }

    const deliver = () => {
      if (cancelled || !snapshot || !accessToken) return
      postContextToIframe(snapshot, accessToken)
    }

    const queueDeliver = () => {
      if (deliverTimer) window.clearTimeout(deliverTimer)
      deliverTimer = window.setTimeout(deliver, 300)
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== ASHNA_ORIGIN) return
      const type = typeof event.data === 'string' ? event.data : event.data?.type || event.data?.event
      if (!type) return
      const requested = String(type).toLowerCase()
      if (
        requested.includes('context') ||
        requested.includes('ready') ||
        requested.includes('auth') ||
        requested.includes('parent')
      ) {
        deliver()
      }
    }

    window.addEventListener('message', onMessage)

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      viewer = user
      if (!user) {
        accessToken = ''
        snapshot = null
        setBriefing('')
        removeWidget()
        return
      }

      mountWidget()
      accessToken = await user.getIdToken()
      rebuild()
      window.AgentWidget?.on?.('ready', deliver)
      window.AgentWidget?.on?.('open', deliver)
    })

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (result) => {
      members = result.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          displayName: data.displayName || 'Unknown',
          email: data.email || '',
          role: data.role || 'member',
        }
      })
      rebuild()
    })

    const unsubTxns = onSnapshot(query(collection(db, 'transactions')), (result) => {
      transactions = result.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || 'Unknown',
          amount: Number(data.amount) || 0,
          reason: data.reason || '',
          timestamp: toMillis(data.timestamp),
        }
      })
      rebuild()
    })

    const unsubSettings = onSnapshot(query(collection(db, 'settings')), (result) => {
      const global = result.docs.find((doc) => doc.id === 'global')
      const amount = Number(global?.data()?.monthlyPaymentAmount)
      monthlyAmount = Number.isFinite(amount) ? amount : 30
      rebuild()
    })

    const tokenTimer = window.setInterval(async () => {
      if (!auth.currentUser) return
      accessToken = await auth.currentUser.getIdToken(true)
      queueDeliver()
    }, 10 * 60 * 1000)

    const iframeWatcher = window.setInterval(() => {
      if (findWidgetIframe()) {
        deliver()
      }
    }, 1500)

    return () => {
      cancelled = true
      window.removeEventListener('message', onMessage)
      unsubAuth()
      unsubUsers()
      unsubTxns()
      unsubSettings()
      window.clearInterval(tokenTimer)
      window.clearInterval(iframeWatcher)
      if (deliverTimer) window.clearTimeout(deliverTimer)
      removeWidget()
    }
  }, [])

  if (!briefing) return null

  return (
    <div className="sr-only" aria-hidden="true" data-banuhashim-agent-context="true">
      {briefing}
    </div>
  )
}
