"use client"

import { useMemo, useState, useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Shield,
  Eye,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  Building,
  MapPin,
  FileCheck,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDocumentVerification } from "@/hooks/use-document-verification"
import { DocumentViewer } from "@/components/users/document-viewer"
import { VerificationHistory } from "@/components/users/verification-history"
import { ServiceAcceptanceDocs } from "@/components/users/service-acceptance-docs"
import { UserDocumentsStructure } from "@/components/users/user-documents-structure"
import { useDocumentAuth } from "@/hooks/use-document-auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface VerificationsPageContentProps {
  /** Quando true, não envolve em AppShell (use dentro do layout do dashboard). */
  embedded?: boolean
  /** Filtro inicial de status (ex.: "pending" na fila de aceitação). */
  defaultStatusFilter?: string
}

export const VerificationsPageContent = ({
  embedded = false,
  defaultStatusFilter = "approved",
}: VerificationsPageContentProps) => {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatusFilter)
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all")
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<string>("submittedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [modalTab, setModalTab] = useState("documents")
  const { toast } = useToast()
  const { user } = useDocumentAuth()

  // Usar o hook de verificação de documentos
  const {
    verifications,
    loading,
    stats,
    approveVerification,
    rejectVerification,
    filterVerifications,
    refetch,
    fetchProviderVerification
  } = useDocumentVerification()
  const [loadingDocumentsFor, setLoadingDocumentsFor] = useState<string | null>(null)

  // Bloquear scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (showDetails) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [showDetails])

  // Funções auxiliares
  const toggleCardExpansion = (verificationId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(verificationId)) {
      newExpanded.delete(verificationId)
    } else {
      newExpanded.add(verificationId)
    }
    setExpandedCards(newExpanded)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  // Filtrar e ordenar verificações
  const filteredVerifications = useMemo(() => {
    let filtered = filterVerifications({
      status: statusFilter === "all" ? undefined : statusFilter as any,
      search: search || undefined,
      documentType: documentTypeFilter === "all" ? undefined : documentTypeFilter
    })

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case "providerName":
          aValue = a.providerName.toLowerCase()
          bValue = b.providerName.toLowerCase()
          break
        case "submittedAt":
          aValue = new Date(a.submittedAt).getTime()
          bValue = new Date(b.submittedAt).getTime()
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = a[sortBy as keyof typeof a]
          bValue = b[sortBy as keyof typeof b]
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [verifications, statusFilter, search, documentTypeFilter, sortBy, sortOrder, filterVerifications])

  const handleApprove = async (verificationId: string) => {
    const success = await approveVerification(verificationId, user?.email || "admin")
    if (success) {
      setShowDetails(false)
    }
  }

  const handleReject = async (verificationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive"
      })
      return
    }

    const success = await rejectVerification(verificationId, rejectionReason, user?.email || "admin")
    if (success) {
      setShowDetails(false)
      setShowRejectDialog(false)
      setRejectionReason("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="rounded-full bg-amber-50 text-amber-700 border-amber-200/80 font-medium gap-1.5 px-3 py-1">
            <Clock className="h-3.5 w-3.5" /> Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium gap-1.5 px-3 py-1">
            <CheckCircle className="h-3.5 w-3.5" /> Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="rounded-full bg-rose-50 text-rose-700 border-rose-200/80 font-medium gap-1.5 px-3 py-1">
            <XCircle className="h-3.5 w-3.5" /> Rejeitado
          </Badge>
        )
      default:
        return <Badge variant="outline" className="rounded-full">{status}</Badge>
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'cpf': return 'CPF/RG'
      case 'cnh': return 'CNH'
      case 'comprovante_residencia': return 'Comprovante de Residência'
      case 'certificado': return 'Certificados'
      case 'outros': return 'Outros'
      default: return type
    }
  }

  const countTotalDocuments = (documents: any) => {
    return Object.values(documents).reduce((total: number, docs: any) => {
      return total + (docs ? docs.length : 0)
    }, 0)
  }

  const shell = (body: ReactNode) =>
    embedded ? <>{body}</> : <AppShell>{body}</AppShell>

  return shell(
    <div className="w-full max-w-full min-w-0 overflow-x-hidden bg-linear-to-b from-muted/30 via-background to-primary/5">
        <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {embedded ? (
              <Button variant="ghost" asChild className="w-fit -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-10 sm:h-11 px-3 sm:px-4 gap-2 font-medium transition-colors text-sm sm:text-base">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">Voltar ao painel</span>
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="w-fit -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-10 sm:h-11 px-3 sm:px-4 gap-2 font-medium transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Voltar para Usuários</span>
              </Button>
            )}

            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3 sm:gap-5 min-w-0">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-linear-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25 shrink-0">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
                    {embedded ? "Aceitação de cadastro de prestadores" : "Aprovar Utilização do Site"}
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-xl line-clamp-2">
                    {embedded
                      ? "Analise os documentos enviados ao Firebase Storage, aprove ou rejeite o cadastro para liberar o uso do aplicativo."
                      : "Solicitações de parceiros aguardando liberação para utilizar o site completo."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={loading}
                  className="rounded-xl border-border bg-card hover:bg-muted/50 shadow-sm h-10 sm:h-11 px-3 sm:px-5 gap-2 font-medium text-sm sm:text-base"
                >
                  <RefreshCw className={cn("h-4 w-4 shrink-0", loading && "animate-spin")} />
                  {loading ? "Atualizando..." : "Atualizar"}
                </Button>
                <Button className="rounded-xl bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/25 h-10 sm:h-11 px-3 sm:px-5 gap-2 font-medium text-white border-0 text-sm sm:text-base">
                  <FileCheck className="h-4 w-4 shrink-0" />
                  Relatório
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="rounded-xl sm:rounded-2xl border-0 bg-card/80 backdrop-blur shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden min-w-0">
              <div className="h-1 w-full bg-linear-to-r from-muted-foreground/40 to-muted-foreground/60" />
              <CardContent className="p-3 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tabular-nums">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">{stats.totalDocuments} documentos</p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl bg-muted p-2 sm:p-3">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl sm:rounded-2xl border-0 bg-card/80 backdrop-blur shadow-card hover:shadow-xl hover:shadow-amber-200/40 transition-all duration-300 overflow-hidden min-w-0">
              <div className="h-1 w-full bg-linear-to-r from-amber-400 to-orange-500" />
              <CardContent className="p-3 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600 tabular-nums">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">{stats.pending > 0 ? "Aguardando análise" : "Nenhuma pendência"}</p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl bg-amber-50 p-2 sm:p-3">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl sm:rounded-2xl border-0 bg-card/80 backdrop-blur shadow-card hover:shadow-xl hover:shadow-emerald-200/40 transition-all duration-300 overflow-hidden min-w-0">
              <div className="h-1 w-full bg-linear-to-r from-emerald-400 to-green-500" />
              <CardContent className="p-3 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600 tabular-nums">{stats.approved}</p>
                    <p className="text-xs text-muted-foreground">{stats.approved > 0 ? `${stats.total ? Math.round((stats.approved / stats.total) * 100) : 0}% do total` : "Nenhum aprovado"}</p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl bg-emerald-50 p-2 sm:p-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl sm:rounded-2xl border-0 bg-card/80 backdrop-blur shadow-card hover:shadow-xl hover:shadow-rose-200/40 transition-all duration-300 overflow-hidden min-w-0">
              <div className="h-1 w-full bg-linear-to-r from-rose-400 to-red-500" />
              <CardContent className="p-3 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Bloqueados</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-rose-600 tabular-nums">{stats.rejected}</p>
                    <p className="text-xs text-muted-foreground">{stats.rejected > 0 ? `${stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}% do total` : "Nenhum bloqueado"}</p>
                  </div>
                  <div className="rounded-xl sm:rounded-2xl bg-rose-50 p-2 sm:p-3">
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Filters */}
        <Card className="rounded-xl sm:rounded-2xl border-0 bg-card/80 backdrop-blur shadow-card overflow-hidden min-w-0">
          <CardHeader className="p-3 sm:p-6 pb-3 sm:pb-4 border-b border-border">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg font-semibold text-foreground">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-muted">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                Filtros e Busca
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 sm:w-44 rounded-lg sm:rounded-xl border-border bg-muted/50/80 text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submittedAt">Data de Envio</SelectItem>
                    <SelectItem value="providerName">Nome</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="rounded-lg sm:rounded-xl border-border h-9 sm:h-10 w-9 sm:w-10 p-0"
                >
                  {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/60" />
              <Input
                placeholder="Buscar por nome, email, telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 sm:pl-12 h-10 sm:h-12 rounded-lg sm:rounded-xl border-border bg-muted/50 focus:bg-background focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all text-sm sm:text-base"
              />
            </div>

            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v)} className="w-full min-w-0">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-12 p-1 rounded-xl bg-muted">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                  Todos ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                  Pendentes ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                  Aprovados ({stats.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                  Bloqueados ({stats.rejected})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Tipo de documento</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { id: "all", label: "Todos" },
                  { id: "cpf", label: "CPF/RG" },
                  { id: "cnh", label: "CNH" },
                  { id: "comprovante_residencia", label: "Comprovante" },
                  { id: "certificado", label: "Certificados" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setDocumentTypeFilter(id)}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all",
                      documentTypeFilter === id
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="rounded-xl sm:rounded-2xl border-0 bg-card/80 backdrop-blur shadow-card overflow-hidden min-w-0">
          <CardHeader className="p-3 sm:p-6 pb-3 sm:pb-4 border-b border-border">
            <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg font-semibold text-foreground">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-muted">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                Solicitações
                <Badge variant="secondary" className="ml-1 rounded-full px-2 sm:px-2.5 py-0.5 font-medium bg-muted text-muted-foreground text-xs sm:text-sm">
                  {filteredVerifications.length}
                </Badge>
              </CardTitle>
              {filteredVerifications.length > 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ordenado por {sortBy === "submittedAt" ? "Data" : sortBy === "providerName" ? "Nome" : "Status"} ({sortOrder})
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6">
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-muted/50 animate-skeleton">
                    <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <div className="h-4 sm:h-5 w-32 sm:w-48 rounded-md sm:rounded-lg bg-muted" />
                      <div className="h-3 sm:h-4 w-48 sm:w-64 rounded-md sm:rounded-lg bg-muted" />
                      <div className="h-3 sm:h-4 w-24 sm:w-32 rounded-md sm:rounded-lg bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="text-center py-12 sm:py-20 px-3 sm:px-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-2xl sm:rounded-3xl bg-muted flex items-center justify-center mb-4 sm:mb-6">
                  <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Nenhuma verificação encontrada
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-4 sm:mb-6">
                  {search || statusFilter !== "all" || documentTypeFilter !== "all"
                    ? "Tente ajustar os filtros de busca para encontrar verificações."
                    : "Não há verificações pendentes no momento."}
                </p>
                {(search || statusFilter !== "all" || documentTypeFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("")
                      setStatusFilter("all")
                      setDocumentTypeFilter("all")
                    }}
                    className="rounded-lg sm:rounded-xl border-border font-medium text-sm sm:text-base h-9 sm:h-10"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredVerifications.map((verification) => {
                  const isExpanded = expandedCards.has(verification.id)
                  return (
                    <Card
                      key={verification.id}
                      className={cn(
                        "rounded-xl sm:rounded-2xl border border-border bg-card shadow-card hover:shadow-card-hover hover:border-border transition-all duration-300 min-w-0 overflow-hidden",
                        verification.status === "pending" && "ring-1 ring-amber-200/50"
                      )}
                    >
                      <CardContent className="p-3 sm:p-5 lg:p-6">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                              <div
                                className={cn(
                                  "h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 font-bold text-base sm:text-lg shadow-sm",
                                  verification.status === "pending" && "bg-linear-to-br from-amber-400 to-orange-500 text-white ring-2 ring-amber-200/60",
                                  verification.status === "approved" && "bg-linear-to-br from-emerald-400 to-green-500 text-white",
                                  verification.status === "rejected" && "bg-muted text-muted-foreground",
                                  !["pending", "approved", "rejected"].includes(verification.status) && "bg-linear-to-br from-orange-500 to-amber-600 text-white"
                                )}
                              >
                                {verification.providerName.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                                <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                                  {verification.providerName}
                                </h3>
                                <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                                  <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                    <span className="truncate">{verification.providerEmail}</span>
                                  </span>
                                  {verification.providerPhone && (
                                    <span className="flex items-center gap-1 sm:gap-1.5">
                                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                      {verification.providerPhone}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 w-full min-w-0">
                                  {verification.providerCpf && (
                                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-sky-50 text-sky-700 text-[10px] sm:text-xs font-medium border border-sky-200/80 break-all max-w-full">
                                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> CPF: {verification.providerCpf}
                                    </span>
                                  )}
                                  {verification.providerRg && (
                                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-violet-50 text-violet-700 text-[10px] sm:text-xs font-medium border border-violet-200/80 break-all max-w-full">
                                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> RG: {verification.providerRg}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row items-center justify-between sm:flex-col sm:gap-2 lg:items-end shrink-0">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(verification.status)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCardExpansion(verification.id)}
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg sm:rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {(() => {
                                  const docCount = countTotalDocuments(verification.documents)
                                  const dateToShow = verification.status !== 'pending'
                                    ? (verification.reviewedAt || verification.submittedAt)
                                    : verification.submittedAt
                                  const isRealDate = dateToShow && dateToShow.getFullYear() > 2000
                                    && (Date.now() - dateToShow.getTime()) > 5000
                                  return (
                                    <>
                                      {docCount > 0 ? `${docCount} docs` : 'Sem docs'}
                                      {' • '}
                                      {isRealDate
                                        ? formatDistanceToNow(dateToShow!, { addSuffix: true, locale: ptBR })
                                        : verification.status === 'approved' ? 'Data não registrada' : 'Recém cadastrado'}
                                    </>
                                  )
                                })()}
                              </p>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-4 sm:space-y-5 pt-4 sm:pt-5 border-t border-border">
                              {verification.providerServiceCategories && verification.providerServiceCategories.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="font-medium text-xs sm:text-sm text-foreground">Serviços que atende</h4>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {verification.providerServiceCategories.map((cat) => (
                                      <Badge key={cat} variant="outline" className="rounded-lg text-xs border-orange-200 bg-orange-50 text-orange-700">
                                        {cat}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2">
                                <h4 className="font-medium text-xs sm:text-sm text-foreground">Documentos enviados</h4>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {Object.entries(verification.documents).map(([type, docs]) => {
                                    if (!docs || !Array.isArray(docs) || docs.length === 0) return null
                                    return (
                                      <Badge key={type} variant="outline" className="rounded-lg text-xs border-border bg-muted/50">
                                        {getDocumentTypeLabel(type)} ({docs.length})
                                      </Badge>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={loadingDocumentsFor === verification.providerId}
                                  onClick={async () => {
                                    const docsMap = verification.documents || {}
                                    const hasUrls = Object.values(docsMap).some(
                                      (docs) =>
                                        Array.isArray(docs) &&
                                        docs.some((d: { url?: string }) => Boolean(d?.url))
                                    )
                                    const hasPathsOnly = Object.values(docsMap).some(
                                      (docs) =>
                                        Array.isArray(docs) &&
                                        docs.some((d: { url?: string; path?: string }) => Boolean(d?.path) && !d?.url)
                                    )
                                    if (hasUrls) {
                                      setSelectedVerification(verification)
                                      setModalTab("documents")
                                      setShowDetails(true)
                                      return
                                    }
                                    if (hasPathsOnly) {
                                      setSelectedVerification(verification)
                                      setModalTab("documents")
                                      setShowDetails(true)
                                      return
                                    }
                                    setLoadingDocumentsFor(verification.providerId)
                                    try {
                                      const full = await fetchProviderVerification(verification.providerId)
                                      // Abre o modal mesmo sem docs — o tab "Documentos" mostrará estado vazio
                                      setSelectedVerification({ ...verification, documents: full?.documents ?? {} })
                                      setModalTab("documents")
                                      setShowDetails(true)
                                    } finally {
                                      setLoadingDocumentsFor(null)
                                    }
                                  }}
                                  className="rounded-lg sm:rounded-xl border-border font-medium gap-2 text-xs sm:text-sm h-8 sm:h-9"
                                >
                                  {loadingDocumentsFor === verification.providerId ? (
                                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  )}
                                  {loadingDocumentsFor === verification.providerId ? "Carregando..." : "Ver Documentos"}
                                </Button>
                                {verification.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApprove(verification.id)}
                                      className="rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 font-medium gap-2 shadow-lg shadow-emerald-500/25 text-xs sm:text-sm h-8 sm:h-9"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      Aprovar
                                    </Button>
                                    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="rounded-lg sm:rounded-xl font-medium gap-2 text-xs sm:text-sm h-8 sm:h-9"
                                          onClick={() => setSelectedVerification(verification)}
                                        >
                                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                          Rejeitar
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent overlayClassName="z-[10000]" className="z-10001 max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl border-border bg-card shadow-2xl mx-4 sm:mx-0">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2 text-foreground">
                                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                                            Rejeitar Verificação
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <p className="text-sm text-muted-foreground">
                                            Informe o motivo da rejeição para <strong>{selectedVerification?.providerName}</strong>:
                                          </p>
                                          <Textarea
                                            placeholder="Ex: Documentos ilegíveis, informações incompletas, etc."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={4}
                                            className="rounded-xl border-border focus:ring-2 focus:ring-rose-500/20"
                                          />
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setShowRejectDialog(false)
                                                setRejectionReason("")
                                              }}
                                              className="rounded-xl border-border"
                                            >
                                              Cancelar
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              onClick={() => selectedVerification && handleReject(selectedVerification.id)}
                                              className="rounded-xl"
                                            >
                                              Confirmar Rejeição
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {showDetails && selectedVerification && typeof document !== 'undefined' && createPortal(
          <div 
            className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/60 backdrop-blur-md"
            style={{ overflow: 'hidden', overscrollBehavior: 'contain' }}
          >
            <div 
              className="w-full max-w-full sm:max-w-7xl flex flex-col bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border/80"
              style={{ maxHeight: 'min(90dvh, 90vh)', height: 'min(85dvh, 90vh)', overflow: 'hidden' }}
            >
              {/* Header fixo - sempre visível no topo */}
              <div className="shrink-0 bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-4 sm:p-6 rounded-t-2xl sm:rounded-t-2xl shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold truncate">Documentos do Prestador</h2>
                      <p className="text-orange-100 text-sm sm:text-base truncate">{selectedVerification.providerName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                    className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-xl text-white hover:bg-white/20 shrink-0"
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Tabs + conteúdo - documentos em destaque */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-muted/50/80">
                <Tabs value={modalTab} onValueChange={setModalTab} className="flex-1 flex flex-col min-h-0 min-w-0">
                  <div className="shrink-0 px-3 sm:px-6 pt-3 pb-2 bg-card border-b border-border/80">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1 rounded-xl bg-muted flex-1 sm:flex-initial max-w-full">
                        <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                          Documentos
                        </TabsTrigger>
                        <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                          Info
                        </TabsTrigger>
                        <TabsTrigger value="structure" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                          Estrutura
                        </TabsTrigger>
                        <TabsTrigger value="acceptance" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                          Aceitação
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-medium text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                          Histórico
                        </TabsTrigger>
                      </TabsList>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(selectedVerification.status)}
                        {selectedVerification.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => { handleApprove(selectedVerification.id); setShowDetails(false) }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 h-8 text-xs sm:h-9 sm:text-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="rounded-lg h-8 text-xs sm:h-9 sm:text-sm">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rejeitar
                                </Button>
                              </DialogTrigger>
                              <DialogContent overlayClassName="z-[10000]" className="z-10001 max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                                    Rejeitar Verificação
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">Informe o motivo da rejeição:</p>
                                  <Textarea
                                    placeholder="Ex: Documentos ilegíveis..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    className="rounded-xl"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectionReason("") }}>Cancelar</Button>
                                    <Button variant="destructive" onClick={() => handleReject(selectedVerification.id)}>Confirmar</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-6 rounded-b-2xl" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <TabsContent value="documents" className="mt-0 space-y-4 min-w-0">
                      {Object.entries(selectedVerification.documents || {}).map(([type, documents]) => {
                        if (!documents || !Array.isArray(documents) || documents.length === 0) return null
                        return (
                          <div key={type} className="bg-card rounded-xl p-3 sm:p-6 shadow-card border border-border/80 min-w-0 overflow-x-hidden">
                            <h4 className="text-sm font-semibold text-foreground mb-3 capitalize">{type}</h4>
                            <DocumentViewer documents={documents as any[]} documentType={type} showActions={false} />
                          </div>
                        )
                      })}
                      {(!selectedVerification.documents || Object.keys(selectedVerification.documents).length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mb-3 text-muted-foreground/60" />
                          <p>Nenhum documento enviado</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="info" className="mt-0 space-y-4">
                      <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><User className="h-4 w-4 text-orange-600" />Informações</h3>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{selectedVerification.providerName}</span></div>
                          <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedVerification.providerEmail}</span></div>
                          {selectedVerification.providerPhone && <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selectedVerification.providerPhone}</span></div>}
                          <div><span className="text-muted-foreground">Enviado:</span> <span className="font-medium">{format(selectedVerification.submittedAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span></div>
                          <div className="xs:col-span-2">
                            <span className="text-muted-foreground block mb-1">Serviços que atende:</span>
                            {selectedVerification.providerServiceCategories && selectedVerification.providerServiceCategories.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {selectedVerification.providerServiceCategories.map((cat: string) => (
                                  <Badge key={cat} variant="outline" className="text-xs font-medium">{cat}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/60 text-sm">Não informado</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl p-4 shadow-card border border-border">
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-blue-600" />Credenciais</h3>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                          {selectedVerification.providerCpf && <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium break-all">{selectedVerification.providerCpf}</span></div>}
                          {selectedVerification.providerRg && <div><span className="text-muted-foreground">RG:</span> <span className="font-medium">{selectedVerification.providerRg}</span></div>}
                          {selectedVerification.providerAddress && <div className="col-span-full"><span className="text-muted-foreground">Endereço:</span> <span className="font-medium wrap-break-word">{selectedVerification.providerAddress}</span></div>}
                          {(selectedVerification.providerLatitude !== undefined && selectedVerification.providerLongitude !== undefined) && (
                            <div className="col-span-full">
                              <span className="text-muted-foreground">Localização:</span>{' '}
                              <span className="font-medium">
                                {selectedVerification.providerLatitude.toFixed(6)}, {selectedVerification.providerLongitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="structure" className="mt-0">
                      <UserDocumentsStructure
                        providerId={selectedVerification.providerId}
                        providerName={selectedVerification.providerName}
                        documents={selectedVerification.documents}
                        submittedAt={selectedVerification.submittedAt}
                      />
                    </TabsContent>
                    
                    <TabsContent value="acceptance" className="mt-0">
                      <ServiceAcceptanceDocs
                        verification={selectedVerification}
                        onAccept={() => { handleApprove(selectedVerification.id); setShowDetails(false) }}
                        onReject={() => setShowRejectDialog(true)}
                      />
                    </TabsContent>
                    
                    <TabsContent value="history" className="mt-0">
                      <VerificationHistory
                        verificationId={selectedVerification.id}
                        providerName={selectedVerification.providerName}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>,
          document.body
        )}
        </div>
      </div>
  )
}
