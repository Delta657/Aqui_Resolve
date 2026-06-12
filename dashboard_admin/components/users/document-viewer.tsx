"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Image as ImageIcon,
  File,
  Calendar,
  User,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { downloadDocument, resolveStorageDownloadUrl } from "@/lib/storage"
import { StorageDocument } from "@/types/verification"
import { cn } from "@/lib/utils"

interface DocumentViewerProps {
  documents: StorageDocument[]
  documentType: string
  onApprove?: (documentId: string) => void
  onReject?: (documentId: string) => void
  showActions?: boolean
}

interface DocumentModalProps {
  document: StorageDocument | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (document: StorageDocument) => void
}

function useResolvedDocumentUrl(document: StorageDocument | null) {
  const [resolved, setResolved] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (!document) {
      setResolved(null)
      return
    }
    if (document.url) {
      setResolved(document.url)
      return
    }
    if (!document.path) {
      setResolved(null)
      return
    }
    let cancelled = false
    setResolving(true)
    resolveStorageDownloadUrl(document.path)
      .then((u) => {
        if (!cancelled) setResolved(u)
      })
      .finally(() => {
        if (!cancelled) setResolving(false)
      })
    return () => {
      cancelled = true
    }
  }, [document?.id, document?.path, document?.url])

  const displayUrl = useMemo(() => document?.url || resolved || null, [document?.url, resolved])

  return { displayUrl, resolving }
}

const DocumentModal = ({ document, isOpen, onClose, onDownload }: DocumentModalProps) => {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { displayUrl, resolving } = useResolvedDocumentUrl(document)

  if (!document) return null

  const handleDownload = async () => {
    if (onDownload) {
      setIsLoading(true)
      try {
        await onDownload(document)
      } catch (error: any) {
        console.error('❌ Erro ao baixar documento:', {
          code: error?.code,
          message: error?.message,
          documentName: document.name
        })
        // Se a URL não funcionar, tenta abrir em nova aba
        if (displayUrl) {
          window.open(displayUrl, '_blank')
        }
      } finally {
        setIsLoading(false)
      }
    } else if (displayUrl) {
      window.open(displayUrl, '_blank')
    }
  }

  const resetView = () => {
    setZoom(100)
    setRotation(0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        overlayClassName="z-[10000]"
        className={cn(
          "left-[50%]! top-[50%]! translate-x-[-50%]! translate-y-[-50%]!",
          "flex! flex-col gap-0 p-0",
          "w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-full sm:max-w-4xl",
          "max-h-[92dvh] sm:max-h-[88vh] overflow-hidden",
          "z-10001 rounded-xl sm:rounded-2xl border shadow-2xl bg-background",
          "mx-2 sm:mx-0"
        )}
      >
        <DialogHeader className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base truncate pr-12">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">{document.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
          {/* Controles */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-muted/50 p-2 sm:p-3 rounded-lg">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                disabled={zoom <= 50}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium min-w-[50px] sm:min-w-[60px] text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(300, zoom + 25))}
                disabled={zoom >= 300}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation((rotation + 90) % 360)}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
              >
                Reset
              </Button>
            </div>
            
            <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isLoading}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 sm:mr-2 shrink-0" />
                <span className="hidden sm:inline">{isLoading ? 'Baixando...' : 'Baixar'}</span>
                <span className="sm:hidden">{isLoading ? '...' : 'Baixar'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!displayUrl}
                onClick={() => displayUrl && window.open(displayUrl, '_blank')}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Maximize2 className="h-4 w-4 sm:mr-2 shrink-0" />
                <span className="hidden xs:inline">Abrir em Nova Aba</span>
                <span className="xs:hidden">Abrir</span>
              </Button>
            </div>
          </div>

          {/* Visualização do documento */}
          <div className="flex justify-center items-center bg-muted rounded-lg overflow-auto min-h-40 sm:min-h-64 md:min-h-88 max-h-[50dvh] sm:max-h-[55dvh] w-full">
            {resolving ? (
              <div className="flex flex-col items-center gap-3 p-8">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
                <p className="text-sm text-muted-foreground">Obtendo link do Firebase Storage…</p>
              </div>
            ) : document.type === 'image' && displayUrl ? (
              <img
                src={displayUrl}
                alt={document.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  const parent = target.parentElement
                  
                  console.error('❌ Erro ao carregar imagem:', {
                    url: displayUrl,
                    name: document.name
                  })
                  
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center p-8 w-full">
                        <div class="w-16 h-16 mx-auto mb-4 text-orange-400">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                          </svg>
                        </div>
                        <p class="text-orange-600 font-medium mb-2">Não foi possível carregar a imagem</p>
                        <p class="text-sm text-muted-foreground mb-4">O arquivo pode ter sido removido ou não está mais acessível</p>
                        <div class="flex gap-2 justify-center">
                          <button onclick="window.open('${displayUrl}', '_blank')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                            Tentar abrir em nova aba
                          </button>
                        </div>
                      </div>
                    `
                  }
                }}
                onLoad={() => {}}
              />
            ) : !displayUrl ? (
              <div className="text-center p-8 w-full">
                <AlertCircle className="h-16 w-16 mx-auto text-orange-400 mb-4" />
                <p className="text-orange-600 font-medium mb-2">URL do documento não disponível</p>
                <p className="text-sm text-muted-foreground">
                  Não foi possível gerar o link de download. Verifique permissões do Storage ou se o arquivo existe em{" "}
                  <code className="text-xs break-all">{document.path || "—"}</code>
                </p>
              </div>
            ) : (
              <div className="text-center p-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Visualização não disponível para este tipo de arquivo</p>
                <Button onClick={handleDownload} disabled={isLoading || !displayUrl}>
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? 'Baixando...' : 'Baixar Arquivo'}
                </Button>
                {displayUrl && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(displayUrl, '_blank')}
                    className="ml-2"
                  >
                    Abrir em Nova Aba
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Informações do documento */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Tamanho</p>
              <p>{formatFileSize(document.size)}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Tipo</p>
              <p className="capitalize">{document.type}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Enviado</p>
              <p>{formatDistanceToNow(document.uploadedAt, { addSuffix: true, locale: ptBR })}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Nome do arquivo</p>
              <p className="truncate" title={document.name}>{document.name}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getDocumentTypeIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-4 w-4" />
    case 'pdf':
      return <FileText className="h-4 w-4" />
    default:
      return <File className="h-4 w-4" />
  }
}

const getDocumentTypeColor = (type: string) => {
  switch (type) {
    case 'image':
      return 'bg-blue-100 text-blue-800'
    case 'pdf':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function DocumentGridPreview({
  document,
  onView,
}: {
  document: StorageDocument
  onView: () => void
}) {
  const { displayUrl, resolving } = useResolvedDocumentUrl(document)

  return (
    <div className="relative">
      {resolving ? (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-[10px] text-muted-foreground px-2 text-center">Carregando prévia…</p>
        </div>
      ) : document.type === 'image' && displayUrl ? (
        <div
          className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
          onClick={onView}
        >
          <img
            src={displayUrl}
            alt={document.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              const parent = target.parentElement
              console.error('❌ Erro ao carregar preview da imagem:', {
                url: displayUrl,
                name: document.name,
              })
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-orange-50">
                    <div class="text-center p-2">
                      <p class="text-xs text-orange-600 font-medium">Imagem não disponível</p>
                      <p class="text-xs text-muted-foreground">Clique para ver detalhes</p>
                    </div>
                  </div>
                `
              }
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center pointer-events-none">
            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
      ) : !displayUrl ? (
        <div
          className="aspect-video bg-orange-50 rounded-lg flex items-center justify-center cursor-pointer"
          onClick={onView}
        >
          <div className="text-center p-4">
            <AlertCircle className="h-10 w-10 mx-auto text-orange-400 mb-2" />
            <p className="text-xs text-orange-600 font-medium">Toque para tentar abrir</p>
          </div>
        </div>
      ) : (
        <div
          className="aspect-video bg-muted rounded-lg flex items-center justify-center cursor-pointer"
          onClick={onView}
        >
          <div className="text-center">
            {getDocumentTypeIcon(document.type)}
            <p className="text-xs text-muted-foreground mt-2">Clique para visualizar</p>
          </div>
        </div>
      )}
    </div>
  )
}

export const DocumentViewer = ({ 
  documents, 
  documentType, 
  onApprove, 
  onReject, 
  showActions = true 
}: DocumentViewerProps) => {
  const [selectedDocument, setSelectedDocument] = useState<StorageDocument | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleViewDocument = (document: StorageDocument) => {
    setSelectedDocument(document)
    setIsModalOpen(true)
  }

  const handleDownloadDocument = async (document: StorageDocument) => {
    let url = document.url
    if (!url && document.path) {
      url = (await resolveStorageDownloadUrl(document.path)) || ''
    }
    if (!url) {
      console.error('❌ URL do documento não disponível:', document.name)
      return
    }

    try {
      await downloadDocument(url, document.name)
    } catch (error: any) {
      console.error('❌ Erro ao baixar documento:', {
        code: error?.code,
        message: error?.message,
        documentName: document.name,
        url,
      })

      if (url) {
        window.open(url, '_blank')
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDocument(null)
  }

  if (!documents || documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum documento encontrado</p>
          <p className="text-sm text-muted-foreground">Este tipo de documento ainda não foi enviado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
        <h3 className="font-semibold text-base sm:text-lg capitalize flex items-center gap-2 truncate">
          {getDocumentTypeIcon(documentType)}
          {documentType.replace('_', ' ')}
        </h3>
        <Badge variant="outline" className="flex items-center gap-1 shrink-0 w-fit">
          {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        {documents.map((document) => (
          <Card key={document.id} className="group hover:shadow-md transition-shadow min-w-0 overflow-hidden">
            <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {/* Preview do documento */}
              <DocumentGridPreview
                document={document}
                onView={() => handleViewDocument(document)}
              />

              {/* Informações do documento */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate" title={document.name}>
                    {document.name}
                  </p>
                  <Badge className={cn("text-xs", getDocumentTypeColor(document.type))}>
                    {document.type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(document.uploadedAt, { addSuffix: true, locale: ptBR })}
                  </div>
                  <div>{formatFileSize(document.size)}</div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDocument(document)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(document)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>

              {/* Ações de aprovação/rejeição */}
              {showActions && onApprove && onReject && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={() => onApprove(document.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onReject(document.id)}
                    className="flex-1"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de visualização */}
      <DocumentModal
        document={selectedDocument}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDownload={handleDownloadDocument}
      />
    </div>
  )
}
