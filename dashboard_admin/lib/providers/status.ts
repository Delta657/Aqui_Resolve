export type ProviderRealtimeStatus = "disponivel" | "ocupado" | "online" | "offline"
export type LegacyProviderStatus = "active" | "inactive" | "pending" | "blocked"

export const ACTIVE_PROVIDER_STATUSES: readonly ProviderRealtimeStatus[] = [
  "disponivel",
  "ocupado",
  "online",
]

export function isProviderRealtimeStatus(status: string): status is ProviderRealtimeStatus {
  return status === "disponivel" || status === "ocupado" || status === "online" || status === "offline"
}

export function isProviderActiveStatus(status: string): boolean {
  return ACTIVE_PROVIDER_STATUSES.includes(status as ProviderRealtimeStatus)
}

export function isProviderAssignableStatus(status: string): boolean {
  return status === "disponivel"
}

export function mapProviderStatusToLegacy(status: ProviderRealtimeStatus): LegacyProviderStatus {
  switch (status) {
    case "disponivel":
    case "ocupado":
    case "online":
      return "active"
    case "offline":
      return "inactive"
    default:
      return "inactive"
  }
}

export function getProviderStatusLabel(status: ProviderRealtimeStatus): string {
  switch (status) {
    case "disponivel":
      return "Disponivel"
    case "ocupado":
      return "Ocupado"
    case "online":
      return "Online"
    case "offline":
      return "Offline"
    default:
      return "Desconhecido"
  }
}
