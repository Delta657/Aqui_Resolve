"use client"

import { cn } from "@/lib/utils"
import {
  CheckCircle, Clock, XCircle, User, ShoppingCart,
  DollarSign, Star, MessageSquare, UserCheck, AlertCircle,
} from "lucide-react"
import { useRecentActivities } from "@/hooks/use-recent-activities"

const ACTIVITY_CONFIG: Record<string, { icon: typeof Clock; iconClass: string; dotClass: string }> = {
  order_completed:   { icon: CheckCircle,  iconClass: "text-emerald-600", dotClass: "bg-emerald-500" },
  new_provider:      { icon: UserCheck,    iconClass: "text-blue-600",    dotClass: "bg-blue-500"    },
  order_cancelled:   { icon: XCircle,      iconClass: "text-red-600",     dotClass: "bg-red-500"     },
  payment_received:  { icon: DollarSign,   iconClass: "text-emerald-600", dotClass: "bg-emerald-500" },
  new_order:         { icon: ShoppingCart, iconClass: "text-primary",     dotClass: "bg-primary"     },
  new_client:        { icon: User,         iconClass: "text-violet-600",  dotClass: "bg-violet-500"  },
  rating_received:   { icon: Star,         iconClass: "text-amber-600",   dotClass: "bg-amber-500"   },
  message_received:  { icon: MessageSquare,iconClass: "text-blue-600",    dotClass: "bg-blue-500"    },
  provider_verified: { icon: UserCheck,    iconClass: "text-blue-600",    dotClass: "bg-blue-500"    },
}
const FALLBACK = { icon: Clock, iconClass: "text-muted-foreground", dotClass: "bg-muted-foreground" }

export function RecentActivity() {
  const { activities, loading, error } = useRecentActivities()

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-7 w-7 rounded-full bg-muted animate-skeleton" />
              {i < 4 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-4 flex-1">
              <div className="h-3.5 w-36 rounded bg-muted animate-skeleton mb-1.5" />
              <div className="h-3 w-48 rounded bg-muted animate-skeleton" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Erro ao carregar</p>
        <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhuma atividade</p>
        <p className="text-xs text-muted-foreground mt-1">As atividades aparecerão aqui</p>
      </div>
    )
  }

  const visible = activities.slice(0, 8)

  return (
    <div>
      {/* Timeline */}
      <div className="space-y-0">
        {visible.map((activity, idx) => {
          const cfg = ACTIVITY_CONFIG[activity.type] ?? FALLBACK
          const Icon = cfg.icon
          const isLast = idx === visible.length - 1

          return (
            <div key={activity.id} className="flex gap-3">
              {/* Timeline track */}
              <div className="flex flex-col items-center shrink-0">
                <div className={cn("h-7 w-7 rounded-full flex items-center justify-center bg-muted/80 mt-0.5")}>
                  <Icon className={cn("h-3.5 w-3.5", cfg.iconClass)} aria-hidden />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border min-h-3 my-1" />}
              </div>

              {/* Content */}
              <div className={cn("flex-1 pb-3", isLast && "pb-0")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {activity.title}
                  </p>
                  <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                    {activity.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {activity.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {activities.length > 8 && (
        <div className="mt-3 pt-3 border-t border-border text-center">
          <button className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
            Ver mais {activities.length - 8} atividades
          </button>
        </div>
      )}
    </div>
  )
}
