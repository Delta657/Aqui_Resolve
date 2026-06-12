"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Mail, 
  Phone, 
  Shield,
  Eye,
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  LogOut,
  Lock
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDocumentVerification } from "@/hooks/use-document-verification"
import { DocumentViewer } from "@/components/users/document-viewer"
import { useDocumentAuth } from "@/hooks/use-document-auth"
import { useToast } from "@/hooks/use-toast"
import { PageWithBack } from "@/components/layout/page-with-back"

export const VerificationsPageContent = () => {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all")
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const { toast } = useToast()
  const { user, logout } = useDocumentAuth()

  // Usar o hook de verificação de documentos
  const {
    verifications,
    loading,
    stats,
    approveVerification,
    rejectVerification,
    filterVerifications,
    refetch
  } = useDocumentVerification()

  // Filtrar verificações
  const filteredVerifications = useMemo(() => {
    return filterVerifications({
      status: statusFilter === "all" ? undefined : statusFilter as any,
      search: search || undefined,
      documentType: documentTypeFilter === "all" ? undefined : documentTypeFilter
    })
  }, [verifications, statusFilter, search, documentTypeFilter, filterVerifications])

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
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pendente</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejeitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  return (
    <PageWithBack backButtonLabel="Voltar para Dashboard">
      {/* Header com Logout */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">
              Verificação de Documentos
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Área restrita para análise e aprovação de documentos de prestadores
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto sm:items-center">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={logout}
            className="flex items-center gap-2 w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Busca */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    placeholder="Buscar por nome, email, telefone..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-20"
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Status */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  Todos
                </Button>
                <Button 
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  onClick={() => setStatusFilter("pending")}
                  size="sm"
                >
                  Pendentes
                </Button>
                <Button 
                  variant={statusFilter === "approved" ? "default" : "outline"}
                  onClick={() => setStatusFilter("approved")}
                  size="sm"
                >
                  Aprovados
                </Button>
                <Button 
                  variant={statusFilter === "rejected" ? "default" : "outline"}
                  onClick={() => setStatusFilter("rejected")}
                  size="sm"
                >
                  Rejeitados
                </Button>
              </div>
            </div>

            {/* Filtros de Tipo de Documento */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tipo de Documento</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={documentTypeFilter === "all" ? "default" : "outline"}
                  onClick={() => setDocumentTypeFilter("all")}
                  size="sm"
                >
                  Todos
                </Button>
                <Button 
                  variant={documentTypeFilter === "cpf" ? "default" : "outline"}
                  onClick={() => setDocumentTypeFilter("cpf")}
                  size="sm"
                >
                  CPF/RG
                </Button>
                <Button 
                  variant={documentTypeFilter === "cnh" ? "default" : "outline"}
                  onClick={() => setDocumentTypeFilter("cnh")}
                  size="sm"
                >
                  CNH
                </Button>
                <Button 
                  variant={documentTypeFilter === "comprovante_residencia" ? "default" : "outline"}
                  onClick={() => setDocumentTypeFilter("comprovante_residencia")}
                  size="sm"
                >
                  Comprovante
                </Button>
                <Button 
                  variant={documentTypeFilter === "certificado" ? "default" : "outline"}
                  onClick={() => setDocumentTypeFilter("certificado")}
                  size="sm"
                >
                  Certificados
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <Card className="border-0 shadow-card bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5" />
            Verificações ({filteredVerifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-skeleton" />
              ))}
            </div>
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">
                Nenhuma verificação encontrada
              </h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== "all" || documentTypeFilter !== "all" 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Não há verificações pendentes no momento.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVerifications.map((verification) => (
                <Card key={verification.id} className="border border-border shadow-card hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="font-semibold text-white">
                            {verification.providerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {verification.providerName}
                          </h3>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {verification.providerEmail}
                            </div>
                            {verification.providerPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {verification.providerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-sm sm:text-right">
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          {getStatusBadge(verification.status)}
                        </div>
                        <div>
                          <p className="text-muted-foreground">Documentos</p>
                          <p>{countTotalDocuments(verification.documents)} documentos</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Enviado</p>
                          <p>
                            {formatDistanceToNow(verification.submittedAt, { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Resumo dos tipos de documentos */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(verification.documents).map(([type, docs]) => {
                        if (!docs || !Array.isArray(docs) || docs.length === 0) return null
                        return (
                          <Badge key={type} variant="outline" className="text-xs">
                            {getDocumentTypeLabel(type)} ({docs.length})
                          </Badge>
                        )
                      })}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVerification(verification)
                          setShowDetails(true)
                        }}
                        className="flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Documentos
                      </Button>
                      
                      {verification.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(verification.id)}
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprovar
                          </Button>
                          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                            <DialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-2 w-full sm:w-auto"
                                onClick={() => setSelectedVerification(verification)}
                              >
                                <XCircle className="h-4 w-4" />
                                Rejeitar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
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
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowRejectDialog(false)
                                      setRejectionReason("")
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => selectedVerification && handleReject(selectedVerification.id)}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Details Modal */}
      {showDetails && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-card shadow-2xl">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Shield className="h-5 w-5" />
                  Documentos do Prestador - {selectedVerification.providerName}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDetails(false)}
                  className="hover:bg-muted"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="font-semibold">{selectedVerification.providerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-semibold">{selectedVerification.providerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enviado</p>
                    <p className="font-semibold">
                      {formatDistanceToNow(selectedVerification.submittedAt, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents by Type */}
              <div className="space-y-6">
                {Object.entries(selectedVerification.documents).map(([type, documents]) => {
                  if (!documents || !Array.isArray(documents) || documents.length === 0) return null
                  
                  return (
                    <div key={type} className="border rounded-lg p-4">
                      <DocumentViewer
                        documents={documents as any[]}
                        documentType={type}
                        showActions={false}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              {selectedVerification.status === 'pending' && (
                <div className="flex items-center justify-center gap-4 pt-6 border-t">
                  <Button
                    onClick={() => {
                      handleApprove(selectedVerification.id)
                      setShowDetails(false)
                    }}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2 px-8"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar Prestador
                  </Button>
                  <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2 px-8"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar Prestador
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          Rejeitar Verificação
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Informe o motivo da rejeição para <strong>{selectedVerification.providerName}</strong>:
                        </p>
                        <Textarea
                          placeholder="Ex: Documentos ilegíveis, informações incompletas, etc."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRejectDialog(false)
                              setRejectionReason("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(selectedVerification.id)}
                          >
                            Confirmar Rejeição
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageWithBack>
  )
}
