"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  File,
  User,
  Calendar,
  Download,
  Eye,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { StorageDocument } from "@/types/verification"
import { cn } from "@/lib/utils"

interface UserDocumentsStructureProps {
  providerId: string
  providerName: string
  documents: Record<string, StorageDocument[]>
  submittedAt: Date
}

const DOCUMENT_TYPES = {
  cpf: { label: 'CPF/RG', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  cnh: { label: 'CNH', icon: FileText, color: 'bg-green-100 text-green-800' },
  comprovante_residencia: { label: 'Comprovante de Residência', icon: FileText, color: 'bg-orange-100 text-orange-800' },
  certificado: { label: 'Certificados', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  outros: { label: 'Outros', icon: File, color: 'bg-muted text-muted-foreground' }
}

export const UserDocumentsStructure = ({ 
  providerId, 
  providerName, 
  documents, 
  submittedAt 
}: UserDocumentsStructureProps) => {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedTypes(newExpanded)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalDocuments = Object.values(documents).reduce((total, docs) => total + (docs?.length || 0), 0)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Estrutura de Documentos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pasta do usuário: {providerId}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {totalDocuments} documentos
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações do usuário */}
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{providerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Enviado {formatDistanceToNow(submittedAt, { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Estrutura de pastas por tipo */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Documentos por categoria:</h4>
          
          {Object.entries(documents).map(([type, docs]) => {
            if (!docs || docs.length === 0) return null
            
            const typeInfo = DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES] || DOCUMENT_TYPES.outros
            const Icon = typeInfo.icon
            const isExpanded = expandedTypes.has(type)
            
            return (
              <div key={type} className="border rounded-lg">
                <Button
                  variant="ghost"
                  onClick={() => toggleType(type)}
                  className="w-full justify-between p-3 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{typeInfo.label}</span>
                    <Badge className={cn("text-xs", typeInfo.color)}>
                      {docs.length} {docs.length === 1 ? 'arquivo' : 'arquivos'}
                    </Badge>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                
                {isExpanded && (
                  <div className="border-t p-3 space-y-2">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.type)}
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.size)} • {formatDistanceToNow(doc.uploadedAt, { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = doc.url
                              link.download = doc.name
                              link.click()
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Caminho no Storage */}
        <div className="p-3 bg-muted/20 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Caminho no Firebase Storage:</p>
          <code className="text-xs bg-background px-2 py-1 rounded border">
            Documentos/{providerId}/
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
