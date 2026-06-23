"use client"

import { useEffect, useMemo, useState } from "react"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  UserCog,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Navigation,
  Clock,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"

// Painel de "raio-x" do pedido para a Gestão de Pedidos: responde de relance
// quem é o prestador, onde ele está (ao vivo), se o pedido foi pago e se travou.

interface Props {
  order: Record<string, unknown>
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function toMillis(value: unknown): number | null {
  if (!value) return null
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

function num(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  const s = String(v).trim()
  return s.length ? s : undefined
}

function fmtAgo(ms: number | null): string {
  if (ms == null) return "—"
  const diff = (Date.now() - ms) / 1000
  if (diff < 0) return "agora"
  if (diff < 60) return "há segundos"
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  return `há ${Math.floor(diff / 86400)} d`
}

/** Distância em km (haversine) entre dois pontos. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

interface ProviderLive {
  name?: string
  phone?: string
  email?: string
  rating?: number
  verificationStatus?: string
  lat?: number
  lng?: number
  accuracy?: number
  lastLocationUpdate?: number | null
  locationEnabled?: boolean
  balance?: number
}

const LOCATION_STALE_MS = 15 * 60 * 1000 // 15 min sem atualizar = "parado/desatualizado"

export function OrderInsightsPanel({ order }: Props) {
  const providerId = str(order.providerId) ?? str(order.assignedProvider)
  const providerNameFallback = str(order.providerName)
  const [live, setLive] = useState<ProviderLive | null>(null)
  const [loading, setLoading] = useState(false)

  const orderLat = num(order.latitude)
  const orderLng = num(order.longitude)
  const rawStatus = String(order.status ?? order.rawStatus ?? "").toLowerCase()
  const paymentStatus = String(order.paymentStatus ?? "").toLowerCase()
  const createdMs = toMillis(order.createdAt)

  // Busca perfil (providers) + assina localização ao vivo (users) do prestador.
  useEffect(() => {
    if (!providerId || !db) {
      setLive(null)
      return
    }
    setLoading(true)
    let cancelled = false

    getDoc(doc(db, "providers", providerId))
      .then((snap) => {
        if (cancelled || !snap.exists()) return
        const d = snap.data() as Record<string, unknown>
        setLive((prev) => ({
          ...prev,
          name: str(d.fullName) ?? str(d.name) ?? str(d.nome) ?? str(d.displayName) ?? prev?.name,
          phone: str(d.phone) ?? str(d.telefone) ?? str(d.phoneNumber) ?? prev?.phone,
          email: str(d.email) ?? prev?.email,
          rating: num(d.averageRating) ?? num(d.rating) ?? prev?.rating,
          verificationStatus: str(d.verificationStatus) ?? prev?.verificationStatus,
          balance: num(d.providerBalance) ?? prev?.balance,
        }))
      })
      .catch(() => null)

    // Localização ao vivo + telefone/nome de fallback ficam em users/{uid}.
    const unsub = onSnapshot(
      doc(db, "users", providerId),
      (snap) => {
        setLoading(false)
        if (cancelled || !snap.exists()) return
        const d = snap.data() as Record<string, unknown>
        const coord = d.coordinates as Record<string, unknown> | undefined
        const lat = num(d.latitude) ?? num(coord?._latitude) ?? num(coord?.latitude)
        const lng = num(d.longitude) ?? num(coord?._longitude) ?? num(coord?.longitude)
        setLive((prev) => ({
          ...prev,
          name: prev?.name ?? str(d.fullName) ?? str(d.name),
          phone: prev?.phone ?? str(d.phone) ?? str(d.telefone),
          email: prev?.email ?? str(d.email),
          lat,
          lng,
          accuracy: num(d.accuracy),
          lastLocationUpdate: toMillis(d.lastLocationUpdate),
          locationEnabled: d.locationEnabled === true,
        }))
      },
      () => setLoading(false)
    )

    return () => {
      cancelled = true
      unsub()
    }
  }, [providerId])

  const providerName = live?.name ?? providerNameFallback

  // ─── Diagnóstico (pago? prestador? travado?) ────────────────────────────────
  const diagnostics = useMemo(() => {
    const signals: { tone: "ok" | "warn" | "bad"; label: string }[] = []
    const isCancelled = rawStatus.includes("cancel")
    const isCompleted = rawStatus === "completed" || rawStatus === "finished"

    // Pagamento
    const paid =
      paymentStatus === "paid" ||
      paymentStatus === "captured" ||
      paymentStatus === "approved" ||
      ["paid", "completed", "assigned", "in_progress", "started", "on_the_way", "distributing"].includes(rawStatus)
    if (rawStatus === "awaiting_payment" || paymentStatus === "pending" || (!paid && !isCancelled)) {
      signals.push({ tone: "warn", label: "Pagamento pendente" })
    } else if (paid) {
      signals.push({ tone: "ok", label: "Pedido pago" })
    }

    // Prestador
    if (!providerId && !isCancelled && !isCompleted) {
      signals.push({ tone: "warn", label: "Sem prestador atribuído" })
    } else if (providerId) {
      signals.push({ tone: "ok", label: "Prestador atribuído" })
    }

    // Travamentos por tempo
    const ageMin = createdMs ? (Date.now() - createdMs) / 60000 : 0
    if (rawStatus === "awaiting_payment" && ageMin > 30) {
      signals.push({ tone: "bad", label: `Aguardando pagamento há ${Math.floor(ageMin)} min` })
    }
    const searching = ["pending", "paid", "searching_provider", "distributing"].includes(rawStatus)
    if (searching && !providerId && ageMin > 20) {
      signals.push({ tone: "bad", label: `Sem prestador há ${Math.floor(ageMin)} min — distribuição pode ter travado` })
    }
    // Prestador parado: localização desatualizada durante atendimento ativo
    const active = ["assigned", "accepted", "on_the_way", "in_progress", "started"].includes(rawStatus)
    if (active && providerId && live) {
      if (live.lastLocationUpdate == null && !live.locationEnabled) {
        signals.push({ tone: "warn", label: "Prestador sem enviar localização (rastreamento off)" })
      } else if (live.lastLocationUpdate != null && Date.now() - live.lastLocationUpdate > LOCATION_STALE_MS) {
        signals.push({ tone: "bad", label: `Localização do prestador parada (${fmtAgo(live.lastLocationUpdate)})` })
      }
    }
    if (rawStatus === "in_progress" && createdMs && Date.now() - createdMs > 6 * 3600 * 1000) {
      signals.push({ tone: "warn", label: "Atendimento aberto há mais de 6 h" })
    }

    const worst = signals.some((s) => s.tone === "bad")
      ? "bad"
      : signals.some((s) => s.tone === "warn")
        ? "warn"
        : "ok"
    return { signals, worst }
  }, [rawStatus, paymentStatus, providerId, createdMs, live])

  const distanceKm =
    orderLat != null && orderLng != null && live?.lat != null && live?.lng != null
      ? haversineKm(orderLat, orderLng, live.lat, live.lng)
      : null

  const locationStale =
    live?.lastLocationUpdate != null && Date.now() - live.lastLocationUpdate > LOCATION_STALE_MS

  const bannerTone =
    diagnostics.worst === "bad"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      : diagnostics.worst === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"

  const BannerIcon =
    diagnostics.worst === "bad" ? XCircle : diagnostics.worst === "warn" ? AlertTriangle : CheckCircle2

  return (
    <div className="space-y-4">
      {/* Diagnóstico */}
      <div className={`flex items-start gap-3 rounded-lg border p-3 ${bannerTone}`}>
        <BannerIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {diagnostics.worst === "bad"
              ? "Atenção: este pedido pode estar travado"
              : diagnostics.worst === "warn"
                ? "Pedido em andamento — pontos a observar"
                : "Pedido saudável"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {diagnostics.signals.map((s, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.tone === "bad"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                    : s.tone === "warn"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                }`}
              >
                {s.tone === "ok" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : s.tone === "warn" ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Prestador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Prestador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!providerId ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Nenhum prestador atribuído a este pedido ainda.
            </div>
          ) : (
            <>
              {/* Identidade */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{providerName || "Prestador"}</p>
                  <p className="break-all text-xs text-muted-foreground">ID: {providerId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {live?.rating != null && (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {live.rating.toFixed(1)}
                    </span>
                  )}
                  {live?.verificationStatus &&
                    (live.verificationStatus === "approved" ? (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="h-3 w-3" /> Verificado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <ShieldAlert className="h-3 w-3" /> {live.verificationStatus}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {live?.phone ? (
                    <a href={`tel:${live.phone}`} className="text-primary hover:underline">
                      {live.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{loading ? "carregando…" : "sem telefone"}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{live?.email || "—"}</span>
                </div>
              </div>

              {/* Onde o prestador está (ao vivo) */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Navigation className="h-4 w-4" /> Localização do prestador
                  </span>
                  {live?.lastLocationUpdate != null && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        locationStale ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      <Clock className="h-3 w-3" /> {fmtAgo(live.lastLocationUpdate)}
                    </span>
                  )}
                </div>

                {live?.lat != null && live?.lng != null ? (
                  <>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {live.lat.toFixed(5)}, {live.lng.toFixed(5)}
                      </span>
                      {distanceKm != null && (
                        <span>
                          ≈ <strong className="text-foreground">{distanceKm.toFixed(1)} km</strong> do local do pedido
                        </span>
                      )}
                      {live.accuracy != null && <span>precisão ~{Math.round(live.accuracy)} m</span>}
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${live.lat},${live.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" /> Abrir no Google Maps
                    </a>
                    {locationStale && (
                      <p className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" /> Localização desatualizada — o prestador pode estar
                        parado ou com o rastreamento off.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {loading ? "carregando localização…" : "Sem localização — rastreamento desligado ou nunca enviada."}
                  </p>
                )}
              </div>

              {live?.balance != null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" /> Saldo do prestador: R$ {live.balance.toFixed(2).replace(".", ",")}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
