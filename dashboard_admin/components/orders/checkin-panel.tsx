"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
  PlayCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

function toDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof (v as { toDate?: () => Date }).toDate === "function") return (v as { toDate: () => Date }).toDate()
  const p = new Date(String(v))
  return Number.isNaN(p.getTime()) ? null : p
}
function fmt(v: unknown): string {
  const d = toDate(v)
  return d ? format(d, "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"
}

interface Props {
  order: Record<string, unknown>
}

/**
 * Painel de Check-in / Início do Serviço — lê os campos REAIS gravados pelo app
 * (startedAt, *VerificationCode, verificationCodesGeneratedAt, *CompletionConfirmed)
 * e o GPS do pedido. Substitui o antigo painel que lia o objeto fictício
 * `serviceValidation`.
 */
export function CheckInPanel({ order }: Props) {
  const startedAt = order.startedAt
  const completedAt = order.completedAt
  const codesGeneratedAt = order.verificationCodesGeneratedAt
  const clientCode = String(order.clientVerificationCode ?? "")
  const providerCode = String(order.providerVerificationCode ?? "")
  const clientConfirmed = Boolean(order.clientCompletionConfirmed)
  const providerConfirmed = Boolean(order.providerCompletionConfirmed)
  const lat = order.latitude as number | undefined
  const lng = order.longitude as number | undefined
  const started = Boolean(startedAt) || Boolean(clientCode)

  const copy = (code: string, label: string) => {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => toast.success(`${label} copiado!`))
  }

  return (
    <Card className={started ? "border-emerald-200" : "border-amber-200"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlayCircle className="h-4 w-4 text-orange-600" />
          Check-in / Início do Serviço
        </CardTitle>
        <CardDescription>Registro de início, validação por código e confirmações de conclusão.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!started ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Clock className="h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Serviço ainda não iniciado pelo prestador.</p>
          </div>
        ) : (
          <>
            {/* Status de início */}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Row icon={<PlayCircle className="h-3.5 w-3.5" />} label="Iniciado em" value={fmt(startedAt)} highlight="green" />
              <Row icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Concluído em" value={fmt(completedAt)} />
              <Row icon={<Clock className="h-3.5 w-3.5" />} label="Códigos gerados em" value={fmt(codesGeneratedAt)} />
              {lat != null && lng != null ? (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> GPS</span>
                  <a className="font-medium text-orange-700 underline" href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer">
                    Abrir no mapa
                  </a>
                </div>
              ) : null}
            </div>

            {/* Códigos de validação */}
            <div className="grid gap-3 sm:grid-cols-2">
              <CodeBox label="Código do cliente" code={clientCode} onCopy={() => copy(clientCode, "Código do cliente")} />
              <CodeBox label="Código do prestador" code={providerCode} onCopy={() => copy(providerCode, "Código do prestador")} />
            </div>

            {/* Confirmações de conclusão */}
            <div className="flex flex-wrap gap-2">
              <ConfirmBadge label="Cliente confirmou conclusão" ok={clientConfirmed} />
              <ConfirmBadge label="Prestador confirmou conclusão" ok={providerConfirmed} />
            </div>

            {started && clientCode && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Códigos de validação gerados. Forneça o código ao cliente para autorizar o início, se solicitado.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: "green" }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</span>
      <span className={`break-words font-medium ${highlight === "green" ? "text-emerald-700" : "text-foreground"}`}>{value}</span>
    </div>
  )
}

function CodeBox({ label, code, onCopy }: { label: string; code: string; onCopy: () => void }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-3 py-2.5">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 break-all font-mono text-lg font-bold tracking-[0.2em] sm:text-2xl sm:tracking-widest">{code || "—"}</span>
        {code ? (
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={onCopy} title="Copiar">
            <Copy className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function ConfirmBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Badge className={ok ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
      <span className="flex items-center gap-1">
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {label}
      </span>
    </Badge>
  )
}
