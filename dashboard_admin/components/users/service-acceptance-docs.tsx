"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  ExternalLink,
  Shield,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ServiceAcceptanceDocsProps {
  verification: any
  onAccept?: () => void
  onReject?: () => void
}

const REQUIRED_DOCUMENTS = [
  {
    id: 'cpf_rg',
    name: 'CPF e RG',
    description: 'Documentos de identificação pessoal',
    required: true
  },
  {
    id: 'cnh',
    name: 'CNH (Carteira Nacional de Habilitação)',
    description: 'Para prestadores que utilizam veículos',
    required: false
  },
  {
    id: 'comprovante_residencia',
    name: 'Comprovante de Residência',
    description: 'Conta de luz, água ou telefone (até 3 meses)',
    required: true
  },
  {
    id: 'certificado',
    name: 'Certificados Profissionais',
    description: 'Certificados de cursos, especializações ou licenças',
    required: false
  }
]

const SERVICE_TERMS = [
  'O prestador concorda em fornecer serviços de qualidade e dentro dos prazos estabelecidos',
  'O prestador deve manter seus documentos atualizados e válidos',
  'O prestador deve seguir todas as normas de segurança e qualidade da plataforma',
  'O prestador concorda em ser avaliado pelos clientes e aceitar feedback construtivo',
  'O prestador deve manter sigilo sobre informações confidenciais dos clientes',
  'O prestador concorda em pagar as taxas da plataforma conforme estabelecido'
]

export const ServiceAcceptanceDocs = ({ verification, onAccept, onReject }: ServiceAcceptanceDocsProps) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set())

  const handleDocumentCheck = (documentId: string, checked: boolean) => {
    const newChecked = new Set(checkedDocuments)
    if (checked) {
      newChecked.add(documentId)
    } else {
      newChecked.delete(documentId)
    }
    setCheckedDocuments(newChecked)
  }

  const getDocumentStatus = (documentType: string) => {
    const documents = verification.documents[documentType]
    if (!documents || documents.length === 0) {
      return { status: 'missing', label: 'Não enviado', color: 'bg-red-100 text-red-800' }
    }
    
    // Verificar se os documentos são válidos (implementar lógica de validação)
    const isValid = documents.every((doc: any) => doc.size > 0 && doc.url)
    
    if (isValid) {
      return { status: 'valid', label: 'Válido', color: 'bg-green-100 text-green-800' }
    } else {
      return { status: 'invalid', label: 'Inválido', color: 'bg-orange-100 text-orange-800' }
    }
  }

  const allRequiredDocumentsValid = REQUIRED_DOCUMENTS
    .filter(doc => doc.required)
    .every(doc => getDocumentStatus(doc.id).status === 'valid')

  const canApprove = allRequiredDocumentsValid && acceptedTerms

  return (
    <div className="space-y-6">
      {/* Informações do Prestador */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Informações do Prestador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nome Completo</p>
                <p className="text-sm font-semibold text-foreground">{verification.providerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm font-semibold text-foreground">{verification.providerEmail}</p>
              </div>
            </div>
            {verification.providerPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm font-semibold text-foreground">{verification.providerPhone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data de Cadastro</p>
                <p className="text-sm font-semibold text-foreground">
                  {format(verification.submittedAt, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-muted-foreground">Serviços que atende</p>
              {verification.providerServiceCategories && verification.providerServiceCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {verification.providerServiceCategories.map((cat: string) => (
                    <Badge key={cat} variant="outline" className="font-medium">
                      {cat}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Não informado</p>
              )}
            </div>
            {(verification.providerLatitude !== undefined && verification.providerLongitude !== undefined) && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium text-muted-foreground">Localização cadastrada</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {Number(verification.providerLatitude).toFixed(6)}, {Number(verification.providerLongitude).toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credenciais e Documentos Pessoais - DESTAQUE */}
      <Card className="border-2 border-blue-200 shadow-card bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
            <Shield className="h-5 w-5 text-blue-600" />
            Credenciais e Documentos de Identidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verification.providerCpf && (
              <div className="bg-card rounded-lg p-4 shadow-card border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">CPF</p>
                    <p className="text-lg font-bold text-blue-900">{verification.providerCpf}</p>
                  </div>
                </div>
              </div>
            )}
            {verification.providerRg && (
              <div className="bg-card rounded-lg p-4 shadow-card border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">RG</p>
                    <p className="text-lg font-bold text-purple-900">{verification.providerRg}</p>
                  </div>
                </div>
              </div>
            )}
            {verification.providerBirthDate && (
              <div className="bg-card rounded-lg p-4 shadow-card border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Data de Nascimento</p>
                    <p className="text-lg font-bold text-green-900">{verification.providerBirthDate}</p>
                  </div>
                </div>
              </div>
            )}
            {verification.providerAddress && (
              <div className="bg-card rounded-lg p-4 shadow-card border border-orange-200 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Endereço Completo</p>
                    <p className="text-base font-semibold text-orange-900">{verification.providerAddress}</p>
                  </div>
                </div>
              </div>
            )}
            {!verification.providerCpf && !verification.providerRg && !verification.providerBirthDate && !verification.providerAddress && (
              <div className="col-span-full text-center py-6 text-muted-foreground bg-card rounded-lg border border-dashed border-border">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold">Atenção: Credenciais não cadastradas</p>
                <p className="text-sm mt-1">O prestador não forneceu CPF, RG ou outros dados pessoais no cadastro.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentos Obrigatórios */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Documentos Obrigatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {REQUIRED_DOCUMENTS.map((doc) => {
              const status = getDocumentStatus(doc.id)
              return (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={checkedDocuments.has(doc.id)}
                      onCheckedChange={(checked) => handleDocumentCheck(doc.id, checked as boolean)}
                      disabled={status.status !== 'valid'}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{doc.name}</p>
                        {doc.required && (
                          <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Termos de Prestação de Serviço */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Termos de Prestação de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
              <h4 className="font-medium mb-3">Condições Gerais:</h4>
              <ul className="space-y-2 text-sm">
                {SERVICE_TERMS.map((term, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
              />
              <span className="text-sm">
                Eu li e aceito os termos de prestação de serviço e confirmo que todas as informações fornecidas são verdadeiras.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status da Verificação */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            Status da Verificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">Documentos Obrigatórios:</span>
              <Badge className={allRequiredDocumentsValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {allRequiredDocumentsValid ? "Completos" : "Incompletos"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">Termos Aceitos:</span>
              <Badge className={acceptedTerms ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {acceptedTerms ? "Aceitos" : "Não aceitos"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">Status Final:</span>
              <Badge className={canApprove ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                {canApprove ? "Apto para Aprovação" : "Pendente"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={onReject}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Rejeitar Cadastro
        </Button>
        <Button
          onClick={onAccept}
          disabled={!canApprove}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4" />
          Aprovar Prestador
        </Button>
      </div>
    </div>
  )
}
