import { useState, useEffect } from 'react'
import { FirebaseFinancialService, FirebaseTransaction, FirebaseAccount } from '@/lib/services/firebase-financial'

export interface Transaction {
  id: string
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string
  valor: number
  data: string
  conta: {
    id: string
    nome: string
    banco: string
  }
  pedido?: {
    id: string
    numero: string
  }
  prestador?: {
    id: string
    nome: string
  }
  status: 'pendente' | 'confirmada' | 'cancelada'
  observacoes?: string
}

export interface Account {
  id: string
  nome: string
  banco: string
  agencia: string
  conta: string
  tipo: 'corrente' | 'poupanca' | 'investimento'
  saldo: number
  status: 'ativa' | 'inativa'
}

export interface FinancialStats {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  transacoesPendentes: number
  totalContas: number
  saldoTotal: number
}

export interface UseFinancialReturn {
  transactions: Transaction[]
  accounts: Account[]
  stats: FinancialStats | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFinancial(options?: {
  dataInicio?: string
  dataFim?: string
  autoRefresh?: boolean
}): UseFinancialReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Converter FirebaseTransaction para Transaction
  const convertFirebaseTransaction = (fbTransaction: FirebaseTransaction): Transaction => ({
    id: fbTransaction.id,
    tipo: fbTransaction.tipo,
    categoria: fbTransaction.categoria,
    descricao: fbTransaction.descricao,
    valor: fbTransaction.valor,
    data: fbTransaction.data,
    conta: fbTransaction.conta,
    pedido: fbTransaction.pedido,
    prestador: fbTransaction.prestador,
    status: fbTransaction.status,
    observacoes: fbTransaction.observacoes
  })

  // Converter FirebaseAccount para Account
  const convertFirebaseAccount = (fbAccount: FirebaseAccount): Account => ({
    id: fbAccount.id,
    nome: fbAccount.nome,
    banco: fbAccount.banco,
    agencia: fbAccount.agencia,
    conta: fbAccount.conta,
    tipo: fbAccount.tipo,
    saldo: fbAccount.saldo,
    status: fbAccount.status
  })

  // Calcular estatísticas
  const calculateStats = (transactionsList: Transaction[], accountsList: Account[]): FinancialStats => {
    const totalReceitas = transactionsList
      .filter(t => t.tipo === 'receita' && t.status === 'confirmada')
      .reduce((sum, t) => sum + t.valor, 0)

    const totalDespesas = transactionsList
      .filter(t => t.tipo === 'despesa' && t.status === 'confirmada')
      .reduce((sum, t) => sum + t.valor, 0)

    const transacoesPendentes = transactionsList
      .filter(t => t.status === 'pendente').length

    const saldoTotal = accountsList
      .filter(a => a.status === 'ativa')
      .reduce((sum, a) => sum + a.saldo, 0)

    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      transacoesPendentes,
      totalContas: accountsList.length,
      saldoTotal
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      let firebaseTransactions: FirebaseTransaction[]
      let firebaseAccounts: FirebaseAccount[]

      if (options?.dataInicio && options?.dataFim) {
        firebaseTransactions = await FirebaseFinancialService.getTransactionsByPeriod(
          options.dataInicio,
          options.dataFim
        )
      } else {
        firebaseTransactions = await FirebaseFinancialService.getTransactions()
      }

      firebaseAccounts = await FirebaseFinancialService.getAccounts()

      const convertedTransactions = firebaseTransactions.map(convertFirebaseTransaction)
      const convertedAccounts = firebaseAccounts.map(convertFirebaseAccount)

      setTransactions(convertedTransactions)
      setAccounts(convertedAccounts)
      setStats(calculateStats(convertedTransactions, convertedAccounts))
    } catch (err) {
      setError('Erro ao carregar dados financeiros')
      console.error('Erro ao buscar dados financeiros:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (options?.autoRefresh) {
      // Usar listener em tempo real do Firebase para transações
      const unsubscribe = FirebaseFinancialService.listenToTransactions((firebaseTransactions) => {
        try {
          let filteredTransactions = firebaseTransactions
          
          if (options?.dataInicio && options?.dataFim) {
            filteredTransactions = filteredTransactions.filter(t => 
              t.data >= options.dataInicio! && t.data <= options.dataFim!
            )
          }

          const convertedTransactions = filteredTransactions.map(convertFirebaseTransaction)
          setTransactions(convertedTransactions)
          
          // Recalcular stats com accounts existentes
          if (accounts.length > 0) {
            setStats(calculateStats(convertedTransactions, accounts))
          }
          
          setLoading(false)
          setError(null)
        } catch (err) {
          setError('Erro ao carregar transações')
          console.error('Erro ao processar transações:', err)
        }
      })

      // Buscar contas uma vez
      FirebaseFinancialService.getAccounts().then(firebaseAccounts => {
        const convertedAccounts = firebaseAccounts.map(convertFirebaseAccount)
        setAccounts(convertedAccounts)
        setStats(calculateStats(transactions, convertedAccounts))
      })

      return unsubscribe
    } else {
      // Buscar uma vez
      fetchData()
    }
  }, [options?.dataInicio, options?.dataFim, options?.autoRefresh])

  return {
    transactions,
    accounts,
    stats,
    loading,
    error,
    refetch: fetchData
  }
}
