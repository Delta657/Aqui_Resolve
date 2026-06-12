"use client"

import { useState, useEffect } from 'react'
import { getCollection } from '@/lib/firestore'

export function useUsersDebug() {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllUsers = async () => {
    try {
      console.log('🔍 [DEBUG] Buscando todos os usuários...')
      setLoading(true)
      setError(null)
      
      const users = await getCollection('users')
      console.log('📊 [DEBUG] Usuários encontrados:', users.length)
      console.log('📋 [DEBUG] Estrutura dos usuários:', users)
      
      // Log detalhado de cada usuário
      users.forEach((user, index) => {
        console.log(`👤 [DEBUG] Usuário ${index + 1}:`, {
          id: user.id,
          userType: user.userType,
          role: user.role,
          fullName: user.fullName,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          isVerified: user.isVerified,
          verificado: user.verificado
        })
      })
      
      setAllUsers(users)
    } catch (err) {
      console.error('❌ [DEBUG] Erro ao buscar usuários:', err)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const getUsersByType = (userType: string) => {
    const filtered = allUsers.filter(user => user.userType === userType)
    console.log(`🔍 [DEBUG] Usuários do tipo '${userType}':`, filtered.length, filtered)
    return filtered
  }

  const getUsersByRole = (role: string) => {
    const filtered = allUsers.filter(user => user.role === role)
    console.log(`🔍 [DEBUG] Usuários do role '${role}':`, filtered.length, filtered)
    return filtered
  }

  return {
    allUsers,
    loading,
    error,
    refetch: fetchAllUsers,
    getUsersByType,
    getUsersByRole
  }
}
