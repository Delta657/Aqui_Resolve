import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Plus,
  Minus,
  Calendar,
  MapPin,
  Clock,
  MoreHorizontal,
  Edit,
  MessageSquare,
  Navigation,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export default function ServicesLogisticsPage() {
  const appointments = [
    {
      id: "2025073039",
      type: "Agendamento",
      time: "06/08 08:00 às 17:00",
      client: "DOUGLAS KO...",
      description: "Chav. Resid. - Banestes",
      location: "Via Velha - Es (Coqueral De Itaparica)",
      status: "acionado",
      professional: "Jocimar",
      professionalCode: "JOCIMAR QR/TH24",
      delay: "Atrasado",
      delayTime: "8211 min",
      distance: "0 km",
    },
    {
      id: "48865019/1",
      type: "Agendamento",
      time: "07/08 08:00 às 11:30",
      client: "ROSCIO SCO...",
      description: "Rep. Resid. - Alliance",
      location: "Serra - Es (Manoel Plaza)",
      status: "aguardando",
      professional: "Não informado",
      professionalCode: "",
      delay: "Não Informado",
      delayTime: "7101 min",
      distance: "0 km",
    },
    {
      id: "69941137/1",
      type: "Agendamento",
      time: "12/08 08:00 às 12:00",
      client: "CELSO CLAU...",
      description: "Rep. Resid. - Bb Seguros",
      location: "Vitoria - Espir... (Jardim Da Penha)",
      status: "aceito",
      professional: "Rafael",
      professionalCode: "RAFAEL SFT9612",
      delay: "A tempo",
      delayTime: "129 min",
      distance: "0 km",
    },
    {
      id: "69879749/4",
      type: "Agendamento",
      time: "12/08 08:00 às 12:00",
      client: "KELISSON C...",
      description: "Rep. Resid. - Caixa Vida",
      location: "Vila Velha - Es... (Praia De Itaparica)",
      status: "aceito",
      professional: "Jocimar",
      professionalCode: "JOCIMAR QR/TH24",
      delay: "A tempo",
      delayTime: "129 min",
      distance: "0 km",
    },
    {
      id: "69909477/1",
      type: "Agendamento",
      time: "12/08 13:00 às 17:00",
      client: "MARIA DA P...",
      description: "Rep. Resid. - Caixa Vida",
      location: "Afonso Claudio... (Centro)",
      status: "aguardando",
      professional: "Não informado",
      professionalCode: "",
      delay: "A tempo",
      delayTime: "429 min",
      distance: "0 km",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aceito":
        return <Badge className="bg-green-500 text-white">ACEITO</Badge>
      case "acionado":
        return <Badge className="bg-blue-500 text-white">ACEITO</Badge>
      case "aguardando":
        return <Badge className="bg-muted-foreground text-background">NÃO ENVIADO</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aceito":
      case "acionado":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "aguardando":
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel Logístico</h1>
          <p className="text-muted-foreground">autem.com.br › serviços › painel logístico</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-muted p-2 rounded">
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="bg-orange-500 text-white hover:bg-orange-600">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <MapPin className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium">PROTOCOLO</div>
        <div className="flex-1 max-w-sm">
          <Input placeholder="BUSCA RÁPIDA" className="bg-background" />
        </div>
      </div>

      {/* Service Count */}
      <div className="text-right text-sm text-muted-foreground">5 SERVIÇO(S)</div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.map((appointment, index) => (
          <Card key={appointment.id} className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Status Icon */}
                <div className="col-span-1 flex justify-center">{getStatusIcon(appointment.status)}</div>

                {/* Appointment Info */}
                <div className="col-span-2">
                  <div className="font-medium text-sm">{appointment.type}</div>
                  <div className="text-xs text-muted-foreground">{appointment.time}</div>
                </div>

                {/* Client & Description */}
                <div className="col-span-2">
                  <div className="font-medium text-sm">{appointment.client}</div>
                  <div className="text-xs text-muted-foreground">{appointment.description}</div>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <div className="text-sm">{appointment.location}</div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex gap-1">
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Badge */}
                <div className="col-span-1">{getStatusBadge(appointment.status)}</div>

                {/* Professional Info */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{appointment.professional}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{appointment.professionalCode}</div>
                </div>

                {/* Timing Info */}
                <div className="col-span-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-xs">
                      <div
                        className={`font-medium ${appointment.delay === "Atrasado" ? "text-red-500" : "text-green-500"}`}
                      >
                        {appointment.delay}
                      </div>
                      <div className="text-muted-foreground">{appointment.delayTime}</div>
                      <div className="text-muted-foreground">{appointment.distance}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
