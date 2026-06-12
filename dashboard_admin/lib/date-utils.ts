type TimestampLike = {
  toDate: () => Date
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function"
}

export function toDateFromUnknown(value: unknown, fallback: Date = new Date(0)): Date {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value
  }

  if (isTimestampLike(value)) {
    const converted = value.toDate()
    return Number.isNaN(converted.getTime()) ? fallback : converted
  }

  if (typeof value === "string" || typeof value === "number") {
    const converted = new Date(value)
    return Number.isNaN(converted.getTime()) ? fallback : converted
  }

  return fallback
}

export function toIsoStringFromUnknown(value: unknown, fallback: string = new Date().toISOString()): string {
  const converted = toDateFromUnknown(value, new Date(fallback))
  if (Number.isNaN(converted.getTime())) {
    return fallback
  }
  return converted.toISOString()
}
