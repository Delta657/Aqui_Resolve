import { getCollection, getDocument, updateDocument, addDocument, deleteDocument } from '../firestore'
import { Timestamp } from 'firebase/firestore'
import type { UserData } from './firestore-analytics'
import {
  getCanonicalUserRole,
  getUserCreatedAt,
  getUserDisplayName,
  getUserEmail,
  getUserLastLoginAt,
  getUserPhone,
  isClientUser,
  isUserActive,
} from '@/lib/user-schema'
import { toDateFromUnknown } from '@/lib/date-utils'

export interface UserFilters {
  role?: string
  userType?: string
  isActive?: boolean
  searchTerm?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface UserStats {
  total: number
  active: number
  inactive: number
  byRole: Record<string, number>
  newUsersLast30Days: number
  newUsersLast7Days: number
  usersWithRecentLogin: number
}

export class UsersService {
  private static normalizeUser(user: Record<string, unknown>): UserData {
    const canonicalRole = getCanonicalUserRole(user)
    const normalizedName = getUserDisplayName(user)
    const email = getUserEmail(user)
    const phone = getUserPhone(user)

    return {
      ...(user as any),
      id: String(user.id ?? ''),
      fullName: normalizedName || undefined,
      name: typeof user.name === 'string' && user.name.trim() ? String(user.name) : normalizedName || 'Sem nome',
      email,
      phone: phone || undefined,
      role: canonicalRole === 'unknown' ? 'user' : canonicalRole,
      userType: canonicalRole === 'unknown' ? undefined : canonicalRole,
      isActive: isUserActive(user),
      createdAt: getUserCreatedAt(user) as any,
      lastLoginAt: getUserLastLoginAt(user) as any,
    } as UserData
  }

  private static roleMatches(user: UserData, roleFilter: string): boolean {
    const filter = roleFilter.toLowerCase()
    const role = String(user.role || '').toLowerCase()
    const userType = String(user.userType || '').toLowerCase()

    if (filter === 'cliente' || filter === 'client') {
      return role === 'client' || role === 'cliente' || userType === 'client'
    }

    if (filter === 'prestador' || filter === 'provider') {
      return role === 'provider' || role === 'prestador' || userType === 'provider'
    }

    return role === filter || userType === filter
  }

  // Buscar todos os usuarios com filtros opcionais
  static async getUsers(filters?: UserFilters, limitCount?: number) {
    try {
      const rawUsers = await getCollection('users')
      let users = rawUsers.map((user) => this.normalizeUser(user as Record<string, unknown>))

      if (filters) {
        if (filters.role) {
          users = users.filter((user) => this.roleMatches(user, filters.role!))
        }

        if (filters.userType) {
          users = users.filter((user) => this.roleMatches(user, filters.userType!))
        }

        if (filters.isActive !== undefined) {
          users = users.filter((user) => Boolean(user.isActive) === filters.isActive)
        }

        if (filters.dateFrom) {
          users = users.filter((user) => toDateFromUnknown(user.createdAt, new Date(0)) >= filters.dateFrom!)
        }

        if (filters.dateTo) {
          users = users.filter((user) => toDateFromUnknown(user.createdAt, new Date(0)) <= filters.dateTo!)
        }

        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          users = users.filter(
            (user) =>
              user.fullName?.toLowerCase().includes(searchLower) ||
              user.name?.toLowerCase().includes(searchLower) ||
              user.email?.toLowerCase().includes(searchLower)
          )
        }
      }

      users.sort((a, b) => {
        const dateA = toDateFromUnknown(a.createdAt, new Date(0))
        const dateB = toDateFromUnknown(b.createdAt, new Date(0))
        return dateB.getTime() - dateA.getTime()
      })

      if (limitCount) {
        users = users.slice(0, limitCount)
      }

      return users as UserData[]
    } catch (error) {
      console.error('Erro ao buscar usuarios:', error)
      throw error
    }
  }

  // Buscar usuario especifico
  static async getUser(userId: string) {
    try {
      const user = await getDocument('users', userId)
      if (!user) return null
      return this.normalizeUser(user as Record<string, unknown>)
    } catch (error) {
      console.error('Erro ao buscar usuario:', error)
      throw error
    }
  }

  // Atualizar usuario
  static async updateUser(userId: string, userData: Partial<UserData>) {
    try {
      await updateDocument('users', userId, userData)
      return true
    } catch (error) {
      console.error('Erro ao atualizar usuario:', error)
      throw error
    }
  }

  // Criar usuario
  static async createUser(userData: Partial<UserData>) {
    try {
      const userId = await addDocument('users', {
        ...userData,
        isActive: userData.isActive !== false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return { id: userId, ...userData } as UserData
    } catch (error) {
      console.error('Erro ao criar usuario:', error)
      throw error
    }
  }

  // Deletar usuario
  static async deleteUser(userId: string) {
    try {
      await deleteDocument('users', userId)
      return true
    } catch (error) {
      console.error('Erro ao deletar usuario:', error)
      throw error
    }
  }

  // Ativar/Desativar usuario
  static async toggleUserStatus(userId: string, isActive: boolean) {
    try {
      await this.updateUser(userId, { isActive })
      return true
    } catch (error) {
      console.error('Erro ao alterar status do usuario:', error)
      throw error
    }
  }

  // Atualizar ultimo login
  static async updateLastLogin(userId: string) {
    try {
      await this.updateUser(userId, { lastLoginAt: Timestamp.now() as any })
      return true
    } catch (error) {
      console.error('Erro ao atualizar ultimo login:', error)
      throw error
    }
  }

  // Estatisticas dos usuarios
  static async getUserStats(filters?: UserFilters): Promise<UserStats> {
    try {
      const users = await this.getUsers(filters)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const stats: UserStats = {
        total: users.length,
        active: 0,
        inactive: 0,
        byRole: {},
        newUsersLast30Days: 0,
        newUsersLast7Days: 0,
        usersWithRecentLogin: 0,
      }

      users.forEach((user) => {
        if (user.isActive) {
          stats.active++
        } else {
          stats.inactive++
        }

        const role = user.userType || user.role || 'unknown'
        stats.byRole[role] = (stats.byRole[role] || 0) + 1

        if (toDateFromUnknown(user.createdAt, new Date(0)) >= thirtyDaysAgo) {
          stats.newUsersLast30Days++
        }

        if (toDateFromUnknown(user.createdAt, new Date(0)) >= sevenDaysAgo) {
          stats.newUsersLast7Days++
        }

        if (toDateFromUnknown(user.lastLoginAt, new Date(0)) >= sevenDaysAgo) {
          stats.usersWithRecentLogin++
        }
      })

      return stats
    } catch (error) {
      console.error('Erro ao calcular estatisticas dos usuarios:', error)
      throw error
    }
  }

  // Buscar usuarios recentes
  static async getRecentUsers(limitCount: number = 10) {
    try {
      return await this.getUsers(undefined, limitCount)
    } catch (error) {
      console.error('Erro ao buscar usuarios recentes:', error)
      throw error
    }
  }

  // Buscar usuarios ativos
  static async getActiveUsers() {
    try {
      return await this.getUsers({ isActive: true })
    } catch (error) {
      console.error('Erro ao buscar usuarios ativos:', error)
      throw error
    }
  }

  // Buscar usuarios por role
  static async getUsersByRole(role: string) {
    try {
      return await this.getUsers({ role })
    } catch (error) {
      console.error('Erro ao buscar usuarios por role:', error)
      throw error
    }
  }

  // Buscar todos os clientes (multiplas formas de identificacao)
  static async getAllClients() {
    try {
      const allUsers = await getCollection('users')
      const clients = allUsers
        .filter((user) => isClientUser(user as Record<string, unknown>))
        .map((user) => this.normalizeUser(user as Record<string, unknown>))

      return clients as UserData[]
    } catch (error) {
      console.error('[CLIENTS] Erro ao buscar clientes:', error)
      throw error
    }
  }

  // Buscar usuarios com login recente
  static async getUsersWithRecentLogin() {
    try {
      const users = await this.getUsers()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      return users.filter((user) => toDateFromUnknown(user.lastLoginAt, new Date(0)) >= sevenDaysAgo)
    } catch (error) {
      console.error('Erro ao buscar usuarios com login recente:', error)
      throw error
    }
  }

  // Buscar usuarios inativos ha muito tempo
  static async getInactiveUsers(daysThreshold: number = 30) {
    try {
      const users = await this.getUsers()
      const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000)

      return users.filter((user) => !user.lastLoginAt || toDateFromUnknown(user.lastLoginAt, new Date(0)) < thresholdDate)
    } catch (error) {
      console.error('Erro ao buscar usuarios inativos:', error)
      throw error
    }
  }
}
