import { getCollection } from '../firestore'
import { toDateFromUnknown } from '@/lib/date-utils'
import { getCanonicalUserRole, isUserActive } from '@/lib/user-schema'

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
  createdAt: any
  cancelledAt?: any
  cancelledBy?: string
  cancellationReason?: string
  distributionStartedAt?: any
}

export interface UserData {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: any
  lastLoginAt?: any
}

export interface ProviderVerificationData {
  id: string
  providerId: string
  status: 'pending' | 'approved' | 'rejected'
  documents: string[]
  verifiedAt?: any
  createdAt: any
}

export class FirestoreAnalyticsService {
  // Metricas de Pedidos (simplificadas)
  static async getOrdersMetrics() {
    try {
      const orders = await getCollection('orders')
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const totalOrders = orders.length
      const activeOrders = orders.filter((order) => !order.cancelledAt && order.status !== 'completed' && order.status !== 'cancelled').length
      const ordersLast30Days = orders.filter((order) => toDateFromUnknown(order.createdAt, new Date(0)) >= thirtyDaysAgo).length
      const ordersLast7Days = orders.filter((order) => toDateFromUnknown(order.createdAt, new Date(0)) >= sevenDaysAgo).length
      const ordersToday = orders.filter((order) => toDateFromUnknown(order.createdAt, new Date(0)) >= today).length
      const cancelledOrders = orders.filter((order) => order.cancelledAt || order.status === 'cancelled').length
      const completedOrders = orders.filter((order) => order.status === 'completed').length
      const emergencyOrders = orders.filter((order) => Boolean(order.isEmergency)).length

      return {
        totalOrders,
        activeOrders,
        ordersLast30Days,
        ordersLast7Days,
        ordersToday,
        cancelledOrders,
        completedOrders,
        emergencyOrders,
      }
    } catch (error) {
      console.error('Erro ao buscar metricas de pedidos:', error)
      return {
        totalOrders: 0,
        activeOrders: 0,
        ordersLast30Days: 0,
        ordersLast7Days: 0,
        ordersToday: 0,
        cancelledOrders: 0,
        completedOrders: 0,
        emergencyOrders: 0,
      }
    }
  }

  // Metricas de Usuarios (somente leitura, baseadas em campos reais)
  static async getUsersMetrics() {
    try {
      const users = await getCollection('users')
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const roleCounts = {
        client: 0,
        provider: 0,
        admin: 0,
        operator: 0,
        manager: 0,
        user: 0,
        unknown: 0,
      }

      let activeUsers = 0
      let blockedUsers = 0
      let newUsersLast30Days = 0
      let newUsersLast7Days = 0
      let newUsersToday = 0
      let usersWithRecentLogin = 0
      let onlineUsersToday = 0

      users.forEach((user) => {
        const role = getCanonicalUserRole(user as Record<string, unknown>)
        roleCounts[role] = roleCounts[role] + 1

        const isActive = isUserActive(user as Record<string, unknown>)
        if (isActive) {
          activeUsers++
        } else {
          blockedUsers++
        }

        const createdAt = toDateFromUnknown(user.createdAt ?? user.created_at, new Date(0))
        if (createdAt >= thirtyDaysAgo) newUsersLast30Days++
        if (createdAt >= sevenDaysAgo) newUsersLast7Days++
        if (createdAt >= today) newUsersToday++

        const lastLogin = toDateFromUnknown(user.lastLoginAt ?? user.lastLogin ?? user.last_login_at, new Date(0))
        if (lastLogin >= sevenDaysAgo) usersWithRecentLogin++
        if (lastLogin >= today) onlineUsersToday++
      })

      return {
        totalUsers: users.length,
        activeUsers,
        blockedUsers,
        roleCounts,
        newUsersLast30Days,
        newUsersLast7Days,
        newUsersToday,
        usersWithRecentLogin,
        onlineUsersToday,
      }
    } catch (error) {
      console.error('Erro ao buscar metricas de usuarios:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        blockedUsers: 0,
        roleCounts: {
          client: 0,
          provider: 0,
          admin: 0,
          operator: 0,
          manager: 0,
          user: 0,
          unknown: 0,
        },
        newUsersLast30Days: 0,
        newUsersLast7Days: 0,
        newUsersToday: 0,
        usersWithRecentLogin: 0,
        onlineUsersToday: 0,
      }
    }
  }

  // Metricas de Prestadores (simplificadas)
  static async getProvidersMetrics() {
    try {
      const verifications = await getCollection('provider_verifications')

      const totalVerifications = verifications.length
      const pendingVerifications = verifications.filter((v) => v.status === 'pending').length
      const approvedVerifications = verifications.filter((v) => v.status === 'approved').length
      const rejectedVerifications = verifications.filter((v) => v.status === 'rejected').length

      const approvalRate = totalVerifications > 0 ? (approvedVerifications / totalVerifications) * 100 : 0

      return {
        totalVerifications,
        pendingVerifications,
        approvedVerifications,
        rejectedVerifications,
        approvalRate,
      }
    } catch (error) {
      console.error('Erro ao buscar metricas de prestadores:', error)
      return {
        totalVerifications: 0,
        pendingVerifications: 0,
        approvedVerifications: 0,
        rejectedVerifications: 0,
        approvalRate: 0,
      }
    }
  }

  // Metricas do Dashboard (consolidadas)
  static async getDashboardMetrics() {
    try {
      const [orders, users, providers] = await Promise.all([
        this.getOrdersMetrics(),
        this.getUsersMetrics(),
        this.getProvidersMetrics(),
      ])

      return {
        orders,
        users,
        providers,
      }
    } catch (error) {
      console.error('Erro ao buscar metricas do dashboard:', error)
      return {
        orders: {
          totalOrders: 0,
          activeOrders: 0,
          ordersLast30Days: 0,
          ordersLast7Days: 0,
          ordersToday: 0,
          cancelledOrders: 0,
          completedOrders: 0,
          emergencyOrders: 0,
        },
        users: {
          totalUsers: 0,
          activeUsers: 0,
          blockedUsers: 0,
          roleCounts: {
            client: 0,
            provider: 0,
            admin: 0,
            operator: 0,
            manager: 0,
            user: 0,
            unknown: 0,
          },
          newUsersLast30Days: 0,
          newUsersLast7Days: 0,
          newUsersToday: 0,
          usersWithRecentLogin: 0,
          onlineUsersToday: 0,
        },
        providers: {
          totalVerifications: 0,
          pendingVerifications: 0,
          approvedVerifications: 0,
          rejectedVerifications: 0,
          approvalRate: 0,
        },
      }
    }
  }
}
