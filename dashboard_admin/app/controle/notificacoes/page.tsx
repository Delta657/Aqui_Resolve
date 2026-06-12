"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Plus, Eye, Trash2 } from "lucide-react"

const notifications = [
  {
    id: "1",
    titulo: "Novo serviço agendado",
    mensagem: "Serviço #699411371 foi agendado para hoje às 12:00",
    lida: false,
    createdAt: "2025-01-15 10:30",
    tipo: "servico",
  },
  {
    id: "2",
    titulo: "Pagamento em atraso",
    mensagem: "Fatura vencida há 5 dias - Cliente João Silva",
    lida: false,
    createdAt: "2025-01-15 09:15",
    tipo: "financeiro",
  },
  {
    id: "3",
    titulo: "Manutenção programada",
    mensagem: "Veículo ABC-1234 precisa de revisão",
    lida: true,
    createdAt: "2025-01-14 16:45",
    tipo: "manutencao",
  },
]

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case "servico":
      return "bg-blue-100 text-blue-800"
    case "financeiro":
      return "bg-red-100 text-red-800"
    case "manutencao":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function NotificacoesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">autem.com.br › controle › notificações</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Notificação
            </Button>
            <Button variant="outline">Marcar todas como lidas</Button>
          </div>
          <div className="text-sm text-muted-foreground">{notifications.filter((n) => !n.lida).length} não lida(s)</div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.lida ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${notification.lida ? "bg-muted" : "bg-blue-100"}`}>
                      <Bell className={`h-4 w-4 ${notification.lida ? "text-muted-foreground" : "text-blue-600"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${notification.lida ? "text-muted-foreground" : "text-foreground"}`}>
                          {notification.titulo}
                        </h3>
                        <Badge className={getTipoColor(notification.tipo)}>{notification.tipo}</Badge>
                        {!notification.lida && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <p className={`text-sm ${notification.lida ? "text-muted-foreground" : "text-foreground"}`}>
                        {notification.mensagem}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{notification.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 bg-transparent">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
