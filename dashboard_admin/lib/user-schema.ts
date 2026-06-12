import { toDateFromUnknown } from "@/lib/date-utils"

export type CanonicalUserRole =
  | "client"
  | "provider"
  | "admin"
  | "operator"
  | "manager"
  | "user"
  | "unknown"

type UnknownRecord = Record<string, unknown>

const ROLE_ALIASES: Record<CanonicalUserRole, string[]> = {
  client: ["client", "cliente", "customer"],
  provider: ["provider", "prestador", "professional", "tecnico", "tecnica", "worker"],
  admin: ["admin", "administrator", "administrador", "master", "superadmin"],
  operator: ["operator", "operador", "support", "atendente"],
  manager: ["manager", "gerente", "supervisor"],
  user: ["user", "usuario"],
  unknown: [],
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function getStringField(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

export function toTimestampLike(value: unknown, fallback: Date = new Date(0)) {
  const date = toDateFromUnknown(value, fallback)
  return {
    toDate: () => date,
  }
}

export function getCanonicalUserRole(user: UnknownRecord): CanonicalUserRole {
  const rawRole = getStringField(user, ["role", "userType", "tipo", "type"])
  const normalized = normalizeText(rawRole)

  for (const [canonical, aliases] of Object.entries(ROLE_ALIASES) as Array<[CanonicalUserRole, string[]]>) {
    if (aliases.includes(normalized)) {
      return canonical
    }
  }

  return normalized ? "user" : "unknown"
}

export function isClientUser(user: UnknownRecord): boolean {
  return getCanonicalUserRole(user) === "client"
}

export function isProviderUser(user: UnknownRecord): boolean {
  return getCanonicalUserRole(user) === "provider"
}

export function getUserDisplayName(user: UnknownRecord): string {
  return getStringField(user, ["fullName", "displayName", "name", "nome", "username"])
}

export function getUserEmail(user: UnknownRecord): string {
  return getStringField(user, ["email", "mail"])
}

export function getUserPhone(user: UnknownRecord): string {
  return getStringField(user, ["phone", "telefone", "phoneNumber", "celular"])
}

export function isUserActive(user: UnknownRecord): boolean {
  const explicitFlags = ["isActive", "active", "ativo"]

  for (const key of explicitFlags) {
    const value = user[key]
    if (typeof value === "boolean") {
      return value
    }
  }

  const blocked = user.blocked
  if (typeof blocked === "boolean") {
    return !blocked
  }

  const status = getStringField(user, ["status", "situacao", "state"])
  const normalizedStatus = normalizeText(status)
  if (!normalizedStatus) {
    return true
  }

  return normalizedStatus !== "blocked" && normalizedStatus !== "inactive" && normalizedStatus !== "inativo"
}

export function getUserCreatedAt(user: UnknownRecord) {
  return toTimestampLike(user.createdAt ?? user.created_at ?? user.dataCriacao ?? user.created)
}

export function getUserLastLoginAt(user: UnknownRecord) {
  const value = user.lastLoginAt ?? user.last_login_at ?? user.lastLogin ?? user.ultimoLogin ?? null
  return value ? toTimestampLike(value) : undefined
}
