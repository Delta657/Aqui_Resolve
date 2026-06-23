// Lógica pura (sem React/Firebase) do Monitoramento de Pedidos em Andamento.
// Mantida isolada para ser testável via `npm run test:monitoring`.
//
// Responde, para cada pedido ativo: em que fase ele está, se o prestador está
// se deslocando, e se há um problema que exige a atenção do admin (alerta).

// ─── Janelas de tempo / limiares (em ms / km, ajustáveis) ───────────────────────
export const LOCATION_STALE_MS = 15 * 60 * 1000 // localização sem atualizar = "parada"
export const IDLE_AFTER_ACCEPT_MS = 10 * 60 * 1000 // aceitou e não se mexeu em 10 min
export const NO_PROVIDER_STUCK_MS = 20 * 60 * 1000 // sem prestador há 20 min na distribuição
export const AWAITING_PAYMENT_STUCK_MS = 30 * 60 * 1000 // aguardando pagamento há 30 min
export const LONG_SERVICE_MS = 6 * 60 * 60 * 1000 // atendimento aberto há mais de 6 h
export const MOVED_THRESHOLD_KM = 0.15 // deslocamento mínimo p/ considerar "andou" (150 m)

export type Tone = "ok" | "warn" | "bad"
export type MonitorPhase = "awaiting" | "assigned" | "active" | "other"

export interface MonitorSignal {
  tone: Tone
  label: string
}

export interface ProviderLive {
  lat?: number
  lng?: number
  accuracy?: number
  lastLocationUpdate?: number | null
  locationEnabled?: boolean
}

/** Base de comparação capturada no cliente: 1ª localização vista para o pedido. */
export interface MovementBaseline {
  ms: number
  lat: number
  lng: number
}

export interface MonitorInput {
  status: string
  paymentStatus?: string
  providerId?: string | null
  createdMs?: number | null
  /** quando o prestador aceitou/foi atribuído */
  acceptedMs?: number | null
  orderLat?: number | null
  orderLng?: number | null
  live?: ProviderLive | null
  baseline?: MovementBaseline | null
  now?: number
}

export interface MonitorResult {
  signals: MonitorSignal[]
  worst: Tone
  /** true quando há um sinal "bad" que o admin precisa tratar (dispara som/destaque). */
  alert: boolean
  phase: MonitorPhase
  /** distância do prestador até o local do pedido, em km (quando há coordenadas). */
  distanceKm: number | null
  /** quanto o prestador andou desde a 1ª leitura (km), quando há baseline. */
  movedKm: number | null
  locationStale: boolean
}

// Conjuntos de status (normalizados em minúsculas).
const AWAITING_STATUSES = ["pending", "paid", "searching_provider", "distributing"]
const ACTIVE_STATUSES = ["assigned", "accepted", "on_the_way", "in_progress", "started"]

export function toMillis(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return value
  if (value instanceof Date) return value.getTime()
  const v = value as { toDate?: () => Date; toMillis?: () => number; _seconds?: number; seconds?: number }
  if (typeof v.toMillis === "function") return v.toMillis()
  if (typeof v.toDate === "function") return v.toDate().getTime()
  if (typeof v._seconds === "number") return v._seconds * 1000
  if (typeof v.seconds === "number") return v.seconds * 1000
  const t = Date.parse(String(value))
  return Number.isNaN(t) ? null : t
}

/** Distância em km (haversine) entre dois pontos geográficos. */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function fmtAgo(ms: number | null, now: number = Date.now()): string {
  if (ms == null) return "—"
  const diff = (now - ms) / 1000
  if (diff < 0) return "agora"
  if (diff < 60) return "há segundos"
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  return `há ${Math.floor(diff / 86400)} d`
}

function minutes(ms: number): number {
  return Math.floor(ms / 60000)
}

/** Em que fase de monitoramento o pedido está. */
export function monitorPhase(status: string, providerId?: string | null): MonitorPhase {
  const s = status.toLowerCase()
  if (ACTIVE_STATUSES.includes(s) || (s === "assigned" && providerId)) {
    return s === "assigned" || s === "accepted" ? "assigned" : "active"
  }
  if (AWAITING_STATUSES.includes(s) || s === "awaiting_payment") return "awaiting"
  return "other"
}

/** Um pedido é "monitorável" (em andamento) se não está concluído/cancelado. */
export function isMonitorableStatus(status: string): boolean {
  const s = status.toLowerCase()
  if (s.includes("cancel")) return false
  if (s === "completed" || s === "finished") return false
  return (
    AWAITING_STATUSES.includes(s) ||
    ACTIVE_STATUSES.includes(s) ||
    s === "awaiting_payment"
  )
}

/**
 * Calcula sinais/diagnóstico de um pedido em andamento, incluindo a detecção de
 * ociosidade do prestador (aceitou mas não se deslocou) — regra central do plano.
 */
export function computeMonitorSignals(input: MonitorInput): MonitorResult {
  const now = input.now ?? Date.now()
  const status = (input.status ?? "").toLowerCase()
  const paymentStatus = (input.paymentStatus ?? "").toLowerCase()
  const providerId = input.providerId || null
  const live = input.live || null
  const signals: MonitorSignal[] = []

  const phase = monitorPhase(status, providerId)
  const isActive = ACTIVE_STATUSES.includes(status)
  const isAwaiting = AWAITING_STATUSES.includes(status)

  // ── Pagamento ──
  const paid =
    paymentStatus === "paid" ||
    paymentStatus === "captured" ||
    paymentStatus === "approved" ||
    ["paid", "completed", "assigned", "in_progress", "started", "on_the_way", "distributing"].includes(status)
  if (status === "awaiting_payment" || paymentStatus === "pending") {
    signals.push({ tone: "warn", label: "Pagamento pendente" })
  } else if (paid) {
    signals.push({ tone: "ok", label: "Pago" })
  }

  // ── Prestador atribuído? ──
  if (providerId) {
    signals.push({ tone: "ok", label: "Prestador atribuído" })
  } else if (isAwaiting || status === "distributing") {
    signals.push({ tone: "warn", label: "Sem prestador" })
  }

  // ── Travamentos por tempo ──
  if (status === "awaiting_payment" && input.createdMs && now - input.createdMs > AWAITING_PAYMENT_STUCK_MS) {
    signals.push({ tone: "bad", label: `Aguardando pagamento ${fmtAgo(input.createdMs, now)}` })
  }
  if ((isAwaiting || status === "distributing") && !providerId && input.createdMs && now - input.createdMs > NO_PROVIDER_STUCK_MS) {
    signals.push({ tone: "bad", label: `Sem prestador ${fmtAgo(input.createdMs, now)} — distribuição pode ter travado` })
  }
  if (status === "in_progress" && input.createdMs && now - input.createdMs > LONG_SERVICE_MS) {
    signals.push({ tone: "warn", label: "Atendimento aberto há mais de 6 h" })
  }

  // ── Localização / deslocamento do prestador ──
  const orderLat = input.orderLat ?? null
  const orderLng = input.orderLng ?? null
  const distanceKm =
    orderLat != null && orderLng != null && live?.lat != null && live?.lng != null
      ? haversineKm(orderLat, orderLng, live.lat, live.lng)
      : null

  const movedKm =
    input.baseline && live?.lat != null && live?.lng != null
      ? haversineKm(input.baseline.lat, input.baseline.lng, live.lat, live.lng)
      : null

  const locationStale =
    live?.lastLocationUpdate != null && now - live.lastLocationUpdate > LOCATION_STALE_MS

  // Detecção de ociosidade: só quando há prestador num pedido ativo.
  const acceptedMs = input.acceptedMs ?? null
  const acceptedAgeMs = acceptedMs != null ? now - acceptedMs : null
  const aliveLongEnough = acceptedAgeMs != null && acceptedAgeMs > IDLE_AFTER_ACCEPT_MS

  if ((isActive || phase === "assigned") && providerId) {
    if (live && live.lat == null && live.locationEnabled === false) {
      signals.push({ tone: "warn", label: "Prestador sem enviar localização (rastreamento off)" })
    }
    if (locationStale) {
      signals.push({
        tone: "bad",
        label: `Localização parada (${fmtAgo(live!.lastLocationUpdate ?? null, now)})${
          aliveLongEnough ? ` — aceitou ${fmtAgo(acceptedMs, now)}` : ""
        }`,
      })
    } else if (aliveLongEnough && movedKm != null && movedKm < MOVED_THRESHOLD_KM) {
      // Aceitou há mais de N min e praticamente não saiu do lugar.
      signals.push({
        tone: "bad",
        label: `Prestador não se deslocou desde que aceitou (${fmtAgo(acceptedMs, now)}, ${Math.round(
          movedKm * 1000
        )} m)`,
      })
    }
  }

  const worst: Tone = signals.some((s) => s.tone === "bad")
    ? "bad"
    : signals.some((s) => s.tone === "warn")
      ? "warn"
      : "ok"

  return {
    signals,
    worst,
    alert: worst === "bad",
    phase,
    distanceKm,
    movedKm,
    locationStale,
  }
}
