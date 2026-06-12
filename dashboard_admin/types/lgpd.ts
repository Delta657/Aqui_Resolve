/**
 * Tipos relacionados à conformidade LGPD
 */

export type ConsentType = 
  | 'marketing'
  | 'analytics'
  | 'necessario'
  | 'contrato'
  | 'obrigacao_legal'
  | 'protecao_vida'
  | 'tutela_saude'
  | 'politicas_publicas'
  | 'estudos_pesquisa'
  | 'protecao_credito'
  | 'garantia_prestacao'

export type DataSubjectRight = 
  | 'acesso'
  | 'correcao'
  | 'exclusao'
  | 'portabilidade'
  | 'revogacao_consentimento'
  | 'informacao_tratamento'
  | 'revisao_decisao_automatizada'

export type ProcessingActivity = 
  | 'criacao_usuario'
  | 'atualizacao_usuario'
  | 'exclusao_usuario'
  | 'login'
  | 'acesso_dados'
  | 'exportacao_dados'
  | 'compartilhamento_dados'
  | 'processamento_pedido'
  | 'analise_comportamental'

export type LegalBasis = 
  | 'consentimento'
  | 'execucao_contrato'
  | 'obrigacao_legal'
  | 'protecao_vida'
  | 'tutela_saude'
  | 'politicas_publicas'
  | 'estudos_pesquisa'
  | 'protecao_credito'
  | 'legitimo_interesse'

export interface Consent {
  id: string
  userId: string
  userEmail: string
  consentType: ConsentType
  granted: boolean
  grantedAt: Date
  revokedAt?: Date
  ipAddress?: string
  userAgent?: string
  version: string // Versão da política de privacidade
  createdAt: Date
  updatedAt: Date
}

export interface DataProcessingLog {
  id: string
  userId: string
  userEmail: string
  activity: ProcessingActivity
  dataType: string[] // Tipos de dados processados
  legalBasis: LegalBasis
  purpose: string
  retentionPeriod?: number // Dias
  sharedWith?: string[] // Terceiros com quem foi compartilhado
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface DataSubjectRequest {
  id: string
  userId: string
  userEmail: string
  requestType: DataSubjectRight
  status: 'pendente' | 'em_andamento' | 'concluido' | 'rejeitado'
  description?: string
  requestedAt: Date
  completedAt?: Date
  responseData?: any // Dados retornados para acesso/portabilidade
  rejectionReason?: string
  handledBy?: string // ID do responsável
  notes?: string
}

export interface DataRetentionPolicy {
  dataType: string
  retentionPeriod: number // Dias
  anonymizeAfter?: number // Dias para anonimizar
  deleteAfter: number // Dias para deletar
  legalBasis: LegalBasis
  description: string
}

export interface DataBreach {
  id: string
  detectedAt: Date
  reportedAt?: Date
  description: string
  affectedUsers: string[]
  dataTypes: string[]
  severity: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'detectado' | 'investigando' | 'mitigado' | 'resolvido'
  mitigationActions: string[]
  notifiedUsers: boolean
  notifiedAuthorities: boolean
  authorityNotificationDate?: Date
  resolutionDate?: Date
}

export interface PersonalDataMapping {
  dataType: string
  category: 'identificacao' | 'contato' | 'financeiro' | 'comportamental' | 'biometrico' | 'localizacao'
  sensitive: boolean
  collectionSource: string
  purpose: string
  legalBasis: LegalBasis
  retentionPeriod: number
  sharedWith: string[]
  securityMeasures: string[]
}

export interface LGPDConfig {
  dpoName?: string
  dpoEmail?: string
  dpoPhone?: string
  privacyPolicyVersion: string
  privacyPolicyUrl: string
  termsOfServiceUrl: string
  dataRetentionEnabled: boolean
  anonymizationEnabled: boolean
  consentRequired: boolean
  auditLogEnabled: boolean
}


