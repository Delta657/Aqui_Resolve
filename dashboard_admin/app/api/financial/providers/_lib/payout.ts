type UnknownRecord = Record<string, unknown>

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    let normalized = value.trim()
    if (!normalized) {
      return null
    }

    // Handles strings like "R$ 1.234,56", "1,23", "1.23".
    normalized = normalized.replace(/\s+/g, "").replace(/r\$/gi, "")
    normalized = normalized.replace(/[^\d,.-]/g, "")
    if (!normalized) {
      return null
    }

    if (normalized.includes(",") && normalized.includes(".")) {
      const lastComma = normalized.lastIndexOf(",")
      const lastDot = normalized.lastIndexOf(".")
      normalized =
        lastComma > lastDot
          ? normalized.replace(/\./g, "").replace(",", ".")
          : normalized.replace(/,/g, "")
    } else if (normalized.includes(",")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".")
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const readString = (value: unknown): string => {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim()
}

const getNestedRecord = (value: unknown): UnknownRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }
  return value as UnknownRecord
}

export const amountToCents = (amount: number): number => {
  if (!Number.isFinite(amount)) {
    return 0
  }
  return Math.round((amount + Number.EPSILON) * 100)
}

export const centsToAmount = (cents: number): number => {
  if (!Number.isFinite(cents)) {
    return 0
  }
  return Number((cents / 100).toFixed(2))
}

const toTimestampMillis = (value: unknown): number => {
  if (!value) {
    return 0
  }

  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as {
      toMillis?: () => number
      toDate?: () => Date
      seconds?: number
      _seconds?: number
    }

    if (typeof maybeTimestamp.toMillis === "function") {
      const ms = maybeTimestamp.toMillis()
      if (Number.isFinite(ms)) {
        return ms
      }
    }

    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate()
      if (date instanceof Date) {
        return date.getTime()
      }
    }

    if (typeof maybeTimestamp.seconds === "number" && Number.isFinite(maybeTimestamp.seconds)) {
      return maybeTimestamp.seconds * 1000
    }

    if (typeof maybeTimestamp._seconds === "number" && Number.isFinite(maybeTimestamp._seconds)) {
      return maybeTimestamp._seconds * 1000
    }
  }

  return 0
}

export const toIsoDate = (value: unknown, fallback = new Date().toISOString()): string => {
  const ms = toTimestampMillis(value)
  if (ms <= 0) {
    return fallback
  }
  return new Date(ms).toISOString()
}

const getOrderSortTimestamp = (order: UnknownRecord): number => {
  const candidates = [
    toTimestampMillis(order.completedAt),
    toTimestampMillis(order.reviewedAt),
    toTimestampMillis(order.updatedAt),
    toTimestampMillis(order.createdAt),
  ]

  for (const candidate of candidates) {
    if (candidate > 0) {
      return candidate
    }
  }

  return 0
}

const getOrderCommissionCents = (order: UnknownRecord): number => {
  const providerCommissionCents =
    toNumberOrNull(order.providerCommissionCents) ??
    toNumberOrNull(order.providercommissioncents) ??
    toNumberOrNull(order.provider_commission_cents)

  if (providerCommissionCents !== null && providerCommissionCents > 0) {
    return Math.round(providerCommissionCents)
  }

  const providerCommission =
    toNumberOrNull(order.providerCommission) ??
    toNumberOrNull(order.providercommission) ??
    toNumberOrNull(order.provider_commission) ??
    0

  if (providerCommission <= 0) {
    return 0
  }

  // The app writes providerCommission as the payout amount to provider.
  return amountToCents(providerCommission)
}

const getOrderPaidCents = (order: UnknownRecord, totalCommissionCents: number): number => {
  const rawPaidCents =
    toNumberOrNull(order.providerPayoutPaidCents) ??
    toNumberOrNull(order.providerpayoutpaidcents) ??
    toNumberOrNull(order.provider_payout_paid_cents)
  const rawPaidAmount =
    toNumberOrNull(order.providerPayoutPaidAmount) ??
    toNumberOrNull(order.providerpayoutpaidamount) ??
    toNumberOrNull(order.provider_payout_paid_amount)

  const paidCents =
    rawPaidCents !== null
      ? Math.round(rawPaidCents)
      : amountToCents(rawPaidAmount ?? 0)

  if (paidCents <= 0) {
    return 0
  }

  return Math.min(paidCents, totalCommissionCents)
}

export const resolveOrderProviderId = (orderData: UnknownRecord): string => {
  const prestador = getNestedRecord(orderData.prestador)
  const provider = getNestedRecord(orderData.provider)
  const providerVerification = getNestedRecord(orderData.providerVerification)

  return (
    readString(orderData.provider) ||
    readString(orderData.prestador) ||
    readString(orderData.providerId) ||
    readString(orderData.providerUid) ||
    readString(orderData.provider_id) ||
    readString(orderData.provider_uid) ||
    readString(orderData.prestadorId) ||
    readString(orderData.prestadorUid) ||
    readString(orderData.prestador_id) ||
    readString(orderData.prestador_uid) ||
    readString(orderData.assignedProvider) ||
    readString(orderData.assigned_provider) ||
    readString(orderData.assignedProviderId) ||
    readString(orderData.assignedProviderUid) ||
    readString(orderData.assigned_provider_id) ||
    readString(orderData.assigned_provider_uid) ||
    readString(orderData.providerVerificationCode) ||
    readString(orderData.provider_verification_code) ||
    readString(orderData.verificationCode) ||
    readString(orderData.verification_code) ||
    readString(providerVerification.code) ||
    readString(providerVerification.verificationCode) ||
    readString(prestador.id) ||
    readString(prestador.uid) ||
    readString(prestador.userId) ||
    readString(prestador.user_id) ||
    readString(prestador.providerId) ||
    readString(prestador.providerUid) ||
    readString(prestador.provider_id) ||
    readString(prestador.provider_uid) ||
    readString(prestador.verificationCode) ||
    readString(prestador.verification_code) ||
    readString(prestador.providerVerificationCode) ||
    readString(prestador.provider_verification_code) ||
    readString(provider.id) ||
    readString(provider.uid) ||
    readString(provider.userId) ||
    readString(provider.user_id) ||
    readString(provider.providerId) ||
    readString(provider.providerUid) ||
    readString(provider.provider_id) ||
    readString(provider.provider_uid) ||
    readString(provider.verificationCode) ||
    readString(provider.verification_code) ||
    readString(provider.providerVerificationCode) ||
    readString(provider.provider_verification_code)
  )
}

export interface OrderPayoutSnapshot {
  orderId: string
  providerId: string
  totalCommissionCents: number
  alreadyPaidCents: number
  remainingCents: number
  eligible: boolean
  sortTimestampMs: number
}

export const buildOrderPayoutSnapshot = (
  orderId: string,
  orderData: UnknownRecord
): OrderPayoutSnapshot => {
  const providerId = resolveOrderProviderId(orderData)

  const totalCommissionCents = getOrderCommissionCents(orderData)
  const alreadyPaidCents = getOrderPaidCents(orderData, totalCommissionCents)
  const remainingCents = Math.max(totalCommissionCents - alreadyPaidCents, 0)

  const eligible = providerId.length > 0 && totalCommissionCents > 0

  return {
    orderId,
    providerId,
    totalCommissionCents,
    alreadyPaidCents,
    remainingCents,
    eligible,
    sortTimestampMs: getOrderSortTimestamp(orderData),
  }
}
