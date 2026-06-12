"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Shuffle, 
  Filter, 
  RefreshCw, 
  Upload, 
  Search,
  ChevronUp,
  ChevronDown,
  Signal,
  Smartphone,
  Plus,
  Phone
} from "lucide-react"

interface Usuario {
  id: string
  funcionario: string
  viatura: string
  versao: string
  usuario: string
  dispositivo: string
  sdk: number
  ultimoSin: string
  status: 'online' | 'offline'
}

export default function UsuariosPage() {
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  const usuarios: Usuario[] = [
    {
      id: "1",
      funcionario: "JOCIMAR",
      viatura: "JOCIMAR QRI7H24",
      versao: "1.0.206",
      usuario: "jocimarsm",
      dispositivo: "Realme C75",
      sdk: 35,
      ultimoSin: "13/08/2025",
      status: "online"
    },
    {
      id: "2",
      funcionario: "ANTONIO",
      viatura: "ANTONIO OVI9216",
      versao: "1.0.206",
      usuario: "antoniombsh",
      dispositivo: "Samsung Galaxy A15",
      sdk: 35,
      ultimoSin: "13/08/2025",
      status: "online"
    },
    {
      id: "3",
      funcionario: "JOYCE BARBOSA",
      viatura: "MICHEL KYQ4298",
      versao: "1.0.206",
      usuario: "joyceebmv",
      dispositivo: "Samsung Galaxy A15",
      sdk: 35,
      ultimoSin: "12/08/2025",
      status: "online"
    },
    {
      id: "4",
      funcionario: "RAFAEL",
      viatura: "RAFAEL SFT9B12",
      versao: "1.0.206",
      usuario: "rafaelbsk",
      dispositivo: "TCL 40 SE",
      sdk: 33,
      ultimoSin: "12/08/2025",
      status: "online"
    },
    {
      id: "5",
      funcionario: "MICHEL",
      viatura: "",
      versao: "1.0.204",
      usuario: "michelkcsh",
      dispositivo: "Lenovo K13 Pro",
      sdk: 31,
      ultimoSin: "09/07/2025",
      status: "offline"
    },
    {
      id: "6",
      funcionario: "FABRICIO",
      viatura: "",
      versao: "1.0.203",
      usuario: "fabriciosle",
      dispositivo: "HERCLS A15",
      sdk: 34,
      ultimoSin: "17/06/2025",
      status: "offline"
    }
  ]

  const columns = [
    { key: "funcionario", label: "Funcionário", sortable: true },
    { key: "viatura", label: "Viatura", sortable: true },
    { key: "versao", label: "Versão", sortable: true },
    { key: "usuario", label: "Usuário", sortable: true },
    { key: "dispositivo", label: "Dispositivo", sortable: true },
    { key: "sdk", label: "SDK", sortable: true },
    { key: "ultimoSin", label: "Último Sin", sortable: true }
  ]

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
    }
    return sortDirection === "asc" ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  const getStatusIcon = (status: string) => {
    if (status === 'online') {
      return <Signal className="h-4 w-4 text-green-600" />
    }
    return <Signal className="h-4 w-4 text-muted-foreground/60" />
  }

  const getVersaoBadge = (versao: string) => {
    const versaoNum = parseFloat(versao.replace('1.0.', ''))
    if (versaoNum >= 206) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">{versao}</Badge>
    } else {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{versao}</Badge>
    }
  }

  const getUltimoSinBadge = (data: string) => {
    const hoje = new Date()
    const dataUltimo = new Date(data.split('/').reverse().join('-'))
    const diffDias = Math.floor((hoje.getTime() - dataUltimo.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDias <= 1) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">{data}</Badge>
    } else {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{data}</Badge>
    }
  }

  const filteredUsuarios = usuarios.filter(usuario =>
    Object.values(usuario).some(value => 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <main className="flex-1 space-y-6 p-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
            <p className="text-sm text-muted-foreground">
              autem.com.br &gt; controle &gt; autem mobile &gt; usuários
            </p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Informação */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Exibe os profissionais que estão conectados no aplicativo, as viaturas que estão utilizando e a respectiva versão do App que está utilizando.
          </p>
        </CardContent>
      </Card>

      {/* Barra de Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Shuffle className="h-4 w-4 mr-1" />
            Layout
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="PROCURAR"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <Card style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)', borderColor: 'var(--border)' }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left text-sm font-medium text-foreground ${
                        column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario, index) => (
                  <tr
                    key={usuario.id}
                    className={`border-b hover:bg-muted/50/50 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/50'
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(usuario.status)}
                        <span>{usuario.funcionario}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {usuario.viatura || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getVersaoBadge(usuario.versao)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {usuario.usuario}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground/60" />
                        <span>{usuario.dispositivo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {usuario.sdk}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getUltimoSinBadge(usuario.ultimoSin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Botões Flutuantes */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2">
        <Button className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg">
          <Plus className="h-5 w-5" />
        </Button>
        <Button className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          <Phone className="h-5 w-5" />
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-8">
        Copyright © 2025 AutEM v2.2.1 Todos os direitos reservados
      </div>
    </main>
  )
}
