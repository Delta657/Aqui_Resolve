import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import * as admin from 'firebase-admin'

// GET /api/client-chats?status=active|archived&unreadOnly=true&limit=100
// Lista os chats com paginação simples (ordenados por lastMessageAt desc).
export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'active'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500)

    let query = db
      .collection('client_chats')
      .orderBy('lastMessageAt', 'desc')
      .limit(limit) as admin.firestore.Query

    if (status === 'archived') {
      query = query.where('archived', '==', true)
    } else if (status === 'active') {
      query = query.where('archived', '==', false)
    }

    if (unreadOnly) {
      query = query.where('unreadByAdmin', '>', 0)
    }

    const snap = await query.get()
    const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    return NextResponse.json({ success: true, chats })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
