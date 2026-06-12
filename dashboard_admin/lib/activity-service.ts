import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface ActivityData {
  type: 'order_completed' | 'new_provider' | 'order_cancelled' | 'payment_received' | 'new_order' | 'new_client' | 'rating_received' | 'message_received' | 'provider_verified'
  title: string
  description: string
  metadata?: {
    orderId?: string
    providerId?: string
    clientId?: string
    amount?: number
    rating?: number
    messageId?: string
  }
}

export class ActivityService {
  static async addActivity(activity: ActivityData): Promise<void> {
    if (!db) {
      console.warn('Firestore não inicializado')
      return
    }

    try {
      const activitiesRef = collection(db, 'activities')
      await addDoc(activitiesRef, {
        ...activity,
        timestamp: Timestamp.now()
      })
      console.log('✅ Atividade adicionada:', activity.title)
    } catch (error) {
      console.error('❌ Erro ao adicionar atividade:', error)
    }
  }

  static async onOrderCompleted(orderData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'order_completed',
      title: `Pedido #${orderData.id} concluído`,
      description: `${orderData.providerName || 'Prestador'} finalizou o serviço de ${orderData.serviceType || 'serviço'} para ${orderData.clientName || 'Cliente'}`,
      metadata: {
        orderId: orderData.id,
        providerId: orderData.providerId,
        clientId: orderData.clientId
      }
    }
    await this.addActivity(activity)
  }

  static async onNewProvider(providerData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'new_provider',
      title: 'Novo prestador verificado',
      description: `${providerData.name} foi aprovado como prestador de serviços`,
      metadata: {
        providerId: providerData.id
      }
    }
    await this.addActivity(activity)
  }

  static async onOrderCancelled(orderData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'order_cancelled',
      title: `Pedido #${orderData.id} cancelado`,
      description: orderData.cancelledBy === 'client' 
        ? `Cliente cancelou o serviço de ${orderData.serviceType || 'serviço'}`
        : `Prestador cancelou o serviço de ${orderData.serviceType || 'serviço'}`,
      metadata: {
        orderId: orderData.id,
        providerId: orderData.providerId,
        clientId: orderData.clientId
      }
    }
    await this.addActivity(activity)
  }

  static async onPaymentReceived(paymentData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'payment_received',
      title: 'Pagamento recebido',
      description: `R$ ${paymentData.amount?.toFixed(2)} recebido pelo pedido #${paymentData.orderId}`,
      metadata: {
        orderId: paymentData.orderId,
        amount: paymentData.amount
      }
    }
    await this.addActivity(activity)
  }

  static async onNewOrder(orderData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'new_order',
      title: 'Novo pedido criado',
      description: `Pedido #${orderData.id} - ${orderData.serviceType || 'Serviço'} em ${orderData.location || 'Local não especificado'}`,
      metadata: {
        orderId: orderData.id,
        clientId: orderData.clientId
      }
    }
    await this.addActivity(activity)
  }

  static async onNewClient(clientData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'new_client',
      title: 'Novo cliente cadastrado',
      description: `${clientData.name} se registrou no aplicativo`,
      metadata: {
        clientId: clientData.id
      }
    }
    await this.addActivity(activity)
  }

  static async onRatingReceived(ratingData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'rating_received',
      title: `Avaliação ${ratingData.rating} estrelas`,
      description: `Cliente avaliou o serviço do pedido #${ratingData.orderId} com ${ratingData.rating} estrelas`,
      metadata: {
        orderId: ratingData.orderId,
        rating: ratingData.rating,
        providerId: ratingData.providerId
      }
    }
    await this.addActivity(activity)
  }

  static async onMessageReceived(messageData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'message_received',
      title: 'Nova mensagem',
      description: `Mensagem recebida de ${messageData.senderName || 'Usuário'}`,
      metadata: {
        messageId: messageData.id,
        orderId: messageData.orderId
      }
    }
    await this.addActivity(activity)
  }

  static async onProviderVerified(providerData: any): Promise<void> {
    const activity: ActivityData = {
      type: 'provider_verified',
      title: 'Prestador verificado',
      description: `${providerData.name} teve seus documentos verificados e aprovados`,
      metadata: {
        providerId: providerData.id
      }
    }
    await this.addActivity(activity)
  }
}
