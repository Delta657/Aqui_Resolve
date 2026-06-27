import { NextRequest, NextResponse } from 'next/server'
import { adminApp } from '@/lib/firebase-admin'
import { adminAuthorizationResponse, requireAdminPermission } from '@/lib/server/admin-authorization'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(request, 'financeiro')
    if (!adminApp) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin SDK não configurado' },
        { status: 500 }
      )
    }

    const { id: paymentId } = await params
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'ID do pagamento não informado' },
        { status: 400 }
      )
    }

    const db = adminApp.firestore()
    const paymentDoc = await db.collection('provider_payments').doc(paymentId).get()

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    const data = paymentDoc.data() || {}

    return NextResponse.json({
      success: true,
      data: {
        id: paymentDoc.id,
        ...data,
        processedAt: data.processedAt?.toDate?.()?.toISOString() || data.processedAt || null,
      },
    })
  } catch (error) {
    const denied = adminAuthorizationResponse(error)
    if (denied) return denied
    console.error('Erro ao buscar pagamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar pagamento' },
      { status: 500 }
    )
  }
}
