"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { subscribeOrderValidation } from "@/lib/services/firebase-checklists"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CheckCircle2,
  Clock,
  Copy,
  KeyRound,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import type { ServiceStartValidation } from "@/lib/orders/operational"

function toDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof (v as { toDate?: () => Date }).toDate === "function")
    return (v as { toDate: () => Date }).toDate()
  return null
}

function fmt(v: unknown): string {
  const d = toDate(v)
  return d ? format(d, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "—"
}

function isExpired(v: Record<string, unknown>): boolean {
  const exp = toDate(v.expiresAt)
  if (!exp) return false
  return exp < new Date()
}

const STATUS_CONFIG: Record<
  ServiceStartValidation["status"],
  { label: string; badge: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Aguardando confirmação",
    badge: "bg-yellow-100 text-yellow-800",
    icon: <Clock className="h-4 w-4" />,
  },
  confirmed: {
    label: "Confirmado",
    badge: "bg-green-100 text-green-800",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  expired: {
    label: "Expirado",
    badge: "bg-muted text-muted-foreground",
    icon: <XCircle className="h-4 w-4" />,
  },
  blocked: {
    label: "Bloqueado (tentativas excedidas)",
    badge: "bg-red-100 text-red-700",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
}

interface Props {
  orderId: string
  operationalStatus?: string
}

export function ServiceValidationPanel({ orderId, operationalStatus }: Props) {
  const [validation, setValidation] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeOrderValidation(
      orderId,
      (val) => {
        setValidation(val)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [orderId])

  const copyCode = () => {
    const code = String(validation?.code ?? "")
    if (!code) return
    navigator.clipboard.writeText(code).then(() => toast.success("Código copiado!"))
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const now = new Date()
      const expires = new Date(now.getTime() + 30 * 60 * 1000)

      await updateDoc(doc(db!, "orders", orderId), {
        serviceValidation: {
          code,
          generatedAt: serverTimestamp(),
          expiresAt: expires,
          attempts: 0,
          maxAttempts: 5,
          status: "pending",
          confirmedAt: null,
          confirmedBy: null,
        },
        updatedAt: serverTimestamp(),
      })
      toast.success("Novo código gerado e enviado ao cliente.")
    } catch (e) {
      toast.error("Erro ao regenerar código.")
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const isRelevantStatus =
    operationalStatus === "chegou_no_local" ||
    operationalStatus === "aguardando_validacao" ||
    operationalStatus === "em_atendimento"

  return (
    <Card
      className={
        validation?.status === "confirmed"
          ? "border-green-200"
          : validation?.status === "blocked"
          ? "border-red-200"
          : "border-yellow-200"
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-orange-600" />
          Validação de Início de Serviço
        </CardTitle>
        <CardDescription>
          Código de confirmação enviado ao cliente para autorizar o início do atendimento.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!validation ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum código de validação gerado ainda.
            </p>
            {isRelevantStatus && (
              <p className="text-xs text-muted-foreground max-w-xs">
                O código é gerado automaticamente pelo aplicativo do prestador ao chegar no local.
                Se necessário, gere manualmente abaixo.
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {regenerating ? "Gerando…" : "Gerar código agora"}
            </Button>
          </div>
        ) : (
          <>
            {/* Status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                className={
                  STATUS_CONFIG[validation.status as ServiceStartValidation["status"]]?.badge ??
                  "bg-muted text-muted-foreground"
                }
              >
                <span className="flex items-center gap-1.5">
                  {STATUS_CONFIG[validation.status as ServiceStartValidation["status"]]?.icon}
                  {STATUS_CONFIG[validation.status as ServiceStartValidation["status"]]?.label ??
                    String(validation.status)}
                </span>
              </Badge>
              {isExpired(validation) && validation.status === "pending" && (
                <Badge className="bg-muted text-muted-foreground">Expirado</Badge>
              )}
            </div>

            {/* Código */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Código do cliente</p>
                <p className="text-4xl font-mono font-bold tracking-widest text-foreground">
                  {String(validation.code ?? "—")}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyCode}
                  title="Copiar código"
                  className="h-9 w-9"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {validation.status !== "confirmed" && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    title="Regenerar código"
                    className="h-9 w-9"
                  >
                    <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>
            </div>

            {/* Detalhes */}
            <div className="grid gap-2 text-sm">
              <DetailRow
                label="Gerado em"
                value={fmt(validation.generatedAt)}
                icon={<Clock className="h-3.5 w-3.5" />}
              />
              <DetailRow
                label="Expira em"
                value={fmt(validation.expiresAt)}
                icon={<Clock className="h-3.5 w-3.5" />}
                highlight={isExpired(validation) ? "red" : undefined}
              />
              <DetailRow
                label="Tentativas"
                value={`${validation.attempts ?? 0} / ${validation.maxAttempts ?? 5}`}
                icon={<KeyRound className="h-3.5 w-3.5" />}
                highlight={
                  Number(validation.attempts ?? 0) >= Number(validation.maxAttempts ?? 5)
                    ? "red"
                    : undefined
                }
              />
              {!!validation.confirmedAt && (
                <>
                  <DetailRow
                    label="Confirmado em"
                    value={fmt(validation.confirmedAt)}
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    highlight="green"
                  />
                  {!!validation.confirmedBy && (
                    <DetailRow
                      label="Confirmado por"
                      value={String(validation.confirmedBy)}
                      icon={<Phone className="h-3.5 w-3.5" />}
                    />
                  )}
                </>
              )}
            </div>

            {/* Instrução */}
            {validation.status === "pending" && !isExpired(validation) && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2.5 text-xs text-yellow-800">
                <strong>Instrução:</strong> Forneça este código ao cliente. Ele deve informar ao
                prestador para confirmar presença e autorizar o início do serviço.
              </div>
            )}

            {validation.status === "confirmed" && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Presença do prestador confirmada pelo cliente. Serviço autorizado para início.
              </div>
            )}

            {validation.status === "blocked" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-800">
                <strong>Atenção:</strong> Número máximo de tentativas excedido. Gere um novo
                código ou entre em contato com o cliente.
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-red-700 border-red-300"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Novo código
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function DetailRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  highlight?: "red" | "green"
}) {
  const colorClass =
    highlight === "red"
      ? "text-red-600"
      : highlight === "green"
      ? "text-green-700"
      : "text-foreground"

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-medium text-right ${colorClass}`}>{value}</span>
    </div>
  )
}
