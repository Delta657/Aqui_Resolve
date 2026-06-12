import type { Timestamp } from "firebase/firestore"

/** Estados operacionais do atendimento (campo `serviceOperationalStatus` no Firestore). */
export const SERVICE_OPERATIONAL_STATUSES = [
  "pendente",
  "aceite_pelo_tecnico",
  "em_deslocamento",
  "chegou_no_local",
  "aguardando_validacao",  // aguarda código de validação do cliente para iniciar
  "em_atendimento",
  "pausado",
  "aguardando_cliente",
  "finalizado",
  "cancelado",
] as const

export type ServiceOperationalStatus = (typeof SERVICE_OPERATIONAL_STATUSES)[number]

// ─── Código de validação de início de serviço ─────────────────────────────────

export interface ServiceStartValidation {
  code: string
  generatedAt: Timestamp
  expiresAt: Timestamp
  confirmedAt?: Timestamp
  confirmedBy?: string
  confirmedByPhone?: string
  attempts: number
  maxAttempts: number
  status: "pending" | "confirmed" | "expired" | "blocked"
}

/** Verifica se a validação de início está confirmada. */
export function isValidationConfirmed(v: ServiceStartValidation | null | undefined): boolean {
  return v?.status === "confirmed" && !!v.confirmedAt
}

/** Gera um código aleatório de 6 dígitos (lado servidor deve usar crypto seguro). */
export function generateValidationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ─── Flags de conclusão de serviço ────────────────────────────────────────────

export interface ServiceCompletionFlags {
  /** Checklist preenchido e concluído */
  checklistCompleted: boolean
  checklistId?: string
  /** Mínimo de fotos obrigatórias enviadas */
  photosUploaded: boolean
  photosCount?: number
  /** Assinatura do cliente coletada */
  clientSignatureCollected: boolean
  /** Assinatura do prestador coletada */
  providerSignatureCollected: boolean
}

/** Valida se o serviço pode ser finalizado. Retorna lista de pendências. */
export function getCompletionBlockers(flags: Partial<ServiceCompletionFlags>): string[] {
  const blockers: string[] = []
  if (!flags.checklistCompleted) blockers.push("Checklist não concluído")
  if (!flags.photosUploaded) blockers.push("Fotos obrigatórias não enviadas")
  if (!flags.clientSignatureCollected) blockers.push("Assinatura do cliente ausente")
  if (!flags.providerSignatureCollected) blockers.push("Assinatura do prestador ausente")
  return blockers
}

export type LegacyOrderStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled" | string

export interface ServiceTimestamps {
  acceptedAt?: Timestamp | null
  departureAt?: Timestamp | null
  arrivalAt?: Timestamp | null
  executionStartedAt?: Timestamp | null
  waitingClientAt?: Timestamp | null
  finishedAt?: Timestamp | null
  cancelledOperationalAt?: Timestamp | null
  /** Segmentos de pausa (inicio/fim em Timestamp ou Date serializado). */
  pauseIntervals?: Array<{ start?: Timestamp | null; end?: Timestamp | null }>
}

export interface AssignedTechnician {
  id: string
  name: string
  team?: string
  avatarUrl?: string
  online?: boolean
  acceptedAt?: Timestamp | null
}

export interface TechnicianHistoryEntry {
  technicianId: string
  technicianName: string
  team?: string
  assignedAt: Timestamp | null
  unassignedAt?: Timestamp | null
  reason?: string
}

export interface OperationalEventPayload {
  at: Timestamp
  type: "status_change" | "technician_assign" | "technician_reassign" | "note"
  fromStatus: ServiceOperationalStatus | null
  toStatus: ServiceOperationalStatus | null
  actorUid?: string
  actorEmail?: string
  actorName?: string
  note?: string
  mutationId: string
  technicianId?: string
  technicianName?: string
}

export const OPERATIONAL_STATUS_LABELS: Record<ServiceOperationalStatus, string> = {
  pendente: "Pendente",
  aceite_pelo_tecnico: "Aceite pelo Técnico",
  em_deslocamento: "Em Deslocamento",
  chegou_no_local: "Chegou no Local",
  aguardando_validacao: "Aguardando Validação",
  em_atendimento: "Em Atendimento",
  pausado: "Pausado",
  aguardando_cliente: "Aguardando Cliente",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
}

export const OPERATIONAL_STATUS_BADGE_CLASS: Record<ServiceOperationalStatus, string> = {
  pendente: "bg-amber-100 text-amber-900 border-amber-200",
  aceite_pelo_tecnico: "bg-sky-100 text-sky-900 border-sky-200",
  em_deslocamento: "bg-indigo-100 text-indigo-900 border-indigo-200",
  chegou_no_local: "bg-violet-100 text-violet-900 border-violet-200",
  aguardando_validacao: "bg-yellow-100 text-yellow-900 border-yellow-300",
  em_atendimento: "bg-emerald-100 text-emerald-900 border-emerald-200",
  pausado: "bg-orange-100 text-orange-900 border-orange-200",
  aguardando_cliente: "bg-cyan-100 text-cyan-900 border-cyan-200",
  finalizado: "bg-green-100 text-green-900 border-green-200",
  cancelado: "bg-red-100 text-red-900 border-red-200",
}

/** Ícone (Lucide name) para cada estado — use com <LucideIcon name={OPERATIONAL_STATUS_ICON[s]} /> */
export const OPERATIONAL_STATUS_ORDER: Record<ServiceOperationalStatus, number> = {
  pendente: 0,
  aceite_pelo_tecnico: 1,
  em_deslocamento: 2,
  chegou_no_local: 3,
  aguardando_validacao: 4,
  em_atendimento: 5,
  pausado: 5,
  aguardando_cliente: 5,
  finalizado: 6,
  cancelado: 6,
}

const isTerminal = (s: ServiceOperationalStatus) => s === "finalizado" || s === "cancelado"

const ALLOWED: Record<ServiceOperationalStatus, ServiceOperationalStatus[]> = {
  pendente: ["aceite_pelo_tecnico", "cancelado"],
  aceite_pelo_tecnico: ["em_deslocamento", "cancelado"],
  em_deslocamento: ["chegou_no_local", "cancelado"],
  chegou_no_local: ["aguardando_validacao", "em_atendimento", "cancelado"],
  // aguardando_validacao: prestador chegou, aguarda código do cliente para iniciar
  aguardando_validacao: ["em_atendimento", "cancelado"],
  em_atendimento: ["pausado", "aguardando_cliente", "finalizado", "cancelado"],
  pausado: ["em_atendimento", "cancelado"],
  aguardando_cliente: ["em_atendimento", "pausado", "cancelado"],
  finalizado: [],
  cancelado: [],
}

export function isServiceOperationalStatus(value: unknown): value is ServiceOperationalStatus {
  return typeof value === "string" && (SERVICE_OPERATIONAL_STATUSES as readonly string[]).includes(value)
}

/** Deriva estado operacional a partir do legado quando o campo novo não existe. */
export function resolveOperationalStatus(order: Record<string, unknown>): ServiceOperationalStatus {
  const direct = order.serviceOperationalStatus
  if (isServiceOperationalStatus(direct)) {
    return direct
  }
  // suporte a legado com campo aguardando_validacao como string
  if (direct === "aguardando_validacao") return "aguardando_validacao"

  const legacy = String(order.status || "").toLowerCase()

  if (order.cancelledAt || legacy === "cancelled" || legacy === "canceled") {
    return "cancelado"
  }
  if (legacy === "completed" || legacy === "finished") {
    return "finalizado"
  }
  if (legacy === "assigned" || legacy === "accepted") {
    return "aceite_pelo_tecnico"
  }
  if (legacy === "on_the_way") {
    return "em_deslocamento"
  }
  if (legacy === "arrived") {
    return "chegou_no_local"
  }
  if (legacy === "in_progress" || legacy === "started") {
    return "em_atendimento"
  }
  // pending, awaiting_payment, paid, scheduled, searching_provider… → ainda não despachado
  return "pendente"
}

/** Mantém compatibilidade com filtros e telas que usam `status` simples. */
export function operationalToLegacyStatus(op: ServiceOperationalStatus): LegacyOrderStatus {
  if (op === "finalizado") return "completed"
  if (op === "cancelado") return "cancelled"
  if (op === "pendente") return "pending"
  if (op === "aceite_pelo_tecnico") return "assigned"
  return "in_progress"
}

/** Retorna true se o estado indica que o serviço está ativamente em campo. */
export function isActiveFieldStatus(s: ServiceOperationalStatus): boolean {
  return [
    "em_deslocamento",
    "chegou_no_local",
    "aguardando_validacao",
    "em_atendimento",
    "pausado",
    "aguardando_cliente",
  ].includes(s)
}

const FIELD_STATUSES_REQUIRING_TECH: ServiceOperationalStatus[] = [
  "em_deslocamento",
  "chegou_no_local",
  "aguardando_validacao",
  "em_atendimento",
  "pausado",
  "aguardando_cliente",
  "finalizado",
]

export interface TransitionContext {
  hasAssignedTechnician: boolean
  serviceTimestamps: ServiceTimestamps | undefined
  /** true quando código de validação do cliente foi confirmado */
  validationConfirmed?: boolean
  /** pendências que bloqueiam a finalização (checklist, fotos, assinaturas) */
  completionBlockers?: string[]
}

export function getAllowedNextOperationalStatuses(from: ServiceOperationalStatus): ServiceOperationalStatus[] {
  return ALLOWED[from] ?? []
}

export function assertOperationalTransition(
  from: ServiceOperationalStatus,
  to: ServiceOperationalStatus,
  ctx: TransitionContext
): void {
  if (from === to) {
    throw new Error("O novo estado deve ser diferente do atual.")
  }

  if (isTerminal(from)) {
    throw new Error("Pedido encerrado: não é possível alterar o estado operacional.")
  }

  if (!ALLOWED[from]?.includes(to)) {
    throw new Error(`Transição não permitida: ${OPERATIONAL_STATUS_LABELS[from]} → ${OPERATIONAL_STATUS_LABELS[to]}.`)
  }

  if (to === "aceite_pelo_tecnico" && !ctx.hasAssignedTechnician) {
    throw new Error("É obrigatório informar o técnico antes de marcar como aceite.")
  }

  if (to === "aguardando_validacao" && !ctx.hasAssignedTechnician) {
    throw new Error("É obrigatório ter técnico atribuído para solicitar validação de início.")
  }

  if (to === "em_atendimento" && from === "aguardando_validacao") {
    if (!ctx.validationConfirmed) {
      throw new Error("O cliente deve confirmar o código de validação antes de iniciar o atendimento.")
    }
  }

  if (to === "finalizado") {
    const started = ctx.serviceTimestamps?.executionStartedAt
    if (!started && from !== "em_atendimento") {
      throw new Error("Só é possível finalizar após o estado Em Atendimento (ou com registro de início).")
    }
    if (ctx.completionBlockers && ctx.completionBlockers.length > 0) {
      throw new Error(`Pendências para finalizar: ${ctx.completionBlockers.join("; ")}.`)
    }
  }

  if (FIELD_STATUSES_REQUIRING_TECH.includes(to) && !ctx.hasAssignedTechnician) {
    throw new Error("É obrigatório ter técnico atribuído para avançar a este estado operacional.")
  }
}

export interface OperationalMetricsMs {
  displacementMs: number | null
  executionMs: number | null
  pausedMs: number | null
  totalSinceAcceptMs: number | null
  slaRemainingMs: number | null
  delayMs: number | null
}

function timestampToMs(value: Timestamp | Date | null | undefined): number | null {
  if (!value) return null
  if (value instanceof Date) return value.getTime()
  if (typeof (value as Timestamp).toMillis === "function") {
    return (value as Timestamp).toMillis()
  }
  return null
}

export const DEFAULT_SLA_TARGET_MINUTES = 240

/** Prazo SLA em ms: slaDueAt explícito ou createdAt + slaTargetMinutes (default 240). */
export function resolveOperationalSlaDeadlineMs(order: Record<string, unknown>): number | null {
  const explicit = timestampToMs(order.slaDueAt as Timestamp | undefined)
  if (explicit != null) {
    return explicit
  }
  const created = timestampToMs(order.createdAt as Timestamp | undefined)
  if (created == null) {
    return null
  }
  const raw = Number(order.slaTargetMinutes)
  const mins = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SLA_TARGET_MINUTES
  return created + mins * 60_000
}

/** Garante ordem temporal aceite → deslocamento → chegada → execução → término (quando presentes). */
export function assertMonotonicServiceTimestamps(ts: ServiceTimestamps): void {
  const pairs: Array<[string, number]> = []
  const add = (label: string, v: Timestamp | null | undefined) => {
    const ms = timestampToMs(v as Timestamp | undefined)
    if (ms != null) pairs.push([label, ms])
  }
  add("acceptedAt", ts.acceptedAt ?? undefined)
  add("departureAt", ts.departureAt ?? undefined)
  add("arrivalAt", ts.arrivalAt ?? undefined)
  add("executionStartedAt", ts.executionStartedAt ?? undefined)
  add("finishedAt", ts.finishedAt ?? undefined)

  for (let i = 1; i < pairs.length; i++) {
    if (pairs[i][1] < pairs[i - 1][1]) {
      throw new Error(
        `${pairs[i][0]} ocorre antes de ${pairs[i - 1][0]} na linha do tempo; ajuste os horários ou a ordem dos estados.`
      )
    }
  }

  const intervals = ts.pauseIntervals || []
  for (const interval of intervals) {
    const s = timestampToMs(interval?.start as Timestamp | undefined)
    const e = timestampToMs(interval?.end as Timestamp | undefined)
    if (s != null && e != null && e < s) {
      throw new Error("Intervalo de pausa inválido: fim antes do início.")
    }
  }
}

/** Métricas derivadas (ms); `slaDeadlineMs` pode vir de `resolveOperationalSlaDeadlineMs`. */
export function computeOperationalMetrics(
  timestamps: ServiceTimestamps | undefined,
  nowMs: number,
  slaDeadlineMs: number | null
): OperationalMetricsMs {
  const accepted = timestampToMs(timestamps?.acceptedAt ?? undefined)
  const departure = timestampToMs(timestamps?.departureAt ?? undefined)
  const arrival = timestampToMs(timestamps?.arrivalAt ?? undefined)
  const execStart = timestampToMs(timestamps?.executionStartedAt ?? undefined)
  const finished = timestampToMs(timestamps?.finishedAt ?? undefined)

  let displacementMs: number | null = null
  if (departure != null && arrival != null) {
    displacementMs = Math.max(0, arrival - departure)
  }

  let pausedMs = 0
  const intervals = timestamps?.pauseIntervals || []
  for (const interval of intervals) {
    const s = timestampToMs(interval?.start ?? undefined)
    const e = timestampToMs(interval?.end ?? undefined)
    if (s != null) {
      pausedMs += Math.max(0, (e ?? nowMs) - s)
    }
  }

  let executionMs: number | null = null
  if (execStart != null) {
    const end = finished ?? nowMs
    executionMs = Math.max(0, end - execStart - pausedMs)
  }

  let totalSinceAcceptMs: number | null = null
  if (accepted != null) {
    const end = finished ?? nowMs
    totalSinceAcceptMs = Math.max(0, end - accepted)
  }

  let slaRemainingMs: number | null = null
  let delayMs: number | null = null
  if (slaDeadlineMs != null) {
    slaRemainingMs = slaDeadlineMs - nowMs
    if (slaRemainingMs < 0) {
      delayMs = -slaRemainingMs
      slaRemainingMs = 0
    }
  }

  return {
    displacementMs,
    executionMs,
    pausedMs: intervals.length ? pausedMs : null,
    totalSinceAcceptMs,
    slaRemainingMs,
    delayMs,
  }
}

export function previewOperationalMetrics(order: Record<string, unknown>, nowMs: number = Date.now()): OperationalMetricsMs {
  const ts = order.serviceTimestamps as ServiceTimestamps | undefined
  const deadline = resolveOperationalSlaDeadlineMs(order)
  return computeOperationalMetrics(ts, nowMs, deadline)
}

export function formatDurationMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—"
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h <= 0) return `${m} min`
  return `${h} h ${m} min`
}
