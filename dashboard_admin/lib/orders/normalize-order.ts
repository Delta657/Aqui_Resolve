import {
  resolveOperationalStatus,
  type ServiceOperationalStatus,
} from "@/lib/orders/operational"

/**
 * Adapter de pedidos — traduz o schema REAL gravado pelo app mobile/cliente
 * (status em inglês, `assignedProvider`, `estimatedPrice`, `coordinates` GeoPoint,
 * `*VerificationCode`, etc.) para uma forma única consumida pelo painel admin.
 *
 * Lê os campos reais primeiro e cai para os campos do modelo "ideal"
 * (`serviceOperationalStatus`, `assignedTechnician`, `budget`...) como fallback,
 * para funcionar tanto com os dados de produção quanto com o contrato futuro.
 */

type Raw = Record<string, unknown>

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  const s = String(v).trim()
  return s.length ? s : undefined
}

function num(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** Extrai lat/lng de `coordinates` (GeoPoint _latitude/_longitude ou {latitude,longitude}) ou de campos soltos. */
function readCoords(raw: Raw): { lat?: number; lng?: number } {
  const c = raw.coordinates as Raw | undefined
  if (c && typeof c === "object") {
    const lat = num((c as Raw)._latitude) ?? num((c as Raw).latitude) ?? num((c as Raw).lat)
    const lng = num((c as Raw)._longitude) ?? num((c as Raw).longitude) ?? num((c as Raw).lng)
    if (lat != null && lng != null) return { lat, lng }
  }
  const lat =
    num(raw.latitude) ?? num(raw.locationLat) ?? num((raw.location as Raw)?.lat)
  const lng =
    num(raw.longitude) ?? num(raw.locationLng) ?? num((raw.location as Raw)?.lng)
  return { lat, lng }
}

/** Mapeia o `status` real (inglês) → rótulo PT-BR amigável. */
const STATUS_PT: Record<string, string> = {
  pending: "Pendente",
  awaiting_payment: "Aguardando pagamento",
  paid: "Pago",
  scheduled: "Agendado",
  searching_provider: "Buscando prestador",
  assigned: "Atribuído",
  accepted: "Aceito",
  on_the_way: "A caminho",
  in_progress: "Em andamento",
  started: "Em andamento",
  awaiting_confirmation: "Aguardando confirmação",
  completed: "Concluído",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  refunded: "Reembolsado",
}

export function statusLabelPt(rawStatus: string | undefined): string {
  if (!rawStatus) return "—"
  return STATUS_PT[rawStatus.toLowerCase()] ?? rawStatus
}

export interface NormalizedOrder {
  id: string
  // Cliente
  clientId?: string
  clientName: string
  clientEmail?: string
  clientPhone?: string // preenchido via join na coleção `users` (não existe no pedido)
  // Serviço
  serviceName: string
  serviceType?: string
  description?: string
  protocol?: string
  images: string[]
  // Valor
  estimatedPrice?: number
  providerCommission?: number
  paymentStatus?: string
  // Localização
  address?: string
  city?: string
  state?: string
  zipCode?: string
  complement?: string
  lat?: number
  lng?: number
  // Prestador
  providerId?: string
  providerName?: string
  // Estado
  rawStatus?: string
  statusLabel: string
  operationalStatus: ServiceOperationalStatus
  // Validação (códigos reais)
  providerVerificationCode?: string
  clientVerificationCode?: string
  verificationCodesGeneratedAt?: unknown
  // Confirmações de conclusão
  clientCompletionConfirmed?: boolean
  providerCompletionConfirmed?: boolean
  // Avaliação
  rating?: number
  review?: string
  // Tempos
  createdAt?: unknown
  assignedAt?: unknown
  startedAt?: unknown
  completedAt?: unknown
  confirmedAt?: unknown
  scheduledDate?: unknown
  preferredTimeSlot?: string
  // Repasse ao prestador
  providerPayoutStatus?: string
  // Documento bruto para acesso a qualquer campo não mapeado
  _raw: Raw
}

/**
 * Enriquece o pedido REAL com os "apelidos" de campo que os componentes legados
 * do painel esperam (budget, location, serviceCategory, assignedTechnician,
 * serviceOperationalStatus, serviceTimestamps...). Mantém o documento original
 * intacto e só ADICIONA as chaves derivadas, para o modal/tabela/PDF/painel
 * operacional passarem a exibir dados reais sem reescrever cada um.
 */
export function enrichOrderForAdmin(
  raw: Raw,
  extra?: { clientPhone?: string }
): Record<string, unknown> {
  const n = normalizeOrder(raw)
  return {
    ...raw,
    id: n.id,
    // Apelidos lidos pelos componentes legados:
    serviceCategory: n.serviceName,
    budget: n.estimatedPrice,
    location: n.address,
    clientPhone: extra?.clientPhone ?? n.clientPhone ?? "",
    providerId: n.providerId,
    providerName: n.providerName,
    latitude: n.lat,
    longitude: n.lng,
    serviceOperationalStatus: n.operationalStatus,
    assignedTechnician: n.providerId
      ? { id: n.providerId, name: n.providerName ?? n.providerId, acceptedAt: raw.assignedAt ?? null }
      : (raw.assignedTechnician as unknown),
    serviceTimestamps:
      (raw.serviceTimestamps as unknown) ?? {
        acceptedAt: raw.assignedAt ?? null,
        executionStartedAt: raw.startedAt ?? null,
        finishedAt: raw.completedAt ?? null,
      },
    _normalized: n,
  }
}

export function normalizeOrder(raw: Raw, id?: string): NormalizedOrder {
  const coords = readCoords(raw)
  const rawStatus = str(raw.status) ?? str(raw.serviceOperationalStatus)

  return {
    id: id ?? str(raw.id) ?? "",
    clientId: str(raw.clientId) ?? str(raw.clientUid) ?? str(raw.userId),
    clientName: str(raw.clientName) ?? str(raw.clienteNome) ?? "Cliente",
    clientEmail: str(raw.clientEmail) ?? str(raw.clienteEmail),
    clientPhone: str(raw.clientPhone) ?? str(raw.clienteTelefone),
    serviceName: str(raw.serviceName) ?? str(raw.serviceType) ?? str(raw.serviceCategory) ?? "Serviço",
    serviceType: str(raw.serviceType) ?? str(raw.serviceCategory),
    description: str(raw.description) ?? str(raw.descricao),
    protocol: str(raw.protocol) ?? str(raw.protocolo),
    images: Array.isArray(raw.images) ? (raw.images as string[]).filter(Boolean) : [],
    estimatedPrice: num(raw.estimatedPrice) ?? num(raw.budget) ?? num(raw.price) ?? num(raw.valor),
    providerCommission: num(raw.providerCommission),
    paymentStatus: str(raw.paymentStatus),
    address: str(raw.address) ?? str(raw.endereco) ?? str(raw.location),
    city: str(raw.city) ?? str(raw.cidade),
    state: str(raw.state) ?? str(raw.estado) ?? str(raw.uf),
    zipCode: str(raw.zipCode) ?? str(raw.cep),
    complement: str(raw.complement) ?? str(raw.complemento),
    lat: coords.lat,
    lng: coords.lng,
    providerId:
      str(raw.assignedProvider) ??
      str(raw.providerId) ??
      str((raw.assignedTechnician as Raw)?.id),
    providerName:
      str(raw.assignedProviderName) ??
      str(raw.providerName) ??
      str((raw.assignedTechnician as Raw)?.name),
    rawStatus,
    statusLabel: statusLabelPt(rawStatus),
    operationalStatus: resolveOperationalStatus(raw),
    providerVerificationCode: str(raw.providerVerificationCode),
    clientVerificationCode: str(raw.clientVerificationCode),
    verificationCodesGeneratedAt: raw.verificationCodesGeneratedAt,
    clientCompletionConfirmed: Boolean(raw.clientCompletionConfirmed),
    providerCompletionConfirmed: Boolean(raw.providerCompletionConfirmed),
    rating: num(raw.rating),
    review: str(raw.review),
    createdAt: raw.createdAt,
    assignedAt: raw.assignedAt,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    confirmedAt: raw.confirmedAt,
    scheduledDate: raw.scheduledDate,
    preferredTimeSlot: str(raw.preferredTimeSlot),
    providerPayoutStatus: str(raw.providerPayoutStatus),
    _raw: raw,
  }
}
