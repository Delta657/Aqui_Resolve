"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCollection } from "@/lib/firestore"
import { cn } from "@/lib/utils"

interface VerificationHistoryItem {
  id: string
  verificationId: string
  providerId: string
  action: 'approved' | 'rejected'
  reviewedBy: string
  reviewedAt: Date
  rejectionReason?: string
  notes?: string
}

interface VerificationHistoryProps {
  verificationId: string
  providerName: string
}

export const VerificationHistory = ({ verificationId, providerName }: VerificationHistoryProps) => {
  const [history, setHistory] = useState<VerificationHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [verificationId])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const historyData = (await getCollection('verification_history')) as VerificationHistoryItem[]
      const filteredHistory = historyData
        .filter(item => item.verificationId === verificationId)
        .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())

      setHistory(filteredHistory)
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="h-20 bg-muted/50 rounded-lg animate-skeleton" />
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de Verificação
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="shrink-0 mt-1">
                  {getActionIcon(item.action)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionBadge(item.action)}
                      <span className="text-sm text-muted-foreground">
                        por {item.reviewedBy}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(item.reviewedAt, { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium">
                      {item.action === 'approved' 
                        ? 'Verificação aprovada - prestador habilitado para prestar serviços'
                        : 'Verificação rejeitada'
                      }
                    </p>
                    
                    {item.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-red-800">Motivo da rejeição:</p>
                            <p className="text-red-700">{item.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {item.notes && (
                      <p className="text-muted-foreground mt-1">{item.notes}</p>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {format(item.reviewedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
