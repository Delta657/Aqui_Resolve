import { NextRequest, NextResponse } from 'next/server'
import { LGPDService } from '@/lib/services/lgpd-service'
import { getFirestore } from 'firebase-admin/firestore'
import { adminApp } from '@/lib/firebase-admin'

/**
 * POST /api/lgpd/rights/delete
 * Processar solicitação de exclusão de dados (direito ao esquecimento)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, userEmail, requestId, confirm } = body

    if (!userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios ausentes' },
        { status: 400 }
      )
    }

    if (confirm !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmação de exclusão é obrigatória',
        },
        { status: 400 }
      )
    }

    if (!adminApp) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin não inicializado' },
        { status: 500 }
      )
    }
    const db = getFirestore(adminApp)

    // Anonimizar ou excluir dados pessoais
    // Manter apenas dados necessários para obrigações legais (ex: faturas)

    // 1. Anonimizar dados do usuário
    await db.collection('users').doc(userId).update({
      email: `deleted_${Date.now()}@deleted.local`,
      nome: 'Usuário Excluído',
      telefone: null,
      cpf: null,
      endereco: null,
      deletedAt: new Date(),
      deletedBy: 'user_request',
    })

    // 2. Anonimizar dados em pedidos (manter para histórico financeiro)
    const ordersSnapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .get()

    const batch = db.batch()
    ordersSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        clienteNome: 'Cliente Excluído',
        telefone: null,
        endereco: null,
        anonymized: true,
        anonymizedAt: new Date(),
      })
    })
    await batch.commit()

    // 3. Revogar todos os consentimentos
    const consents = await LGPDService.getUserConsents(userId)
    for (const consent of consents) {
      if (consent.granted && !consent.revokedAt) {
        await LGPDService.revokeConsent(consent.id, userId)
      }
    }

    // 4. Atualizar solicitação se houver
    if (requestId) {
      await LGPDService.processDeletionRequest(requestId, 'system')
    }

    // 5. Log da atividade
    await LGPDService.logProcessingActivity(
      userId,
      userEmail,
      'exclusao_usuario',
      ['dados_pessoais'],
      'obrigacao_legal',
      'Dados pessoais anonimizados conforme solicitação do titular',
      undefined,
      undefined,
      { requestId, deletionType: 'anonymization' }
    )

    return NextResponse.json({
      success: true,
      message: 'Dados pessoais anonimizados com sucesso',
      note: 'Alguns dados foram mantidos de forma anonimizada para cumprimento de obrigações legais',
    })
  } catch (error: any) {
    console.error('Erro ao processar exclusão:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar exclusão',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

