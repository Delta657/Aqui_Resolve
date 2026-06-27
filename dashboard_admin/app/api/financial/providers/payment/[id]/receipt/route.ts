import { NextRequest, NextResponse } from 'next/server'
import { adminApp, adminStorage } from '@/lib/firebase-admin'
import { adminAuthorizationResponse, requireAdminPermission } from '@/lib/server/admin-authorization'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]

interface UploadResponse {
  success: boolean
  data?: {
    fileName: string
    storagePath: string
    downloadUrl: string
    contentType: string
    size: number
    uploadedAt: string
  }
  error?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAdminPermission(request, 'operarFinanceiro')
    if (!adminApp || !adminStorage) {
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

    // Verificar se o pagamento existe
    const db = adminApp.firestore()
    const paymentDoc = await db.collection('provider_payments').doc(paymentId).get()

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipo de arquivo não permitido. Tipos aceitos: PDF, PNG, JPEG, WebP`,
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Arquivo muito grande. Máximo permitido: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB`,
        },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${timestamp}_${sanitizedName}`
    const storagePath = `provider_payments/${paymentId}/comprovantes/${fileName}`

    // Upload to Firebase Storage
    const bucket = adminStorage
    const fileRef = bucket.file(storagePath)

    const buffer = Buffer.from(await file.arrayBuffer())

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          paymentId,
          originalName: file.name,
          uploadedBy: actor.uid,
          uploadedByEmail: actor.email || '',
          uploadedAt: new Date().toISOString(),
        },
      },
    })

    // Make file publicly readable via signed URL (valid for 7 days — long enough for admin access)
    const [downloadUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Update payment document with receipt info
    const receiptData = {
      fileName,
      storagePath,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actor.uid,
      uploadedByEmail: actor.email || '',
    }

    await db.collection('provider_payments').doc(paymentId).update({
      receipts: adminApp.firestore.FieldValue.arrayUnion(receiptData),
      hasReceipt: true,
      lastReceiptAt: new Date().toISOString(),
      updatedAt: adminApp.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        storagePath,
        downloadUrl,
        contentType: file.type,
        size: file.size,
        uploadedAt: receiptData.uploadedAt,
      },
    })
  } catch (error) {
    const denied = adminAuthorizationResponse(error)
    if (denied) return denied
    console.error('Erro ao fazer upload do comprovante:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao fazer upload do comprovante',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
