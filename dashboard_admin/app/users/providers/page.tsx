"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { ProvidersTable } from "@/components/users/providers-table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCheck, Users, Shield, RefreshCw } from "lucide-react"
import { PageWithBack } from "@/components/layout/page-with-back"
import { FirebaseProvidersService, type FirebaseProvider } from "@/lib/services/firebase-providers"

const isVerifiedProvider = (provider: FirebaseProvider) => {
  const status = String((provider as any).verificationStatus || "").toLowerCase()
  return ["verificado", "verified", "approved"].includes(status)
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<FirebaseProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await FirebaseProvidersService.getProviders()
      setProviders(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders, refreshKey])

  const stats = useMemo(() => {
    const total = providers.length
    const active = providers.filter((provider) => provider.status !== "offline").length
    const verified = providers.filter(isVerifiedProvider).length
    const inactive = providers.filter((provider) => provider.status === "offline").length

    return { total, active, verified, inactive }
  }, [providers])

  return (
    <AppShell>
      <PageWithBack backButtonLabel="Voltar para Dashboard">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Prestadores</h1>
                <p className="text-sm text-muted-foreground">Lista em tempo real da coleção <code className="text-xs bg-muted px-1 py-0.5 rounded">providers</code></p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRefreshKey((v) => v + 1)} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total",      value: stats.total,    icon: Users,     iconBg: "bg-primary/10",                         iconCl: "text-primary"     },
              { label: "Ativos",     value: stats.active,   icon: UserCheck, iconBg: "bg-emerald-50 dark:bg-emerald-950/40",  iconCl: "text-emerald-600" },
              { label: "Verificados",value: stats.verified, icon: Shield,    iconBg: "bg-blue-50 dark:bg-blue-950/40",        iconCl: "text-blue-600"    },
              { label: "Offline",    value: stats.inactive, icon: RefreshCw, iconBg: "bg-muted",     iconCl: "text-muted-foreground"   },
            ].map(({ label, value, icon: Icon, iconBg, iconCl }) => (
              <Card key={label} className="shadow-card">
                <CardContent className="p-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-1">{value}</p>
                  </div>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconCl}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ProvidersTable key={refreshKey} />
        </div>
      </PageWithBack>
    </AppShell>
  )
}
