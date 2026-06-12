import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    agendado: {
      label: "Agendado",
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    },
    aceito: {
      label: "Aceito",
      variant: "default" as const,
      className: "bg-green-100 text-green-800",
    },
    aguardando: {
      label: "Aguardando",
      variant: "default" as const,
      className: "bg-yellow-100 text-yellow-800",
    },
    nao_enviado: {
      label: "Não Enviado",
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground border-dashed",
    },
    em_andamento: {
      label: "Em Andamento",
      variant: "default" as const,
      className: "bg-blue-100 text-blue-800",
    },
    concluido: {
      label: "Concluído",
      variant: "default" as const,
      className: "bg-emerald-100 text-emerald-800",
    },
    cancelado: {
      label: "Cancelado",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.agendado

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
