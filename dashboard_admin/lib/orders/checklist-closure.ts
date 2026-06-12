import type { ServiceChecklist, StatusFechamento, TermoAceite } from "@/types/checklist"

export type { StatusFechamento, TermoAceite }

/**
 * Contrato de fechamento da Ordem de Serviço (Aqui Resolve).
 *
 * Fonte única da verdade para as regras de negócio do encerramento da OS,
 * usada tanto pelo viewer admin quanto pela lógica de mutação (Firestore) e
 * pelo PDF. O app mobile DEVE gravar o checklist seguindo este contrato.
 */

// ─── Status de fechamento (exatamente 3 estados) ───────────────────────────────

export const STATUS_FECHAMENTO: readonly StatusFechamento[] = [
  "concluido_sucesso",
  "retorno_pendente",
  "nao_concluido_sem_retorno",
]

export interface StatusFechamentoConfig {
  label: string
  descricao: string
  badge: string
  /** Se este desfecho ainda finaliza a OS operacionalmente no painel. */
  finalizaOS: boolean
}

export const STATUS_FECHAMENTO_CONFIG: Record<StatusFechamento, StatusFechamentoConfig> = {
  concluido_sucesso: {
    label: "Concluído com sucesso",
    descricao: "Sim, concluído com sucesso.",
    badge: "bg-green-100 text-green-700 border-green-200",
    finalizaOS: true,
  },
  retorno_pendente: {
    label: "Haverá retorno",
    descricao: "Não, mas haverá retorno. O prestador precisará voltar ao local.",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    finalizaOS: true,
  },
  nao_concluido_sem_retorno: {
    label: "Não concluído, sem retorno",
    descricao: "Não, e não haverá retorno. Foge da alçada do prestador ou cliente desistiu.",
    badge: "bg-red-100 text-red-700 border-red-200",
    finalizaOS: true,
  },
}

export function isStatusFechamento(v: unknown): v is StatusFechamento {
  return typeof v === "string" && (STATUS_FECHAMENTO as readonly string[]).includes(v)
}

// ─── Regras de evidência ───────────────────────────────────────────────────────

/** Quantidade exata de fotos exigidas no fechamento (Antes / Durante / Depois). */
export const REQUIRED_PHOTO_COUNT = 3

/** Texto jurídico padrão do termo de aceite (pode ser sobrescrito por config). */
export const TERMO_ACEITE_PADRAO =
  "Declaro e concordo com as informações prestadas por mim neste formulário de encerramento, " +
  "atestando a veracidade dos dados, fotos e do desfecho do atendimento aqui registrados."

// ─── Payload de fechamento (o que o mobile envia) ──────────────────────────────

export interface ChecklistClosurePayload {
  /** Serviços realizados (seleção múltipla). Ex.: ["Elétrico", "Encanador"]. */
  servicosRealizados: string[]
  /** Avarias pré-existentes (proteção jurídica). Texto livre opcional. */
  avariasPreExistentes?: string
  statusFechamento: StatusFechamento
  /** Relato livre do desfecho do atendimento. */
  observacoes: string
  termoAceite: TermoAceite
  /** URLs das exatamente 3 fotos (Antes/Durante/Depois). */
  fotos: string[]
  assinaturaPrestadorDataUrl?: string
  assinaturaClienteDataUrl?: string
}

/**
 * Valida o payload de fechamento. Retorna a lista de pendências
 * (vazia = pode finalizar). Espelha as regras obrigatórias do formulário mobile.
 */
export function validateChecklistClosure(payload: Partial<ChecklistClosurePayload>): string[] {
  const pend: string[] = []

  if (!payload.servicosRealizados || payload.servicosRealizados.length === 0) {
    pend.push("Selecione ao menos um serviço realizado.")
  }
  if (!isStatusFechamento(payload.statusFechamento)) {
    pend.push("Selecione o status de fechamento (problema solucionado?).")
  }
  if (!payload.observacoes || payload.observacoes.trim().length === 0) {
    pend.push("Informe as observações do desfecho do atendimento.")
  }
  if (!payload.termoAceite?.aceito) {
    pend.push("É obrigatório aceitar o termo de declaração.")
  }
  const fotos = payload.fotos ?? []
  if (fotos.length !== REQUIRED_PHOTO_COUNT) {
    pend.push(`São exigidas exatamente ${REQUIRED_PHOTO_COUNT} fotos (enviadas: ${fotos.length}).`)
  }
  if (!payload.assinaturaPrestadorDataUrl) {
    pend.push("Assinatura do prestador ausente.")
  }
  if (!payload.assinaturaClienteDataUrl) {
    pend.push("Assinatura do cliente/segurado ausente.")
  }

  return pend
}

// ─── Compatibilidade com o modelo legado ───────────────────────────────────────

/**
 * Deriva o status de fechamento (3 estados) a partir de um checklist,
 * usando o campo novo quando existir ou os booleanos legados
 * (`problemaResolvido` / `haverRetorno`) como fallback.
 */
export function deriveStatusFechamento(
  cl: Pick<ServiceChecklist, "statusFechamento" | "problemaResolvido" | "haverRetorno">
): StatusFechamento | null {
  if (isStatusFechamento(cl.statusFechamento)) {
    return cl.statusFechamento
  }
  if (cl.problemaResolvido === true) {
    return "concluido_sucesso"
  }
  if (cl.problemaResolvido === false) {
    return cl.haverRetorno ? "retorno_pendente" : "nao_concluido_sem_retorno"
  }
  return null
}
