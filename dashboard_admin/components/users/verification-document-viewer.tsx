"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Document {
  id: string
  type: 'cpf' | 'cnh' | 'comprovante_residencia' | 'certificado'
  name: string
  url: string
  uploadedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  size?: number
  mimeType?: string
}

interface VerificationDocumentViewerProps {
  documents: Document[]
  onApproveDocument?: (documentId: string) => void
  onRejectDocument?: (documentId: string) => void
  onViewDocument?: (documentId: string) => void
  onDownloadDocument?: (documentId: string) => void
}

export function VerificationDocumentViewer({
  documents,
  onApproveDocument,
  onRejectDocument,
  onViewDocument,
  onDownloadDocument
}: VerificationDocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'cpf':
        return '🆔'
      case 'cnh':
        return '🚗'
      case 'comprovante_residencia':
        return '🏠'
      case 'certificado':
        return '📜'
      default:
        return '📄'
    }
  }

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'cpf':
        return 'CPF - Documento de Identidade'
      case 'cnh':
        return 'CNH - Carteira Nacional de Habilitação'
      case 'comprovante_residencia':
        return 'Comprovante de Residência'
      case 'certificado':
        return 'Certificado Profissional'
      default:
        return 'Documento'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamanho desconhecido'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Documentos Enviados ({documents.length})</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {documents.filter(d => d.status === 'pending').length} Pendentes
          </Badge>
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {documents.filter(d => d.status === 'approved').length} Aprovados
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {documents.map((document) => (
          <Card key={document.id} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getDocumentIcon(document.type)}</div>
                  <div>
                    <h4 className="font-medium">{getDocumentTypeName(document.type)}</h4>
                    <p className="text-sm text-muted-foreground">
                      Enviado {formatDistanceToNow(document.uploadedAt, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(document.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tamanho:</span>
                  <span>{formatFileSize(document.size)}</span>
                </div>
                {document.mimeType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span>{document.mimeType}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDocument(document)
                    onViewDocument?.(document.id)
                  }}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadDocument?.(document.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>

                {document.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onApproveDocument?.(document.id)}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRejectDocument?.(document.id)}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card shadow-2xl">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5" />
                  {getDocumentTypeName(selectedDocument.type)}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDocument(null)}
                  className="hover:bg-muted"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedDocument.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tamanho</p>
                  <p>{formatFileSize(selectedDocument.size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Enviado</p>
                  <p>{formatDistanceToNow(selectedDocument.uploadedAt, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p>{selectedDocument.mimeType || 'Não especificado'}</p>
                </div>
              </div>

              {/* Document Preview Area */}
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Visualização do Documento</h3>
                <p className="text-muted-foreground mb-4">
                  Aqui seria exibida a prévia do documento enviado
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onViewDocument?.(selectedDocument.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Abrir em Nova Aba
                  </Button>
                  <Button
                    onClick={() => onDownloadDocument?.(selectedDocument.id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>

              {/* Document Actions */}
              {selectedDocument.status === 'pending' && (
                <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:items-center">
                  <Button
                    onClick={() => {
                      onApproveDocument?.(selectedDocument.id)
                      setSelectedDocument(null)
                    }}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar Documento
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onRejectDocument?.(selectedDocument.id)
                      setSelectedDocument(null)
                    }}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar Documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
