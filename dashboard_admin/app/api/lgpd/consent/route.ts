import { NextRequest, NextResponse } from 'next/server'
import { LGPDService } from '@/lib/services/lgpd-service'
import type { ConsentType } from '@/types/lgpd'

/**
 * POST /api/lgpd/consent
 * Registrar ou revogar consentimento
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, userEmail, consentType, action, version, consentId } = body

    if (!userId || !userEmail || !consentType) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios ausentes' },
        { status: 400 }
      )
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    if (action === 'grant') {
      if (!version) {
        return NextResponse.json(
          { success: false, error: 'Versão da política é obrigatória' },
          { status: 400 }
        )
      }

      const consentId = await LGPDService.grantConsent(
        userId,
        userEmail,
        consentType as ConsentType,
        version,
        ipAddress,
        userAgent
      )

      return NextResponse.json({
        success: true,
        message: 'Consentimento registrado com sucesso',
        consentId,
      })
    } else if (action === 'revoke') {
      if (!consentId) {
        return NextResponse.json(
          { success: false, error: 'ID do consentimento é obrigatório' },
          { status: 400 }
        )
      }

      await LGPDService.revokeConsent(consentId, userId, ipAddress, userAgent)

      return NextResponse.json({
        success: true,
        message: 'Consentimento revogado com sucesso',
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Ação inválida' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao processar consentimento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar consentimento',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/lgpd/consent
 * Verificar consentimentos do usuário
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const consentType = searchParams.get('consentType')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    if (consentType) {
      const hasConsent = await LGPDService.hasConsent(
        userId,
        consentType as ConsentType
      )
      return NextResponse.json({
        success: true,
        hasConsent,
      })
    } else {
      const consents = await LGPDService.getUserConsents(userId)
      return NextResponse.json({
        success: true,
        consents,
      })
    }
  } catch (error: any) {
    console.error('Erro ao buscar consentimentos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar consentimentos',
        details: error.message,
      },
      { status: 500 }
    )
  }
}


