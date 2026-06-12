"use client"

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, where, Timestamp, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Servico } from '@/types'

interface ServiceStats {
  total: number
  pendentes: number
  emAndamento: number
  concluidos: number
  orcamentos: number
  agendados: number
  aceitos: number
  aguardando: number
  naoEnviados: number
  cancelados: number
}

interface ServiceFilters {
  status?: string
  prioridade?: string
  cidade?: string
  dataInicio?: Date
  dataFim?: Date
  responsavel?: string
}

// Mapeia status de orders para status de Servico
const mapOrderStatus = (status: string): Servico['status'] => {
  switch (status) {
    case 'pending': return 'aguardando'
    case 'in_progress': return 'em_andamento'
    case 'completed': return 'concluido'
    case 'cancelled': return 'cancelado'
    default: return 'aguardando'
  }
}

// Converte documento de orders para Servico
const orderToServico = (id: string, d: any): Servico => ({
  id,
  protocolo: id.slice(-8).toUpperCase(),
  empresa: d.empresa || '',
  cnpj: d.cnpj || '',
  clienteNome: d.clientName || d.cliente?.nome || '',
  beneficiario: d.beneficiario || d.clientName || '',
  telefone: d.clientPhone || d.telefone || '',
  cidade: d.city || d.cidade || '',
  logradouro: d.address || d.endereco?.rua || '',
  bairro: d.bairro || '',
  dataHora: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt || 0),
  status: mapOrderStatus(d.status || 'pending'),
  prioridade: d.isEmergency ? 'urgente' : (d.prioridade || 'media') as Servico['prioridade'],
  responsavel: d.assignedProviderName || d.responsavel || '',
  placa: d.placa || '',
  createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
  updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
})

export function useServices(filters?: ServiceFilters) {
  const [services, setServices] = useState<Servico[]>([])
  const [stats, setStats] = useState<ServiceStats>({
    total: 0, pendentes: 0, emAndamento: 0, concluidos: 0, orcamentos: 0,
    agendados: 0, aceitos: 0, aguardando: 0, naoEnviados: 0, cancelados: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateStats = (data: Servico[]) => {
    const s: ServiceStats = {
      total: data.length, pendentes: 0, emAndamento: 0, concluidos: 0, orcamentos: 0,
      agendados: 0, aceitos: 0, aguardando: 0, naoEnviados: 0, cancelados: 0,
    }
    data.forEach(sv => {
      if (sv.status === 'agendado') s.agendados++
      else if (sv.status === 'aceito') s.aceitos++
      else if (sv.status === 'aguardando') s.aguardando++
      else if (sv.status === 'nao_enviado') s.naoEnviados++
      else if (sv.status === 'em_andamento') s.emAndamento++
      else if (sv.status === 'concluido') s.concluidos++
      else if (sv.status === 'cancelado') s.cancelados++
    })
    s.pendentes = s.agendados + s.aceitos + s.aguardando + s.naoEnviados
    s.orcamentos = s.agendados
    setStats(s)
  }

  useEffect(() => {
    if (!db) {
      setError('Firebase não inicializado')
      setLoading(false)
      return
    }

    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500))

    if (filters?.dataInicio) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.dataInicio)))
    }
    if (filters?.dataFim) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.dataFim)))
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        let data = snap.docs.map(d => orderToServico(d.id, d.data()))

        // Filtros client-side (campos sem índice)
        if (filters?.status) data = data.filter(s => s.status === filters.status)
        if (filters?.cidade) data = data.filter(s => s.cidade?.toLowerCase().includes(filters.cidade!.toLowerCase()))
        if (filters?.responsavel) data = data.filter(s => s.responsavel === filters.responsavel)

        setServices(data)
        calculateStats(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Erro ao escutar pedidos:', err)
        setError('Erro ao carregar serviços')
        setLoading(false)
      }
    )

    return () => unsub()
  }, [filters?.status, filters?.cidade, filters?.responsavel, filters?.dataInicio?.getTime(), filters?.dataFim?.getTime()])

  const updateServiceStatus = async (serviceId: string, newStatus: string) => {
    if (!db) return
    const orderStatus = newStatus === 'em_andamento' ? 'in_progress'
      : newStatus === 'concluido' ? 'completed'
      : newStatus === 'cancelado' ? 'cancelled'
      : 'pending'
    await updateDoc(doc(db, 'orders', serviceId), { status: orderStatus, updatedAt: serverTimestamp() })
  }

  // createService e deleteService não se aplicam a orders existentes — no-op seguro
  const createService = async (_data: any) => undefined
  const deleteService = async (_id: string) => undefined

  return { services, stats, loading, error, refetch: () => {}, updateServiceStatus, createService, deleteService }
}
