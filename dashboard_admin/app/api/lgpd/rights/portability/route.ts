import { NextRequest, NextResponse } from 'next/server'
import { LGPDService } from '@/lib/services/lgpd-service'
import { getFirestore } from 'firebase-admin/firestore'
import { adminApp } from '@/lib/firebase-admin'

/**
 * GET /api/lgpd/rights/portability
 * Exportar dados do usuário em formato estruturado (direito à portabilidade)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const format = searchParams.get('format') || 'json'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
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

    // Coletar todos os dados do usuário
    const exportData: any = {
      exportDate: new Date().toISOString(),
      userId,
      format: 'LGPD_PORTABILITY_V1',
      data: {},
    }

    // Dados de usuário
    const userDoc = await db.collection('users').doc(userId).get()
    if (userDoc.exists) {
      const userData = userDoc.data()
      const { password, senhaHash, ...safeUserData } = userData || {}
      exportData.data.user = safeUserData
    }

    // Dados de pedidos
    const ordersSnapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .get()
    exportData.data.orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Consentimentos
    const consents = await LGPDService.getUserConsents(userId)
    exportData.data.consents = consents

    // Logs de processamento
    const processingLogs = await LGPDService.getUserProcessingLogs(userId)
    exportData.data.processingLogs = processingLogs

    // Solicitações de direitos
    const requests = await LGPDService.getUserRequests(userId)
    exportData.data.requests = requests

    // Criar solicitação de portabilidade
    await LGPDService.createDataSubjectRequest(
      userId,
      exportData.data.user?.email || '',
      'portabilidade',
      'Exportação de dados para portabilidade'
    )

    // Log da atividade
    await LGPDService.logProcessingActivity(
      userId,
      exportData.data.user?.email || '',
      'exportacao_dados',
      ['dados_pessoais'],
      'obrigacao_legal',
      'Exportação de dados para portabilidade',
      undefined,
      undefined,
      { format }
    )

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
      })
    } else if (format === 'csv') {
      // Implementar conversão para CSV se necessário
      return NextResponse.json({
        success: false,
        error: 'Formato CSV ainda não implementado',
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Formato não suportado',
      })
    }
  } catch (error: any) {
    console.error('Erro ao exportar dados:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao exportar dados',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

