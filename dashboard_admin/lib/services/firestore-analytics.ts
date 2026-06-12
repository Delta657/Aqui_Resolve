import { getCollection, listenToCollection } from '../firestore'
import { where, orderBy, limit, Timestamp } from 'firebase/firestore'

export interface OrderData {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  address: string
  complement: string
  description: string
  isEmergency: boolean
  status: string
  serviceType?: string
  clientPhone?: string
  protocol?: string
  phone?: string
  providerId?: string
  providerName?: string
  providerEmail?: string
  providerPhone?: string
  prestador?: Record<string, unknown>
  technicianName?: string
  technicianPhone?: string
  createdAt: Timestamp
  cancelledAt?: Timestamp
  cancelledBy?: string
  cancellationReason?: string
  distributionStartedAt?: Timestamp
  /** Rastreamento operacional (campo canônico em português técnico). */
  serviceOperationalStatus?: string
  serviceTimestamps?: Record<string, unknown>
  assignedTechnician?: Record<string, unknown>
  technicianHistory?: unknown[]
  slaDueAt?: Timestamp
  slaTargetMinutes?: number
  /** Geo quando existir no documento. */
  latitude?: number
  longitude?: number
  locationLat?: number
  locationLng?: number
}

export interface UserData {
  id: string
  name: string
  email: string
  role: string
  userType?: string
  isActive: boolean
  createdAt: Timestamp
  lastLoginAt?: Timestamp
  verificado?: boolean
  fullName?: string
  username?: string
  phone?: string
  profileImageUrl?: string
  uid?: string
  /** Campos frequentes em documentos de usuário para operação. */
  city?: string
  state?: string
  cidade?: string
  estado?: string
  address?: string
  approvalStatus?: string
  internalNotes?: string
  documentStatus?: string
}

export interface ProviderVerificationData {
  id: string
  providerId: string
  status: 'pending' | 'approved' | 'rejected'
  documents: string[]
  verifiedAt?: Timestamp
  createdAt: Timestamp
}

export interface SavedAddressData {
  id: string
  userId: string
  address: string
  complement?: string
  isDefault: boolean
  createdAt: Timestamp
}

export class FirestoreAnalyticsService {
  // Métricas de Pedidos
  static async getOrdersMetrics() {
    try {
      const orders = await getCollection('orders')
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const totalOrders = orders.length
      const activeOrders = orders.filter(order => 
        !order.cancelledAt && 
        order.status !== 'completed' && 
        order.status !== 'cancelled'
      ).length

      const ordersLast30Days = orders.filter(order => 
        order.createdAt?.toDate() >= thirtyDaysAgo
      ).length

      const ordersLast7Days = orders.filter(order => 
        order.createdAt?.toDate() >= sevenDaysAgo
      ).length

      const ordersToday = orders.filter(order => 
        order.createdAt?.toDate() >= today
      ).length

      const cancelledOrders = orders.filter(order => 
        order.cancelledAt || order.status === 'cancelled'
      ).length

      const emergencyOrders = orders.filter(order => 
        order.isEmergency === true
      ).length

      return {
        totalOrders,
        activeOrders,
        ordersLast30Days,
        ordersLast7Days,
        ordersToday,
        cancelledOrders,
        emergencyOrders,
        cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
      }
    } catch (error) {
      console.error('Erro ao buscar métricas de pedidos:', error)
      throw error
    }
  }

  // Métricas de Usuários
  static async getUsersMetrics() {
    try {
      const users = await getCollection('users')
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const totalUsers = users.length
      const activeUsers = users.filter(user => 
        user.isActive !== false
      ).length

      const newUsersLast30Days = users.filter(user => 
        user.createdAt?.toDate() >= thirtyDaysAgo
      ).length

      const newUsersLast7Days = users.filter(user => 
        user.createdAt?.toDate() >= sevenDaysAgo
      ).length

      const usersWithRecentLogin = users.filter(user => 
        user.lastLoginAt?.toDate() >= sevenDaysAgo
      ).length

      return {
        totalUsers,
        activeUsers,
        newUsersLast30Days,
        newUsersLast7Days,
        usersWithRecentLogin
      }
    } catch (error) {
      console.error('Erro ao buscar métricas de usuários:', error)
      throw error
    }
  }

  // Métricas de Prestadores
  static async getProvidersMetrics() {
    try {
      const verifications = await getCollection('provider_verifications')
      
      const totalVerifications = verifications.length
      const pendingVerifications = verifications.filter(v => v.status === 'pending').length
      const approvedVerifications = verifications.filter(v => v.status === 'approved').length
      const rejectedVerifications = verifications.filter(v => v.status === 'rejected').length

      return {
        totalVerifications,
        pendingVerifications,
        approvedVerifications,
        rejectedVerifications,
        approvalRate: totalVerifications > 0 ? (approvedVerifications / totalVerifications) * 100 : 0
      }
    } catch (error) {
      console.error('Erro ao buscar métricas de prestadores:', error)
      throw error
    }
  }

  // Métricas de Endereços
  static async getAddressesMetrics() {
    try {
      const addresses = await getCollection('saved_addresses')
      
      const totalAddresses = addresses.length
      const defaultAddresses = addresses.filter(addr => addr.isDefault === true).length

      return {
        totalAddresses,
        defaultAddresses
      }
    } catch (error) {
      console.error('Erro ao buscar métricas de endereços:', error)
      throw error
    }
  }

  // Métricas consolidadas para o dashboard
  static async getDashboardMetrics() {
    try {
      const [ordersMetrics, usersMetrics, providersMetrics, addressesMetrics] = await Promise.all([
        this.getOrdersMetrics(),
        this.getUsersMetrics(),
        this.getProvidersMetrics(),
        this.getAddressesMetrics()
      ])

      return {
        orders: ordersMetrics,
        users: usersMetrics,
        providers: providersMetrics,
        addresses: addressesMetrics,
        // Métricas calculadas
        totalRevenue: 0, // Será implementado quando tivermos dados de preços
        averageOrderValue: 0,
        userEngagement: usersMetrics.usersWithRecentLogin / Math.max(usersMetrics.totalUsers, 1) * 100
      }
    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error)
      throw error
    }
  }

  // Listeners em tempo real
  static listenToOrdersMetrics(callback: (metrics: any) => void) {
    return listenToCollection('orders', async (orders) => {
      const metrics = await this.getOrdersMetrics()
      callback(metrics)
    })
  }

  static listenToUsersMetrics(callback: (metrics: any) => void) {
    return listenToCollection('users', async (users) => {
      const metrics = await this.getUsersMetrics()
      callback(metrics)
    })
  }

  static listenToDashboardMetrics(callback: (metrics: any) => void) {
    const unsubscribers: (() => void)[] = []
    
    const ordersUnsub = this.listenToOrdersMetrics((ordersMetrics) => {
      // Recalcular métricas completas quando orders mudarem
      this.getDashboardMetrics().then(callback).catch(console.error)
    })
    
    const usersUnsub = this.listenToUsersMetrics((usersMetrics) => {
      // Recalcular métricas completas quando users mudarem
      this.getDashboardMetrics().then(callback).catch(console.error)
    })

    unsubscribers.push(ordersUnsub, usersUnsub)

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }
}
