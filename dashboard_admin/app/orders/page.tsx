"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useOrderDocumentRealtime } from "@/hooks/use-order-document-realtime"
import { enrichOrderForAdmin } from "@/lib/orders/normalize-order"
import { AppShell } from "@/components/layout/app-shell"
import { OrdersDashboard } from "@/components/orders/orders-dashboard"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrderDetailModal } from "@/components/orders/order-detail-modal"
import { useAnalytics } from "@/hooks/use-analytics"
import { PageWithBack } from "@/components/layout/page-with-back"

/** Telefone do cliente não existe no pedido — buscar na coleção `users` por clientId. */
async function fetchClientPhone(clientId?: string): Promise<string> {
  if (!clientId || !db) return ""
  try {
    const snap = await getDoc(doc(db, "users", clientId))
    if (!snap.exists()) return ""
    const d = snap.data() as Record<string, unknown>
    return String(d.phone ?? d.telefone ?? d.phoneNumber ?? "")
  } catch {
    return ""
  }
}

function OrdersPageContent() {
  const { trackPageView, trackUserAction } = useAnalytics()
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientPhone, setClientPhone] = useState("")

  const liveOrderId = isModalOpen && selectedOrder?.id ? String(selectedOrder.id) : null
  const { order: liveOrder } = useOrderDocumentRealtime(liveOrderId, Boolean(liveOrderId))

  const mergedOrder = useMemo(() => {
    if (!selectedOrder) {
      return null
    }
    // Traduz o schema real → apelidos esperados pelos componentes (valor, endereço,
    // prestador, status operacional...) já com o telefone do cliente resolvido.
    const raw = liveOrder ? { ...selectedOrder, ...liveOrder } : selectedOrder
    return enrichOrderForAdmin(raw, { clientPhone })
  }, [liveOrder, selectedOrder, clientPhone])

  useEffect(() => {
    trackPageView("Gestao de Pedidos")
  }, [trackPageView])

  const handleView = (order: any) => {
    if (!order) {
      return
    }

    trackUserAction("visualizar_pedido", "pedidos", { orderId: String(order.id) })
    setSelectedOrder(order)
    setClientPhone("")
    setIsModalOpen(true)
    // Resolve o telefone do cliente (coleção users) em paralelo.
    const clientId = order.clientId ?? order.clientUid ?? order.userId
    fetchClientPhone(clientId ? String(clientId) : undefined).then(setClientPhone)
  }

  return (
    <AppShell>
      <PageWithBack backButtonLabel="Voltar para Dashboard">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Pedidos</h1>
              <p className="text-sm text-muted-foreground">Todos os pedidos em uma lista com filtros em tempo real</p>
            </div>
          </div>

          <OrdersDashboard />

          <OrdersTable onView={handleView} />
        </div>

        <OrderDetailModal
          order={isModalOpen ? (mergedOrder as any) : null}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode="view"
        />
      </PageWithBack>
    </AppShell>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<main className="p-6">Carregando pedidos...</main>}>
      <OrdersPageContent />
    </Suspense>
  )
}
