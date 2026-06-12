import { getCollection, getDocument, updateDocument, addDocument, deleteDocument } from '../firestore'
import { where, orderBy, limit, Timestamp } from 'firebase/firestore'
import type { OrderData } from './firestore-analytics'

export interface OrderFilters {
  status?: string
  isEmergency?: boolean
  clientId?: string
  dateFrom?: Date
  dateTo?: Date
  searchTerm?: string
}

export interface OrderStats {
  total: number
  active: number
  completed: number
  cancelled: number
  emergency: number
  byStatus: Record<string, number>
  byDay: Array<{ date: string; count: number }>
}

export class OrdersService {
  // Buscar todos os pedidos com filtros opcionais
  static async getOrders(filters?: OrderFilters, limitCount?: number) {
    try {
      let orders = await getCollection('orders')
      
      // Aplicar filtros
      if (filters) {
        if (filters.status) {
          orders = orders.filter(order => order.status === filters.status)
        }
        
        if (filters.isEmergency !== undefined) {
          orders = orders.filter(order => order.isEmergency === filters.isEmergency)
        }
        
        if (filters.clientId) {
          orders = orders.filter(order => order.clientId === filters.clientId)
        }
        
        if (filters.dateFrom) {
          orders = orders.filter(order => 
            order.createdAt?.toDate() >= filters.dateFrom!
          )
        }
        
        if (filters.dateTo) {
          orders = orders.filter(order => 
            order.createdAt?.toDate() <= filters.dateTo!
          )
        }
        
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          orders = orders.filter(order => 
            order.clientName?.toLowerCase().includes(searchLower) ||
            order.clientEmail?.toLowerCase().includes(searchLower) ||
            order.address?.toLowerCase().includes(searchLower) ||
            order.description?.toLowerCase().includes(searchLower)
          )
        }
      }
      
      // Ordenar por data de criação (mais recentes primeiro)
      orders.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0)
        const dateB = b.createdAt?.toDate() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
      
      // Aplicar limite se especificado
      if (limitCount) {
        orders = orders.slice(0, limitCount)
      }
      
      return orders as OrderData[]
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
      throw error
    }
  }

  // Buscar pedido específico
  static async getOrder(orderId: string) {
    try {
      const order = await getDocument('orders', orderId)
      return order as OrderData | null
    } catch (error) {
      console.error('Erro ao buscar pedido:', error)
      throw error
    }
  }

  // Atualizar status do pedido
  static async updateOrderStatus(orderId: string, status: string, additionalData?: any) {
    try {
      const updateData: any = { status }
      
      if (status === 'cancelled') {
        updateData.cancelledAt = Timestamp.now()
        updateData.cancelledBy = additionalData?.cancelledBy || 'admin'
        updateData.cancellationReason = additionalData?.cancellationReason || 'Cancelado pelo administrador'
      }
      
      if (status === 'in_progress') {
        updateData.distributionStartedAt = Timestamp.now()
      }
      
      await updateDocument('orders', orderId, updateData)
      return true
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error)
      throw error
    }
  }

  // Cancelar pedido
  static async cancelOrder(orderId: string, reason: string, cancelledBy: string = 'admin') {
    try {
      await this.updateOrderStatus(orderId, 'cancelled', {
        cancellationReason: reason,
        cancelledBy
      })
      return true
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      throw error
    }
  }

  // Estatísticas dos pedidos
  static async getOrderStats(filters?: OrderFilters): Promise<OrderStats> {
    try {
      const orders = await this.getOrders(filters)
      
      const stats: OrderStats = {
        total: orders.length,
        active: 0,
        completed: 0,
        cancelled: 0,
        emergency: 0,
        byStatus: {},
        byDay: []
      }
      
      // Contar por status
      orders.forEach(order => {
        if (order.isEmergency) stats.emergency++
        
        if (order.cancelledAt || order.status === 'cancelled') {
          stats.cancelled++
        } else if (order.status === 'completed') {
          stats.completed++
        } else {
          stats.active++
        }
        
        // Contar por status específico
        const status = order.status || 'unknown'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      })
      
      // Agrupar por dia (últimos 30 dias)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const ordersLast30Days = orders.filter(order => 
        order.createdAt?.toDate() >= thirtyDaysAgo
      )
      
      const dayGroups: Record<string, number> = {}
      ordersLast30Days.forEach(order => {
        const date = order.createdAt?.toDate()
        if (date) {
          const dateStr = date.toISOString().split('T')[0]
          dayGroups[dateStr] = (dayGroups[dateStr] || 0) + 1
        }
      })
      
      stats.byDay = Object.entries(dayGroups)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      return stats
    } catch (error) {
      console.error('Erro ao calcular estatísticas dos pedidos:', error)
      throw error
    }
  }

  // Buscar pedidos recentes
  static async getRecentOrders(limitCount: number = 10) {
    try {
      return await this.getOrders(undefined, limitCount)
    } catch (error) {
      console.error('Erro ao buscar pedidos recentes:', error)
      throw error
    }
  }

  // Buscar pedidos por cliente
  static async getOrdersByClient(clientId: string) {
    try {
      return await this.getOrders({ clientId })
    } catch (error) {
      console.error('Erro ao buscar pedidos do cliente:', error)
      throw error
    }
  }

  // Buscar pedidos de emergência
  static async getEmergencyOrders() {
    try {
      return await this.getOrders({ isEmergency: true })
    } catch (error) {
      console.error('Erro ao buscar pedidos de emergência:', error)
      throw error
    }
  }

  // Buscar pedidos pendentes de aprovação
  static async getPendingOrders() {
    try {
      return await this.getOrders({ status: 'pending' })
    } catch (error) {
      console.error('Erro ao buscar pedidos pendentes:', error)
      throw error
    }
  }
}
