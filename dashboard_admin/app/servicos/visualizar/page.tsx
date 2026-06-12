"use client"

import { AppShell } from "@/components/layout/app-shell"
import { ServicesList } from "@/components/services/services-list"
import { useServices } from "@/hooks/use-services"
import { useAnalytics } from "@/hooks/use-analytics"
import { useEffect } from "react"

export default function VisualizarPage() {
  const { services, loading, error, updateServiceStatus, deleteService } = useServices()
  const { trackPageView, trackUserAction } = useAnalytics()

  useEffect(() => {
    trackPageView('Visualizar Serviços')
  }, [trackPageView])

  const handleUpdateStatus = (serviceId: string, newStatus: string) => {
    trackUserAction('atualizar_status_servico', 'servicos', { serviceId, newStatus })
    updateServiceStatus(serviceId, newStatus)
  }

  const handleDelete = (serviceId: string) => {
    trackUserAction('deletar_servico', 'servicos', { serviceId })
    if (confirm('Tem certeza que deseja deletar este serviço?')) {
      deleteService(serviceId)
    }
  }

  const handleView = (serviceId: string) => {
    trackUserAction('visualizar_servico', 'servicos', { serviceId })
    // Implementar visualização detalhada
  }

  const handleEdit = (serviceId: string) => {
    trackUserAction('editar_servico', 'servicos', { serviceId })
    // Implementar edição
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">Lista completa de todos os serviços do sistema</p>
        </div>

        <ServicesList
          services={services}
          loading={loading}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          onView={handleView}
          onEdit={handleEdit}
        />
      </div>
    </AppShell>
  )
}
