import type { Timestamp } from "firebase/firestore"

// ─── Item de template ────────────────────────────────────────────────────────

export type ChecklistItemType =
  | "checkbox"
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multi_select"
  | "photo"
  | "signature"
  | "damage_report"
  | "rating"

export type ChecklistItemPhase =
  | "pre_servico"   // antes de iniciar (avarias pré-existentes)
  | "execucao"      // durante execução
  | "conclusao"     // ao finalizar

export interface ChecklistTemplateItem {
  id: string
  titulo: string
  descricao?: string
  tipo: ChecklistItemType
  fase: ChecklistItemPhase
  obrigatorio: boolean
  opcoes?: string[]         // para tipos select / multi_select
  placeholder?: string
  minFotos?: number         // para tipo photo: mínimo de fotos exigidas
  ordem: number
}

// ─── Template (configurado pelo admin) ───────────────────────────────────────

export interface ChecklistTemplate {
  id: string
  nome: string
  descricao: string
  tiposServico: string[]    // ["CONSERTO MECANICO", "REPARO RESIDENCIAL"] ou ["*"] para todos
  cliente: string           // "TODOS" ou nome específico
  itens: ChecklistTemplateItem[]
  ativo: boolean
  obrigatorio: boolean      // se obrigatório em todo serviço do tipo
  versao: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  updatedBy?: string
}

// ─── Avaria pré-existente ─────────────────────────────────────────────────────

export interface AvariaPreExistente {
  id: string
  descricao: string
  localização: string       // ex: "Parede sul", "Armário da cozinha"
  fotoUrl?: string
  registradoEm: Timestamp
  registradoPor: string     // providerId
}

// ─── Foto do serviço ─────────────────────────────────────────────────────────

export type FotoFase = "antes" | "durante" | "depois" | "avaria"

export interface FotoServico {
  id: string
  url: string
  thumbnailUrl?: string
  fase: FotoFase
  descricao?: string
  lat?: number
  lng?: number
  timestamp: Timestamp
  uploadedBy: string
  uploadedByName?: string
  storagePath: string
}

// ─── Assinatura digital ───────────────────────────────────────────────────────

export interface AssinaturaDigital {
  dataUrl: string           // PNG base64
  hash: string              // SHA-256 do dataUrl para integridade
  signatoryName: string
  signatoryId?: string
  signatoryType: "cliente" | "prestador"
  signedAt: Timestamp
  deviceInfo?: string       // user-agent ou info do dispositivo
  ipAddress?: string
}

// ─── Resposta individual de item ──────────────────────────────────────────────

export interface ChecklistItemResposta {
  itemId: string
  titulo: string
  tipo: ChecklistItemType
  fase: ChecklistItemPhase
  valor: string | boolean | string[] | number | null
  fotoUrls?: string[]
  observacao?: string
  respondidoEm?: Timestamp
}

// ─── Código de validação de início de serviço ─────────────────────────────────

export interface ServiceValidation {
  code: string               // 6 dígitos numéricos
  generatedAt: Timestamp
  expiresAt: Timestamp       // validade: 30 minutos
  confirmedAt?: Timestamp
  confirmedBy?: string       // clienteId ou nome
  confirmedByPhone?: string
  attempts: number
  maxAttempts: number        // default 5
  status: "pending" | "confirmed" | "expired" | "blocked"
}

// ─── Fechamento da OS (contrato Aqui Resolve) ─────────────────────────────────

/** Desfecho do atendimento — exatamente 3 estados possíveis. */
export type StatusFechamento =
  | "concluido_sucesso"
  | "retorno_pendente"
  | "nao_concluido_sem_retorno"

/** Termo de aceite jurídico assinado no encerramento. */
export interface TermoAceite {
  aceito: boolean
  /** Texto exato exibido e aceito no momento da assinatura (auditoria). */
  texto: string
  aceitoEm?: Timestamp
  aceitoPor?: string
}

// ─── Checklist de serviço (preenchido pelo prestador) ─────────────────────────

export type ServiceChecklistStatus =
  | "nao_iniciado"
  | "em_progresso"
  | "aguardando_assinatura_cliente"
  | "aguardando_assinatura_prestador"
  | "concluido"
  | "rejeitado"

export interface ServiceChecklist {
  id: string
  orderId: string
  orderNumero?: string
  templateId: string
  templateNome: string
  providerId: string
  providerNome: string
  clienteId?: string
  clienteNome?: string
  status: ServiceChecklistStatus
  respostas: ChecklistItemResposta[]
  avariasPre: AvariaPreExistente[]
  fotos: FotoServico[]
  assinaturaCliente?: AssinaturaDigital
  assinaturaPrestador?: AssinaturaDigital
  /** Serviços realizados (seleção múltipla). Ex.: ["Elétrico", "Encanador"]. */
  servicosRealizados?: string[]
  /** Avarias pré-existentes em texto livre (proteção jurídica do prestador). */
  avariasPreExistentes?: string
  /** Status de fechamento (3 estados) — fonte da verdade do desfecho. */
  statusFechamento?: StatusFechamento
  /** Termo de aceite jurídico aceito no encerramento. */
  termoAceite?: TermoAceite
  /** @deprecated Use statusFechamento. Mantido p/ compatibilidade com dados antigos. */
  problemaResolvido?: boolean
  /** @deprecated Use statusFechamento. Mantido p/ compatibilidade com dados antigos. */
  haverRetorno?: boolean
  motivoNaoConclusao?: string
  observacoesTecnicas?: string
  /** Timestamp quando o prestador iniciou o preenchimento */
  iniciadoEm?: Timestamp
  /** Timestamp quando foi concluído e assinado */
  concluidoEm?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── Estatísticas de checklists ───────────────────────────────────────────────

export interface ChecklistStats {
  total: number
  ativos: number
  inativos: number
  porTipoServico: Record<string, number>
  preenchidosHoje: number
  preenchidosMes: number
  taxaConclusao: number     // % de serviços com checklist concluído
}

// ─── Filtros para busca ───────────────────────────────────────────────────────

export interface ChecklistTemplateFilters {
  search?: string
  tipoServico?: string
  cliente?: string
  ativo?: boolean
}

export interface ServiceChecklistFilters {
  orderId?: string
  providerId?: string
  status?: ServiceChecklistStatus
  dateFrom?: Date
  dateTo?: Date
}
