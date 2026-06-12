import { NextRequest, NextResponse } from 'next/server'
import { PagarmeWebhook } from '@/types/pagarme'
import { PagarmeFirebaseSync } from '@/lib/services/pagarme-firebase-sync'

/**
 * POST /api/pagarme/webhooks
 * Recebe webhooks do Pagar.me e sincroniza com Firebase
 */
export async function POST(request: NextRequest) {
  try {
    const webhook: PagarmeWebhook = await request.json()

    console.log('📥 Webhook recebido:', {
      id: webhook.id,
      type: webhook.type,
      created_at: webhook.created_at,
    })

    // Processar o webhook baseado no tipo
    switch (webhook.type) {
      case 'charge.paid':
        console.log('✅ Cobrança paga:', webhook.data.id)
        await PagarmeFirebaseSync.saveCharge(webhook.data)
        // TODO: Enviar email de confirmação
        // TODO: Liberar acesso/produto
        break

      case 'charge.failed':
        console.log('❌ Cobrança falhou:', webhook.data.id)
        await PagarmeFirebaseSync.saveCharge(webhook.data)
        // TODO: Notificar cliente
        break

      case 'charge.refunded':
        console.log('↩️ Cobrança reembolsada:', webhook.data.id)
        await PagarmeFirebaseSync.saveCharge(webhook.data)
        // TODO: Processar reembolso
        // TODO: Notificar cliente
        break

      case 'subscription.created':
        console.log('🔄 Assinatura criada:', webhook.data.id)
        await PagarmeFirebaseSync.saveSubscription(webhook.data)
        // TODO: Ativar assinatura
        // TODO: Liberar acesso
        break

      case 'subscription.canceled':
        console.log('🚫 Assinatura cancelada:', webhook.data.id)
        await PagarmeFirebaseSync.saveSubscription(webhook.data)
        // TODO: Desativar assinatura
        // TODO: Revogar acesso
        break

      case 'order.paid':
        console.log('✅ Pedido pago:', webhook.data.id)
        await PagarmeFirebaseSync.saveOrder(webhook.data)
        // TODO: Processar pedido
        break

      case 'order.canceled':
        console.log('🚫 Pedido cancelado:', webhook.data.id)
        await PagarmeFirebaseSync.saveOrder(webhook.data)
        break

      default:
        console.log('ℹ️ Tipo de webhook não tratado:', webhook.type)
    }

    // Registrar log de sucesso
    await PagarmeFirebaseSync.logSync('webhook', 1, 'success', { type: webhook.type })

    // Sempre retornar 200 para o Pagar.me
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processado e sincronizado com Firebase',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    
    // Registrar log de erro
    try {
      await PagarmeFirebaseSync.logSync('webhook', 1, 'error', { error: String(error) })
    } catch {}
    
    // Mesmo com erro, retornar 200 para não ficar reenviando
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar webhook',
      },
      { status: 200 }
    )
  }
}

