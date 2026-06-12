import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, RefreshCw, Settings, Info } from "lucide-react"

export default function ServicesViewPage() {
  const services = [
    {
      date: "12/08/2025 12:00",
      company: "USS TEMPO",
      protocol: "69941137/1",
      cnpj: "43.246.176/0001-30",
      vehicle: "",
      plate: "",
      beneficiary: "CELSO CLAUDIO BUSATO AVILA",
      phone: "---",
      city: "VITORIA - ESPIRITO SANTO",
      district: "",
      neighborhood: "",
      address: "",
    },
    {
      date: "12/08/2025 12:00",
      company: "USS TEMPO",
      protocol: "69879749/4",
      cnpj: "43.246.176/0001-30",
      vehicle: "",
      plate: "",
      beneficiary: "KELISSON COSTA DE FARIAS",
      phone: "---",
      city: "VILA VELHA - ESPIRITO SANTO",
      district: "",
      neighborhood: "",
      address: "",
    },
    {
      date: "12/08/2025 12:00",
      company: "USS TEMPO",
      protocol: "69919296/1",
      cnpj: "43.246.176/0001-30",
      vehicle: "",
      plate: "",
      beneficiary: "JANDERSON DOS SANTOS MANUEL",
      phone: "---",
      city: "SERRA - ESPIRITO SANTO",
      district: "",
      neighborhood: "",
      address: "",
    },
    {
      date: "12/08/2025 17:00",
      company: "USS TEMPO",
      protocol: "69909477/15",
      cnpj: "43.246.176/0001-30",
      vehicle: "",
      plate: "",
      beneficiary: "MARIA DA PENHA REBULI",
      phone: "---",
      city: "AFONSO CLAUDIO - ESPIRITO SANTO",
      district: "",
      neighborhood: "",
      address: "",
    },
    {
      date: "12/08/2025 17:00",
      company: "USS TEMPO",
      protocol: "69909477/16",
      cnpj: "43.246.176/0001-30",
      vehicle: "",
      plate: "",
      beneficiary: "MARIA DA PENHA REBULI",
      phone: "---",
      city: "AFONSO CLAUDIO - ESPIRITO SANTO",
      district: "",
      neighborhood: "",
      address: "",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">autem.com.br › serviços › visualizar</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input placeholder="PROCURAR" className="pl-20" />
          </div>
        </div>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data e Hora</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Empresa</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Protocolo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">CNPJ</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Veículo / Objeto</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Placa</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Renavam</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Beneficiário</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Senha</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">O. Cidade</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">D. Cidade</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">D. Logradouro</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">D. Bairro</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">D. Endereço</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm">{service.date}</td>
                    <td className="p-3 text-sm">{service.company}</td>
                    <td className="p-3 text-sm text-blue-600">{service.protocol}</td>
                    <td className="p-3 text-sm">{service.cnpj}</td>
                    <td className="p-3 text-sm">{service.vehicle}</td>
                    <td className="p-3 text-sm">{service.plate}</td>
                    <td className="p-3 text-sm">---</td>
                    <td className="p-3 text-sm">{service.beneficiary}</td>
                    <td className="p-3 text-sm">---</td>
                    <td className="p-3 text-sm">{service.phone}</td>
                    <td className="p-3 text-sm">{service.city}</td>
                    <td className="p-3 text-sm"></td>
                    <td className="p-3 text-sm"></td>
                    <td className="p-3 text-sm"></td>
                    <td className="p-3 text-sm"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 text-sm text-muted-foreground border-t">Mostrando de 1 até 5 de 5 resultado(s)</div>
        </CardContent>
      </Card>
    </div>
  )
}
