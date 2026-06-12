/** Canal lógico dentro de `orders/{orderId}/messages` (campos opcionais; legado = client_provider). */
export const ORDER_CHAT_THREAD_TYPES = ["client_provider", "client_base", "provider_base", "admin_internal"] as const
export type OrderChatThreadType = (typeof ORDER_CHAT_THREAD_TYPES)[number]

export const ORDER_CHAT_THREAD_LABELS: Record<OrderChatThreadType, string> = {
  client_provider: "Cliente ↔ Prestador",
  client_base: "Cliente ↔ Base",
  provider_base: "Prestador ↔ Base",
  admin_internal: "Notas internas (só admin)",
}

/** Quem pode ler no app cliente/prestador; admin vê tudo no painel. */
export const ORDER_MESSAGE_VISIBILITIES = ["public", "admin_client", "admin_provider", "admin_only"] as const
export type OrderMessageVisibility = (typeof ORDER_MESSAGE_VISIBILITIES)[number]

export function defaultVisibilityForThread(thread: OrderChatThreadType): OrderMessageVisibility {
  switch (thread) {
    case "client_base":
      return "admin_client"
    case "provider_base":
      return "admin_provider"
    case "admin_internal":
      return "admin_only"
    default:
      return "public"
  }
}

export function normalizeThreadType(raw: unknown): OrderChatThreadType {
  const value = String(raw || "").toLowerCase()
  if ((ORDER_CHAT_THREAD_TYPES as readonly string[]).includes(value)) {
    return value as OrderChatThreadType
  }
  return "client_provider"
}

export function normalizeMessageVisibility(raw: unknown, thread: OrderChatThreadType): OrderMessageVisibility {
  const value = String(raw || "").toLowerCase()
  if ((ORDER_MESSAGE_VISIBILITIES as readonly string[]).includes(value)) {
    return value as OrderMessageVisibility
  }
  return defaultVisibilityForThread(thread)
}

export function messageMatchesThreadScope(
  message: { threadType?: OrderChatThreadType; visibility?: OrderMessageVisibility },
  scope: OrderChatThreadType | "all"
): boolean {
  if (scope === "all") {
    return true
  }
  const threadType = message.threadType ?? "client_provider"
  return threadType === scope
}

export interface OperationalKeywordPattern {
  id: string
  label: string
  example: string
  pattern: RegExp
}

/** Padrões para destaque e criação rápida de cartões operacionais (exemplos para cópia na UI). */
export const OPERATIONAL_KEYWORD_PATTERNS: OperationalKeywordPattern[] = [
  {
    id: "call_base",
    label: "Chamar base",
    example: "Preciso chamar a base urgente",
    pattern: /(cham(ar|e)\s+a\s*base|lig(ar|ue)\s+(pra|para)\s*a\s*base|call\s*base|falar\s+com\s+a\s*oper(a|ã)o)/i,
  },
  {
    id: "help",
    label: "Pedido de ajuda",
    example: "Preciso de ajuda no endereço",
    pattern: /(preciso\s+de\s+ajuda|help\s*request|socorro|n[aã]o\s+consigo)/i,
  },
  {
    id: "urgent",
    label: "Urgência",
    example: "Situação urgente no protocolo",
    pattern: /(\burgente\b|urgência|emerg[eê]ncia|imediato)/i,
  },
  {
    id: "operational_issue",
    label: "Incidente operacional",
    example: "Problema operacional com o serviço",
    pattern: /(problema\s+operacional|falha\s+no\s+atendimento|incidente)/i,
  },
]

export function detectOperationalSignalIds(text: string): string[] {
  if (!text?.trim()) {
    return []
  }
  const hits: string[] = []
  for (const row of OPERATIONAL_KEYWORD_PATTERNS) {
    if (row.pattern.test(text)) {
      hits.push(row.id)
    }
  }
  return hits
}
