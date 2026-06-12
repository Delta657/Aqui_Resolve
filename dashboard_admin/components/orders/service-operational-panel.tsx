"use client"

import { useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-provider"
import { useOrderOperationalEvents } from "@/hooks/use-order-operational-events"
import {
  OPERATIONAL_STATUS_BADGE_CLASS,
  OPERATIONAL_STATUS_LABELS,
  formatDurationMs,
  getAllowedNextOperationalStatuses,
  previewOperationalMetrics,
  resolveOperationalSlaDeadlineMs,
  resolveOperationalStatus,
  type ServiceOperationalStatus,
} from "@/lib/orders/operational"
import {
  applyOperationalTransition,
  reassignTechnician,
} from "@/lib/services/order-operational-firestore"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Activity, MapPin, Timer, UserRound, Wrench } from "lucide-react"

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    const d = (value as { toDate: () => Date }).toDate()
    return d instanceof Date ? d : null
  }
  const p = new Date(String(value))
  return Number.isNaN(p.getTime()) ? null : p
}

function newMutationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

interface ServiceOperationalPanelProps {
  order: Record<string, unknown>
  enabled?: boolean
}

export function ServiceOperationalPanel({ order, enabled = true }: ServiceOperationalPanelProps) {
  const { user } = useAuth()
  const orderId = String(order.id || "")
  const { events, loading: eventsLoading } = useOrderOperationalEvents(orderId, enabled)

  const current = resolveOperationalStatus(order)
  const allowed = getAllowedNextOperationalStatuses(current)

  const [nextStatus, setNextStatus] = useState<ServiceOperationalStatus | "">("")
  const [note, setNote] = useState("")
  const [techId, setTechId] = useState("")
  const [techName, setTechName] = useState("")
  const [techTeam, setTechTeam] = useState("")
  const [reassignId, setReassignId] = useState("")
  const [reassignName, setReassignName] = useState("")
  const [reassignTeam, setReassignTeam] = useState("")
  const [reassignReason, setReassignReason] = useState("")
  const [busy, setBusy] = useState(false)

  const assigned = order.assignedTechnician as
    | { id?: string; name?: string; team?: string; avatarUrl?: string; online?: boolean; acceptedAt?: unknown }
    | undefined

  const metrics = useMemo(() => previewOperationalMetrics(order), [order])

  const timeline = useMemo(() => {
    const created = toDate(order.createdAt)
    const base = [
      {
        id: "sys-created",
        label: "Pedido criado",
        at: created,
        detail: "Registro inicial",
      },
    ]

    const mapped = [...events]
      .sort((a, b) => {
        const da = toDate(a.at)?.getTime() ?? 0
        const dbb = toDate(b.at)?.getTime() ?? 0
        return da - dbb
      })
      .reverse()
      .map((ev) => {
        const at = toDate(ev.at) ?? toDate(ev.createdAt)
        const type = String(ev.type || "")
        if (type === "technician_reassign") {
          return {
            id: ev.id,
            label: "Reatribuição de técnico",
            at,
            detail: `${String(ev.actorName || ev.actorEmail || "sistema")} → ${String(ev.technicianName || "")}`,
          }
        }
        const from = ev.fromStatus ? OPERATIONAL_STATUS_LABELS[ev.fromStatus as ServiceOperationalStatus] : "—"
        const to = ev.toStatus ? OPERATIONAL_STATUS_LABELS[ev.toStatus as ServiceOperationalStatus] : "—"
        return {
          id: ev.id,
          label: "Mudança de estado",
          at,
          detail: `${from} → ${to}${ev.note ? ` · ${String(ev.note)}` : ""} · ${String(ev.actorName || ev.actorEmail || "sistema")}`,
        }
      })

    return [...base, ...mapped]
  }, [events, order.createdAt])

  const providerIdFromOrder = order.providerId ?? order.provider_id ?? order.prestadorId
  const slaDeadlineMs = resolveOperationalSlaDeadlineMs(order)
  const slaDeadlineLabel =
    slaDeadlineMs != null ? format(new Date(slaDeadlineMs), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "— (defina slaDueAt ou slaTargetMinutes)"
  const lat =
    typeof order.latitude === "number"
      ? order.latitude
      : typeof order.locationLat === "number"
        ? order.locationLat
        : null
  const lng =
    typeof order.longitude === "number"
      ? order.longitude
      : typeof order.locationLng === "number"
        ? order.locationLng
        : null

  const handleApply = async () => {
    if (!nextStatus) {
      toast.error("Selecione o próximo estado.")
      return
    }

    if (nextStatus === "aceite_pelo_tecnico" && (!techId.trim() || !techName.trim())) {
      toast.error("Informe ID e nome do técnico para aceite.")
      return
    }

    setBusy(true)
    try {
      await applyOperationalTransition({
        orderId,
        toStatus: nextStatus,
        note: note.trim() || undefined,
        mutationId: newMutationId(),
        actor: {
          uid: user?.uid,
          email: user?.email ?? undefined,
          name: user?.displayName ?? undefined,
        },
        technician:
          nextStatus === "aceite_pelo_tecnico"
            ? {
                id: techId.trim(),
                name: techName.trim(),
                team: techTeam.trim() || undefined,
              }
            : undefined,
      })
      toast.success("Estado operacional atualizado.")
      setNote("")
      setNextStatus("")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao atualizar estado."
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignId.trim() || !reassignName.trim()) {
      toast.error("Informe ID e nome do novo técnico.")
      return
    }
    setBusy(true)
    try {
      await reassignTechnician({
        orderId,
        mutationId: newMutationId(),
        actor: {
          uid: user?.uid,
          email: user?.email ?? undefined,
          name: user?.displayName ?? undefined,
        },
        technician: {
          id: reassignId.trim(),
          name: reassignName.trim(),
          team: reassignTeam.trim() || undefined,
        },
        reason: reassignReason.trim() || undefined,
      })
      toast.success("Técnico reatribuído.")
      setReassignReason("")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha na reatribuição."
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const history = (order.technicianHistory as Array<Record<string, unknown>> | undefined) || []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-orange-600" />
            Operação em tempo real
          </CardTitle>
          <CardDescription>Estados, responsáveis e auditoria (Firestore + listener).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado atual:</span>
            <Badge variant="outline" className={OPERATIONAL_STATUS_BADGE_CLASS[current]}>
              {OPERATIONAL_STATUS_LABELS[current]}
            </Badge>
          </div>

          {assigned?.id ? (
            <div className="flex flex-wrap items-start gap-4 rounded-lg border bg-muted/30 p-4">
              <Avatar className="h-12 w-12">
                {assigned.avatarUrl ? <AvatarImage src={assigned.avatarUrl} alt="" /> : null}
                <AvatarFallback>{(assigned.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{assigned.name}</span>
                  {typeof assigned.online === "boolean" ? (
                    <Badge variant="secondary">{assigned.online ? "Online" : "Offline"}</Badge>
                  ) : (
                    <Badge variant="outline">Presença não informada</Badge>
                  )}
                </div>
                <p className="break-all text-sm text-muted-foreground">ID: {assigned.id}</p>
                {assigned.team ? <p className="text-sm">Equipe: {assigned.team}</p> : null}
                <p className="text-sm text-muted-foreground">Aceite: {formatDatePt(assigned.acceptedAt)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum técnico atribuído neste pedido.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Deslocamento" value={formatDurationMs(metrics.displacementMs)} icon={<MapPin className="h-4 w-4" />} />
            <Metric label="Atendimento líquido" value={formatDurationMs(metrics.executionMs)} icon={<Wrench className="h-4 w-4" />} />
            <Metric label="Pausas" value={formatDurationMs(metrics.pausedMs)} icon={<Timer className="h-4 w-4" />} />
            <Metric label="Desde aceite" value={formatDurationMs(metrics.totalSinceAcceptMs)} icon={<Timer className="h-4 w-4" />} />
            <Metric
              label="SLA restante"
              value={metrics.slaRemainingMs != null ? formatDurationMs(metrics.slaRemainingMs) : "—"}
              icon={<Timer className="h-4 w-4" />}
            />
            <Metric label="Atraso" value={metrics.delayMs != null ? formatDurationMs(metrics.delayMs) : "—"} icon={<Timer className="h-4 w-4" />} />
          </div>

          <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Prazo SLA (limite): </span>
            {slaDeadlineLabel}
            {providerIdFromOrder != null && String(providerIdFromOrder) !== String(assigned?.id ?? "") ? (
              <span className="mt-1 block text-xs">
                Prestador legado (campo no pedido): {String(providerIdFromOrder)} — alinhado ao técnico ao gravar.
              </span>
            ) : null}
          </div>

          {lat != null && lng != null ? (
            <a
              className="inline-flex text-sm text-orange-700 underline"
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir local no mapa (coordenadas do pedido)
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Histórico de técnicos</CardTitle>
          <CardDescription>Reatribuições registradas no documento (append-only).</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem reatribuições registradas.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((h, i) => (
                <li key={i} className="rounded border px-3 py-2">
                  <span className="font-medium">{String(h.technicianName || "")}</span> ({String(h.technicianId || "")})
                  {h.team ? <span className="text-muted-foreground"> · {String(h.team)}</span> : null}
                  <div className="break-words text-xs text-muted-foreground">
                    {formatDatePt(h.assignedAt)} → {formatDatePt(h.unassignedAt)}
                    {h.reason ? ` · ${String(h.reason)}` : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avançar estado</CardTitle>
          <CardDescription>Transições validadas no cliente; auditoria na subcoleção operational_events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Próximo estado</Label>
              <Select value={nextStatus || undefined} onValueChange={(v) => setNextStatus(v as ServiceOperationalStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {allowed.map((s) => (
                    <SelectItem key={s} value={s}>
                      {OPERATIONAL_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nota (opcional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Motivo ou observação" />
            </div>
          </div>

          {nextStatus === "aceite_pelo_tecnico" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>ID técnico</Label>
                <Input value={techId} onChange={(e) => setTechId(e.target.value)} placeholder="uid ou id interno" />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={techName} onChange={(e) => setTechName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Equipe</Label>
                <Input value={techTeam} onChange={(e) => setTechTeam(e.target.value)} />
              </div>
            </div>
          ) : null}

          <Button type="button" disabled={busy || allowed.length === 0} onClick={handleApply} className="bg-orange-600 hover:bg-orange-700">
            {busy ? "Aplicando…" : "Registrar mudança"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Reatribuir técnico</CardTitle>
          <CardDescription>Não altera o estado operacional; gera evento de auditoria.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Novo ID</Label>
              <Input value={reassignId} onChange={(e) => setReassignId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Novo nome</Label>
              <Input value={reassignName} onChange={(e) => setReassignName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Equipe</Label>
              <Input value={reassignTeam} onChange={(e) => setReassignTeam(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input value={reassignReason} onChange={(e) => setReassignReason(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" disabled={busy} onClick={handleReassign}>
            Reatribuir
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Linha do tempo (auditoria)</CardTitle>
          <CardDescription>
            {eventsLoading ? "Carregando eventos…" : `${events.length} evento(s) recente(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 pr-3">
            <ul className="space-y-3 border-l-2 border-orange-200 pl-4">
              {timeline.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.at ? format(item.at, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}</p>
                  <p className="break-words text-sm text-muted-foreground">{item.detail}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Notificações: integração via toast (Sonner) após gravação. Para push mobile, exponha os mesmos eventos em Cloud Functions.
      </p>
    </div>
  )
}

function formatDatePt(value: unknown): string {
  const d = toDate(value)
  if (!d) return "—"
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}
