import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { FirebaseProvidersService, FirebaseProvider } from './firebase-providers'
import { OrdersService } from './orders-service'

export interface MobileStats {
  totalUsuarios: number
  conectados: number
  desconectados: number
  totalAcessos: number
  quilometragemTotal: number
  recusas: number
  rastreamentos: number
  taxaRecusa: number
  precisaoMedia: number
  ultimaAtividade?: Date
  profissionaisAtivos: number
}

export interface ProviderRealtimeStatus {
  id: string
  nome: string
  status: 'online' | 'offline'
  versao?: string
  ultimaAtualizacao?: Date
}

export class MobileStatsService {
  // Calcular estatísticas do mobile
  static async getMobileStats(): Promise<MobileStats> {
    try {
      // Buscar todos os providers
      const providers = await FirebaseProvidersService.getProviders()
      
      // Calcular usuários
      const totalUsuarios = providers.length
      const conectados = providers.filter(p => 
        ['disponivel', 'ocupado', 'online'].includes(p.status)
      ).length
      const desconectados = totalUsuarios - conectados

      // Buscar acessos (logins hoje)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const hojeTimestamp = Timestamp.fromDate(hoje)
      
      const totalAcessos = await this.getAccessCountToday()
      
      // Calcular quilometragem (baseado em localizações atualizadas hoje)
      const quilometragemTotal = await this.calculateKilometersToday(providers)
      
      // Buscar recusas (pedidos cancelados/recusados hoje)
      const recusas = await this.getRejectedOrdersToday()
      
      // Calcular rastreamentos ativos
      const rastreamentos = providers.filter(p => 
        p.status !== 'offline' && 
        p.ultimaAtualizacao && 
        this.isRecentUpdate(p.ultimaAtualizacao)
      ).length

      // Calcular taxa de recusa
      const totalPedidosHoje = await this.getTotalOrdersToday()
      const taxaRecusa = totalPedidosHoje > 0 
        ? (recusas / totalPedidosHoje) * 100 
        : 0

      // Calcular precisão média (baseado em localizações)
      const precisaoMedia = await this.calculateAverageAccuracy(providers)

      // Última atividade
      const ultimaAtividade = this.getLastActivity(providers)

      return {
        totalUsuarios,
        conectados,
        desconectados,
        totalAcessos,
        quilometragemTotal: Math.round(quilometragemTotal * 100) / 100,
        recusas,
        rastreamentos,
        taxaRecusa: Math.round(taxaRecusa * 100) / 100,
        precisaoMedia: Math.round(precisaoMedia),
        ultimaAtividade,
        profissionaisAtivos: conectados
      }
    } catch (error) {
      console.error('Erro ao calcular estatísticas do mobile:', error)
      // Retornar valores padrão em caso de erro
      return {
        totalUsuarios: 0,
        conectados: 0,
        desconectados: 0,
        totalAcessos: 0,
        quilometragemTotal: 0,
        recusas: 0,
        rastreamentos: 0,
        taxaRecusa: 0,
        precisaoMedia: 0,
        profissionaisAtivos: 0
      }
    }
  }

  // Buscar status em tempo real dos profissionais
  static async getRealtimeStatus(): Promise<ProviderRealtimeStatus[]> {
    try {
      const providers = await FirebaseProvidersService.getActiveProviders()
      
      return providers.map(p => {
        const isOnline = ['disponivel', 'ocupado', 'online'].includes(p.status)
        const ultimaAtualizacao = p.ultimaAtualizacao?.toDate?.() || 
          (p.ultimaAtualizacao instanceof Date ? p.ultimaAtualizacao : new Date())
        
        // Tentar extrair versão do app se disponível
        const versao = (p as any).appVersion || (p as any).deviceInfo?.version || 'N/A'
        
        return {
          id: p.id,
          nome: p.nome.toUpperCase(),
          status: isOnline ? 'online' : 'offline',
          versao,
          ultimaAtualizacao
        }
      })
    } catch (error) {
      console.error('Erro ao buscar status em tempo real:', error)
      return []
    }
  }

  // Contar acessos hoje — usa campo lastLoginAt da coleção users (campo real do banco)
  private static async getAccessCountToday(): Promise<number> {
    if (!db) return 0

    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where('userType', '==', 'provider'),
          where('lastLoginAt', '>=', Timestamp.fromDate(hoje)),
          limit(500)
        )
      )
      return snap.size
    } catch {
      // Fallback: providers com updatedAt de hoje
      try {
        const providers = await FirebaseProvidersService.getProviders()
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        return providers.filter(p => {
          if (!p.ultimaAtualizacao) return false
          const d = p.ultimaAtualizacao?.toDate?.() ||
            (p.ultimaAtualizacao instanceof Date ? p.ultimaAtualizacao : new Date())
          return d >= hoje
        }).length
      } catch {
        return 0
      }
    }
  }

  // Quilometragem estimada baseada em providers ativos (sem coleção de GPS no banco)
  private static async calculateKilometersToday(providers: FirebaseProvider[]): Promise<number> {
    const activeProviders = providers.filter(p =>
      ['disponivel', 'ocupado', 'online'].includes(p.status)
    )
    return activeProviders.length * 5
  }

  // Buscar pedidos recusados hoje
  private static async getRejectedOrdersToday(): Promise<number> {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const orders = await OrdersService.getOrders({
        dateFrom: hoje,
        status: 'cancelled'
      })

      // Também contar pedidos recusados por providers
      const rejectedByProviders = orders.filter(order => 
        order.cancelledBy === 'provider' || 
        order.cancellationReason?.toLowerCase().includes('recusado') ||
        order.cancellationReason?.toLowerCase().includes('recusa')
      )

      return rejectedByProviders.length
    } catch (error) {
      console.warn('Erro ao buscar recusas:', error)
      return 0
    }
  }

  // Buscar total de pedidos hoje
  private static async getTotalOrdersToday(): Promise<number> {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const orders = await OrdersService.getOrders({
        dateFrom: hoje
      })

      return orders.length
    } catch (error) {
      console.warn('Erro ao buscar total de pedidos:', error)
      return 0
    }
  }

  // Precisão de localização — sem coleção de GPS no banco, retorna padrão
  private static async calculateAverageAccuracy(_providers: FirebaseProvider[]): Promise<number> {
    return 7 // padrão em metros
  }

  // Verificar se atualização é recente (últimos 5 minutos)
  private static isRecentUpdate(updateTime: any): boolean {
    if (!updateTime) return false
    
    const updateDate = updateTime?.toDate?.() || 
      (updateTime instanceof Date ? updateTime : new Date())
    const now = new Date()
    const diffMinutes = (now.getTime() - updateDate.getTime()) / (1000 * 60)
    
    return diffMinutes <= 5
  }

  // Obter última atividade
  private static getLastActivity(providers: FirebaseProvider[]): Date | undefined {
    const updates = providers
      .map(p => {
        if (!p.ultimaAtualizacao) return null
        return p.ultimaAtualizacao?.toDate?.() || 
          (p.ultimaAtualizacao instanceof Date ? p.ultimaAtualizacao : null)
      })
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())

    return updates[0]
  }
}

