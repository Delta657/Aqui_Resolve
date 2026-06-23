"use client"

// Monitoramento de Pedidos em Andamento (admin)
// ─────────────────────────────────────────────────────────────────────────────
// Acompanha em TEMPO REAL os pedidos ativos: onde o prestador está, se ele se
// deslocou após aceitar e se algum pedido travou. Dispara alerta visual + sonoro
// quando um prestador fica ocioso ou a distribuição emperra. Ações rápidas:
// ligar, abrir chat, reatribuir e cancelar.
//
// Dados em tempo real via client SDK (regras: orders/users/providers = read
// isSignedIn). As escritas (reatribuir/cancelar) passam pelas rotas Admin SDK
// já existentes (/api/orders/[id]/redirect e PATCH /api/orders/[id]).

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { adminFetch } from "@/lib/admin-api"
import { usePermissions } from "@/hooks/use-permissions"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  RefreshCw,
  Star,
  User,
  UserCog,
  XCircle,
} from "lucide-react"
import {
  computeMonitorSignals,
  fmtAgo,
  isMonitorableStatus,
  toMillis,
  type MonitorResult,
  type MovementBaseline,
} from "@/lib/order-monitoring"

// ─── tipos locais ───────────────────────────────────────────────────────────
interface OrderDoc {
  id: string
  protocol?: string
  status?: string
  paymentStatus?: string
  clientName?: string
  customerName?: string
  clientPhone?: string
  customerPhone?: string
  clientId?: string
  serviceName?: string
  serviceType?: string
  address?: string
  estimatedPrice?: number
  providerId?: string
  assignedProvider?: string
  providerName?: string
  assignedProviderName?: string
  latitude?: number
  longitude?: number
  createdAt?: unknown
  assignedAt?: unknown
  acceptedAt?: unknown
  updatedAt?: unknown
}

interface ProviderLiveInfo {
  name?: string
  phone?: string
  rating?: number
  verificationStatus?: string
  lat?: number
  lng?: number
  accuracy?: number
  lastLocationUpdate?: number | null
  locationEnabled?: boolean
}

interface ProviderOption {
  id: string
  nome?: string
  name?: string
  fullName?: string
  phone?: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  awaiting_payment: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
  pending: { label: "Pendente", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  paid: { label: "Pago", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  distributing: { label: "Distribuindo", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200" },
  searching_provider: { label: "Buscando prestador", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200" },
  assigned: { label: "Atribuído", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200" },
  accepted: { label: "Aceito", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200" },
  on_the_way: { label: "A caminho", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" },
  in_progress: { label: "Em atendimento", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" },
  started: { label: "Em atendimento", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" },
}

// Status monitoráveis — Firestore `in` aceita até 30 valores.
const MONITORABLE_STATUSES = [
  "awaiting_payment",
  "pending",
  "paid",
  "searching_provider",
  "distributing",
  "assigned",
  "accepted",
  "on_the_way",
  "in_progress",
  "started",
]

const str = (v: unknown): string | undefined => {
  if (v === null || v === undefined) return undefined
  const s = String(v).trim()
  return s.length ? s : undefined
}
const num = (v: unknown): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

// Bipe curto via WebAudio (sem assets) para o alerta sonoro.
function playAlertBeep() {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => ctx.close().catch(() => null)
  } catch {
    // som é best-effort
  }
}

type FilterKey = "all" | "alert" | "awaiting" | "assigned" | "active"

export default function MonitoramentoPedidosPage() {
  const { hasPermission } = usePermissions()
  const canOperate = hasPermission("operarPedidos")
  const { toast } = useToast()

  const [orders, setOrders] = useState<OrderDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveByProvider, setLiveByProvider] = useState<Record<string, ProviderLiveInfo>>({})
  const [tick, setTick] = useState(0) // força recálculo dos sinais por tempo
  const [filter, setFilter] = useState<FilterKey>("all")
  const [soundOn, setSoundOn] = useState(true)

  // baseline de deslocamento por pedido (1ª localização vista nesta sessão)
  const baselines = useRef<Record<string, MovementBaseline>>({})
  // assinaturas ativas de localização por prestador
  const providerUnsubs = useRef<Record<string, () => void>>({})
  // ids que já estavam em alerta (evita rebipar a cada tick)
  const alertingIds = useRef<Set<string>>(new Set())

  // reatribuir / cancelar
  const [reassignOrder, setReassignOrder] = useState<OrderDoc | null>(null)
  const [reassignReason, setReassignReason] = useState("")
  const [reassignProviderId, setReassignProviderId] = useState("pool")
  const [reassigning, setReassigning] = useState(false)
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([])
  const [cancelOrder, setCancelOrder] = useState<OrderDoc | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)

  // ── Assina os pedidos ativos em tempo real ──
  useEffect(() => {
    if (!db) {
      setError("Firebase não inicializado")
      setLoading(false)
      return
    }
    const q = query(collection(db, "orders"), where("status", "in", MONITORABLE_STATUSES))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: OrderDoc[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as OrderDoc)
          .filter((o) => isMonitorableStatus(o.status ?? ""))
        list.sort((a, b) => (toMillis(b.createdAt) ?? 0) - (toMillis(a.createdAt) ?? 0))
        setOrders(list)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  // ── Mantém assinaturas de localização dos prestadores ativos ──
  useEffect(() => {
    const wanted = new Set(
      orders.map((o) => str(o.providerId) ?? str(o.assignedProvider)).filter(Boolean) as string[]
    )

    // remove assinaturas que não são mais necessárias
    Object.keys(providerUnsubs.current).forEach((pid) => {
      if (!wanted.has(pid)) {
        providerUnsubs.current[pid]()
        delete providerUnsubs.current[pid]
      }
    })

    // adiciona novas
    wanted.forEach((pid) => {
      if (providerUnsubs.current[pid] || !db) return
      // perfil (nome/telefone/nota) uma vez
      getDoc(doc(db, "providers", pid))
        .then((s) => {
          if (!s.exists()) return
          const d = s.data() as Record<string, unknown>
          setLiveByProvider((prev) => ({
            ...prev,
            [pid]: {
              ...prev[pid],
              name: str(d.fullName) ?? str(d.name) ?? str(d.nome) ?? prev[pid]?.name,
              phone: str(d.phone) ?? str(d.telefone) ?? prev[pid]?.phone,
              rating: num(d.averageRating) ?? num(d.rating) ?? prev[pid]?.rating,
              verificationStatus: str(d.verificationStatus) ?? prev[pid]?.verificationStatus,
            },
          }))
        })
        .catch(() => null)

      // localização ao vivo em users/{pid}
      const unsub = onSnapshot(
        doc(db, "users", pid),
        (s) => {
          if (!s.exists()) return
          const d = s.data() as Record<string, unknown>
          const coord = d.coordinates as Record<string, unknown> | undefined
          const lat = num(d.latitude) ?? num(coord?._latitude) ?? num(coord?.latitude)
          const lng = num(d.longitude) ?? num(coord?._longitude) ?? num(coord?.longitude)
          const lastUpd = toMillis(d.lastLocationUpdate)
          // captura baseline de deslocamento (1ª leitura válida por prestador)
          if (lat != null && lng != null) {
            for (const o of orders) {
              const opid = str(o.providerId) ?? str(o.assignedProvider)
              if (opid === pid && !baselines.current[o.id]) {
                baselines.current[o.id] = { ms: Date.now(), lat, lng }
              }
            }
          }
          setLiveByProvider((prev) => ({
            ...prev,
            [pid]: {
              ...prev[pid],
              name: prev[pid]?.name ?? str(d.fullName) ?? str(d.name),
              phone: prev[pid]?.phone ?? str(d.phone) ?? str(d.telefone),
              lat,
              lng,
              accuracy: num(d.accuracy),
              lastLocationUpdate: lastUpd,
              locationEnabled: d.locationEnabled === true,
            },
          }))
        },
        () => null
      )
      providerUnsubs.current[pid] = unsub
    })
  }, [orders])

  // desmonta todas as assinaturas ao sair
  useEffect(() => {
    const subs = providerUnsubs.current
    return () => {
      Object.values(subs).forEach((u) => u())
    }
  }, [])

  // ticker p/ recalcular alertas baseados em tempo (a cada 20s)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20_000)
    return () => clearInterval(id)
  }, [])

  // ── Calcula sinais por pedido ──
  const computed = useMemo(() => {
    void tick // dependência p/ recalcular por tempo
    const now = Date.now()
    return orders.map((o) => {
      const pid = str(o.providerId) ?? str(o.assignedProvider)
      const live = pid ? liveByProvider[pid] : undefined
      const result: MonitorResult = computeMonitorSignals({
        status: o.status ?? "",
        paymentStatus: o.paymentStatus,
        providerId: pid ?? null,
        createdMs: toMillis(o.createdAt),
        acceptedMs: toMillis(o.assignedAt) ?? toMillis(o.acceptedAt) ?? toMillis(o.updatedAt),
        orderLat: num(o.latitude) ?? null,
        orderLng: num(o.longitude) ?? null,
        live: live
          ? {
              lat: live.lat,
              lng: live.lng,
              accuracy: live.accuracy,
              lastLocationUpdate: live.lastLocationUpdate,
              locationEnabled: live.locationEnabled,
            }
          : null,
        baseline: baselines.current[o.id] ?? null,
        now,
      })
      return { order: o, pid, live, result }
    })
  }, [orders, liveByProvider, tick])

  // ── Som ao surgir um NOVO alerta ──
  useEffect(() => {
    const currentlyAlerting = new Set(computed.filter((c) => c.result.alert).map((c) => c.order.id))
    let hasNew = false
    currentlyAlerting.forEach((id) => {
      if (!alertingIds.current.has(id)) hasNew = true
    })
    alertingIds.current = currentlyAlerting
    if (hasNew && soundOn) playAlertBeep()
  }, [computed, soundOn])

  const summary = useMemo(() => {
    const s = { total: computed.length, awaiting: 0, assigned: 0, active: 0, alerts: 0 }
    for (const c of computed) {
      if (c.result.alert) s.alerts++
      if (c.result.phase === "awaiting") s.awaiting++
      else if (c.result.phase === "assigned") s.assigned++
      else if (c.result.phase === "active") s.active++
    }
    return s
  }, [computed])

  const visible = useMemo(() => {
    return computed.filter((c) => {
      if (filter === "all") return true
      if (filter === "alert") return c.result.alert
      return c.result.phase === filter
    })
  }, [computed, filter])

  // ── Ações ──
  const loadProviderOptions = useCallback(async () => {
    try {
      const res = await adminFetch("/api/providers/active")
      const data = await res.json()
      if (data.success) setProviderOptions(data.providers ?? [])
    } catch {
      setProviderOptions([])
    }
  }, [])

  const openReassign = (o: OrderDoc) => {
    setReassignOrder(o)
    setReassignReason("")
    setReassignProviderId("pool")
    void loadProviderOptions()
  }

  const submitReassign = async () => {
    if (!reassignOrder || !reassignReason.trim()) return
    setReassigning(true)
    try {
      const picked = providerOptions.find((p) => p.id === reassignProviderId)
      const body: Record<string, unknown> = { reason: reassignReason.trim() }
      if (reassignProviderId !== "pool" && picked) {
        body.newProviderId = picked.id
        body.newProviderName = picked.nome || picked.name || picked.fullName || "Prestador"
      }
      const res = await adminFetch(`/api/orders/${reassignOrder.id}/redirect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Falha ao reatribuir")
      toast({ title: "Pedido reatribuído", description: data.message })
      // limpa baseline pra recomeçar o monitoramento de deslocamento
      delete baselines.current[reassignOrder.id]
      setReassignOrder(null)
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setReassigning(false)
    }
  }

  const submitCancel = async () => {
    if (!cancelOrder || !cancelReason.trim()) return
    setCancelling(true)
    try {
      const res = await adminFetch(`/api/orders/${cancelOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelledBy: "admin", cancellationReason: cancelReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Falha ao cancelar")
      toast({ title: "Pedido cancelado", description: `Pedido ${cancelOrder.protocol ?? cancelOrder.id.slice(0, 6)} cancelado.` })
      setCancelOrder(null)
    } catch (e) {
      toast({ title: "Erro", description: e instanceof Error ? e.message : String(e), variant: "destructive" })
    } finally {
      setCancelling(false)
    }
  }

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-1">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Activity className="h-6 w-6 text-primary" />
            Monitoramento de Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe em tempo real os pedidos em andamento, a localização dos prestadores e os alertas de ociosidade.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Ao vivo
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundOn((v) => !v)}
            title={soundOn ? "Silenciar alertas" : "Ativar som dos alertas"}
          >
            {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Em andamento" value={summary.total} icon={Activity} tone="default" />
        <KpiCard label="Aguardando prestador" value={summary.awaiting} icon={Clock} tone="warn" />
        <KpiCard label="A caminho" value={summary.assigned} icon={Navigation} tone="info" />
        <KpiCard label="Em atendimento" value={summary.active} icon={UserCog} tone="info" />
        <KpiCard label="Com alerta" value={summary.alerts} icon={AlertTriangle} tone={summary.alerts > 0 ? "bad" : "ok"} />
      </div>

      {/* Filtros */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
        <TabsList>
          <TabsTrigger value="all">Todos ({summary.total})</TabsTrigger>
          <TabsTrigger value="alert" className="data-[state=active]:text-red-600">
            Com alerta ({summary.alerts})
          </TabsTrigger>
          <TabsTrigger value="awaiting">Aguardando ({summary.awaiting})</TabsTrigger>
          <TabsTrigger value="assigned">A caminho ({summary.assigned})</TabsTrigger>
          <TabsTrigger value="active">Em atendimento ({summary.active})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando pedidos…
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-10 text-red-600">
            <XCircle className="h-5 w-5" /> Erro ao carregar: {error}
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="font-medium">Nenhum pedido nesta categoria</p>
            <p className="text-sm">
              {filter === "alert" ? "Nenhum pedido com problema no momento. 🎉" : "Os pedidos em andamento aparecem aqui em tempo real."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visible.map(({ order, live, result }) => (
            <OrderMonitorCard
              key={order.id}
              order={order}
              live={live}
              result={result}
              canOperate={canOperate}
              onReassign={() => openReassign(order)}
              onCancel={() => {
                setCancelOrder(order)
                setCancelReason("")
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Reatribuir */}
      <Dialog open={!!reassignOrder} onOpenChange={(o) => !o && setReassignOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" /> Reatribuir pedido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Remove o prestador atual e reatribui a outro ou devolve à fila de distribuição.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium">Novo prestador</label>
              <Select value={reassignProviderId} onValueChange={setReassignProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pool">↩︎ Devolver à fila (distribuição)</SelectItem>
                  {providerOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome || p.name || p.fullName || p.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Motivo (obrigatório)</label>
              <Textarea
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="Ex.: prestador não se deslocou após aceitar"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOrder(null)} disabled={reassigning}>
              Cancelar
            </Button>
            <Button onClick={submitReassign} disabled={reassigning || !reassignReason.trim()}>
              {reassigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reatribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar */}
      <Dialog open={!!cancelOrder} onOpenChange={(o) => !o && setCancelOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" /> Cancelar pedido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Esta ação cancela o pedido {cancelOrder?.protocol ?? cancelOrder?.id.slice(0, 6)}. Informe a justificativa.
            </p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo do cancelamento administrativo"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOrder(null)} disabled={cancelling}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={submitCancel} disabled={cancelling || !cancelReason.trim()}>
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone: "default" | "warn" | "info" | "bad" | "ok"
}) {
  const toneCls =
    tone === "bad"
      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
        : tone === "info"
          ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30"
          : ""
  const iconCls =
    tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-600" : tone === "info" ? "text-indigo-600" : "text-muted-foreground"
  return (
    <Card className={toneCls}>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className={`h-5 w-5 shrink-0 ${iconCls}`} />
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Card de um pedido ──────────────────────────────────────────────────────
function OrderMonitorCard({
  order,
  live,
  result,
  canOperate,
  onReassign,
  onCancel,
}: {
  order: OrderDoc
  live?: ProviderLiveInfo
  result: MonitorResult
  canOperate: boolean
  onReassign: () => void
  onCancel: () => void
}) {
  const status = (order.status ?? "").toLowerCase()
  const statusCfg = STATUS_LABEL[status] ?? { label: order.status ?? "—", color: "bg-gray-100 text-gray-700" }
  const clientName = str(order.clientName) ?? str(order.customerName) ?? "Cliente"
  const clientPhone = str(order.clientPhone) ?? str(order.customerPhone)
  const service = str(order.serviceName) ?? str(order.serviceType) ?? "Serviço"
  const providerName = live?.name ?? str(order.providerName) ?? str(order.assignedProviderName)
  const providerPhone = live?.phone
  const pid = str(order.providerId) ?? str(order.assignedProvider)
  const createdMs = toMillis(order.createdAt)
  const acceptedMs = toMillis(order.assignedAt) ?? toMillis(order.acceptedAt)

  const borderTone =
    result.worst === "bad"
      ? "border-l-4 border-l-red-500"
      : result.worst === "warn"
        ? "border-l-4 border-l-amber-400"
        : "border-l-4 border-l-emerald-400"

  return (
    <Card className={`${borderTone} overflow-hidden`}>
      <CardContent className="space-y-3 p-4">
        {/* topo: protocolo + status + tempo */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">#{order.protocol ?? order.id.slice(0, 6)}</span>
            <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> criado {fmtAgo(createdMs)}
          </span>
        </div>

        {/* cliente + serviço */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{clientName}</span>
          </span>
          <span className="text-muted-foreground">{service}</span>
          {order.estimatedPrice != null && (
            <span className="text-muted-foreground">R$ {Number(order.estimatedPrice).toFixed(2).replace(".", ",")}</span>
          )}
        </div>
        {order.address && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.address}
          </p>
        )}

        {/* chips de diagnóstico */}
        <div className="flex flex-wrap gap-1.5">
          {result.signals.map((s, i) => (
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
              {s.tone === "ok" ? <CheckCircle2 className="h-3 w-3" /> : s.tone === "warn" ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {s.label}
            </span>
          ))}
        </div>

        {/* prestador + localização ao vivo */}
        <div className="rounded-lg border bg-muted/30 p-3">
          {pid ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                  <UserCog className="h-4 w-4" /> {providerName ?? "Prestador"}
                  {live?.rating != null && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500" /> {live.rating.toFixed(1)}
                    </span>
                  )}
                </span>
                {live?.lastLocationUpdate != null && (
                  <span className={`inline-flex items-center gap-1 text-xs ${result.locationStale ? "text-red-600" : "text-emerald-600"}`}>
                    <Navigation className="h-3 w-3" /> GPS {fmtAgo(live.lastLocationUpdate)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {acceptedMs != null && <span>aceitou {fmtAgo(acceptedMs)}</span>}
                {result.distanceKm != null && (
                  <span>
                    ≈ <strong className="text-foreground">{result.distanceKm.toFixed(1)} km</strong> do cliente
                  </span>
                )}
                {result.movedKm != null && <span>deslocou {Math.round(result.movedKm * 1000)} m</span>}
                {live?.lat != null && live?.lng != null && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${live.lat},${live.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> ver no mapa
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" /> Sem prestador atribuído
            </p>
          )}
        </div>

        {/* ações */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {providerPhone && (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${providerPhone}`}>
                <Phone className="mr-1 h-3.5 w-3.5" /> Prestador
              </a>
            </Button>
          )}
          {clientPhone && (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${clientPhone}`}>
                <Phone className="mr-1 h-3.5 w-3.5" /> Cliente
              </a>
            </Button>
          )}
          {pid && (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/controle/chat-prestadores">
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat
              </Link>
            </Button>
          )}
          {canOperate && (
            <>
              <Button variant="outline" size="sm" onClick={onReassign}>
                <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Reatribuir
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onCancel}>
                <XCircle className="mr-1 h-3.5 w-3.5" /> Cancelar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
