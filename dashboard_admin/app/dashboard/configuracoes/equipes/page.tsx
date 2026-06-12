"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  UserCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  Upload,
  Eye,
  Users,
  MapPin,
  Phone,
  Mail,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { FirebaseProvidersService, type FirebaseProvider } from "@/lib/services/firebase-providers"
import { isProviderActiveStatus } from "@/lib/providers/status"
import { UsersService } from "@/lib/services/users-service"

type TeamStatus = "ativo" | "inativo"

interface TeamRow {
  id: string
  nome: string
  responsavel: string
  membros: number
  especialidade: string
  filial: string
  telefone: string
  email: string
  status: TeamStatus
}

type RawProvider = FirebaseProvider & Record<string, unknown>

const getStatusColor = (status: TeamStatus) => {
  switch (status) {
    case "ativo":
      return "bg-green-100 text-green-800"
    case "inativo":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getEspecialidadeColor = (especialidade: string) => {
  const normalized = especialidade.toLowerCase()

  if (normalized.includes("el") || normalized.includes("eletrica")) {
    return "bg-yellow-100 text-yellow-800"
  }

  if (normalized.includes("hidr") || normalized.includes("encan")) {
    return "bg-blue-100 text-blue-800"
  }

  if (normalized.includes("emer")) {
    return "bg-red-100 text-red-800"
  }

  if (normalized.includes("prevent")) {
    return "bg-green-100 text-green-800"
  }

  if (normalized.includes("resid")) {
    return "bg-purple-100 text-purple-800"
  }

  if (normalized.includes("comer")) {
    return "bg-orange-100 text-orange-800"
  }

  if (normalized.includes("indust")) {
    return "bg-muted text-muted-foreground"
  }

  if (normalized.includes("espec")) {
    return "bg-pink-100 text-pink-800"
  }

  return "bg-muted text-muted-foreground"
}

const pickString = (provider: RawProvider, keys: string[], fallback: string = ""): string => {
  for (const key of keys) {
    const value = provider[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return fallback
}

const getProviderName = (provider: RawProvider) =>
  pickString(provider, ["nome", "fullName", "displayName", "name"], "Prestador sem nome")

const getProviderPhone = (provider: RawProvider) =>
  pickString(provider, ["telefone", "phone", "phoneNumber"], "Não informado")

const getProviderEmail = (provider: RawProvider) =>
  pickString(provider, ["email"], "Não informado")

const getProviderSpecialties = (provider: RawProvider): string[] => {
  const fromArray = provider.especialidades
  if (Array.isArray(fromArray)) {
    return fromArray
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
  }

  const singular = pickString(provider, ["especialidade", "category", "categoria"], "")
  if (singular) {
    return [singular]
  }

  return ["Geral"]
}

const getProviderBranch = (provider: RawProvider): string => {
  const direct = pickString(provider, ["filial", "branch", "unidade", "regiao", "region"], "")
  if (direct) {
    return direct
  }

  const address = provider.address || provider.endereco

  if (typeof address === "string" && address.trim().length > 0) {
    return address.trim()
  }

  if (address && typeof address === "object") {
    const addressObject = address as Record<string, unknown>
    const city = typeof addressObject.city === "string" ? addressObject.city.trim() : ""
    const state = typeof addressObject.state === "string" ? addressObject.state.trim() : ""

    if (city && state) {
      return `${city} - ${state}`
    }

    if (city) {
      return city
    }
  }

  return "Operação Geral"
}

const getProviderTeamName = (provider: RawProvider): string =>
  pickString(provider, ["equipe", "team", "teamName", "nomeEquipe", "squad"], "")

function buildTeams(providers: RawProvider[]): TeamRow[] {
  const grouped = new Map<
    string,
    {
      teamName: string
      specialty: string
      branch: string
      members: RawProvider[]
    }
  >()

  providers.forEach((providerItem) => {
    const provider = providerItem as RawProvider

    const specialties = getProviderSpecialties(provider)
    const specialty = specialties[0] || "Geral"
    const branch = getProviderBranch(provider)
    const explicitTeamName = getProviderTeamName(provider)

    const groupKey = explicitTeamName
      ? `team:${explicitTeamName.toLowerCase()}`
      : `spec:${specialty.toLowerCase()}|branch:${branch.toLowerCase()}`

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        teamName: explicitTeamName,
        specialty,
        branch,
        members: [],
      })
    }

    grouped.get(groupKey)?.members.push(provider)
  })

  return Array.from(grouped.entries())
    .map(([groupKey, group], index) => {
      const sortedMembers = [...group.members].sort((a, b) => {
        const servicesA = Number(a.totalServicos || 0)
        const servicesB = Number(b.totalServicos || 0)

        if (servicesA !== servicesB) {
          return servicesB - servicesA
        }

        const ratingA = Number(a.avaliacao || 0)
        const ratingB = Number(b.avaliacao || 0)

        return ratingB - ratingA
      })

      const leader = sortedMembers[0]
      const activeMembers = group.members.filter((member) => {
        const status = pickString(member, ["status"], "")
        if (status) {
          return isProviderActiveStatus(status)
        }

        return member.isActive !== false
      }).length

      const generatedTeamName = `Equipe ${group.specialty}`

      return {
        id: groupKey || `team-${index}`,
        nome: group.teamName || generatedTeamName,
        responsavel: getProviderName(leader),
        membros: group.members.length,
        especialidade: group.specialty,
        filial: group.branch,
        telefone: getProviderPhone(leader),
        email: getProviderEmail(leader),
        status: (activeMembers > 0 ? "ativo" : "inativo") as TeamStatus,
      }
    })
    .sort((a, b) => b.membros - a.membros)
}

export default function EquipesPage() {
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | TeamStatus>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [providersFromCollection, providerUsers] = await Promise.all([
        FirebaseProvidersService.getProviders(),
        UsersService.getUsers({ userType: "provider" }),
      ])

      const mergedById = new Map<string, RawProvider>()

      providersFromCollection.forEach((provider) => {
        mergedById.set(provider.id, provider as RawProvider)
      })

      providerUsers.forEach((user) => {
        if (!user?.id) return

        const fallbackProviderShape: RawProvider = {
          ...user,
          id: user.id,
          nome: (user.fullName || user.name || "").trim(),
          telefone: typeof user.phone === "string" ? user.phone : "",
          email: typeof user.email === "string" ? user.email : "",
          status: user.isActive === false ? "offline" : "online",
          localizacao: { lat: 0, lng: 0 },
          ultimaAtualizacao: user.lastLoginAt ?? user.createdAt ?? null,
          servicoAtual: null,
          especialidades: [],
          avaliacao: 0,
          totalServicos: 0,
          ativo: user.isActive !== false,
          createdAt: user.createdAt ?? null,
          updatedAt: user.createdAt ?? null,
        }

        if (!mergedById.has(user.id)) {
          mergedById.set(user.id, fallbackProviderShape)
          return
        }

        // Mantém dados de providers como base e complementa com campos de users.
        const providerData = mergedById.get(user.id) as RawProvider
        mergedById.set(user.id, { ...fallbackProviderShape, ...providerData, ...user })
      })

      setTeams(buildTeams(Array.from(mergedById.values())))
    } catch (err) {
      console.error("Erro ao carregar equipes:", err)
      setError("Não foi possível carregar as equipes no momento.")
      setTeams([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const filteredTeams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return teams.filter((team) => {
      const matchesSearch =
        query.length === 0 ||
        team.nome.toLowerCase().includes(query) ||
        team.responsavel.toLowerCase().includes(query) ||
        team.especialidade.toLowerCase().includes(query) ||
        team.filial.toLowerCase().includes(query) ||
        team.email.toLowerCase().includes(query) ||
        team.telefone.toLowerCase().includes(query)

      const matchesStatus = statusFilter === "all" || team.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [teams, searchTerm, statusFilter])

  const totalMembros = useMemo(
    () => teams.reduce((total, team) => total + team.membros, 0),
    [teams]
  )

  const especialidades = useMemo(
    () => Array.from(new Set(teams.map((team) => team.especialidade))),
    [teams]
  )

  const filiais = useMemo(
    () => Array.from(new Set(teams.map((team) => team.filial))),
    [teams]
  )

  const biggestTeams = useMemo(
    () => [...teams].sort((a, b) => b.membros - a.membros).slice(0, 5),
    [teams]
  )

  const distributionBySpecialty = useMemo(
    () =>
      especialidades.map((especialidade) => ({
        especialidade,
        quantidade: teams.filter((team) => team.especialidade === especialidade).length,
      })),
    [especialidades, teams]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Equipes
          </h1>
          <p className="text-muted-foreground">autem.com.br › configurações › equipes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button size="sm" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Nova Equipe
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Total de Equipes
            </CardTitle>
            <UserCheck className="h-4 w-4" style={{ color: "var(--primary)" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
              {teams.length}
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Equipes consolidadas por dados reais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Total de Membros
            </CardTitle>
            <Users className="h-4 w-4" style={{ color: "var(--success)" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--success)" }}>
              {totalMembros}
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Prestadores vinculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Especialidades
            </CardTitle>
            <Shield className="h-4 w-4" style={{ color: "var(--warning)" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--warning)" }}>
              {especialidades.length}
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Especialidades identificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Filiais
            </CardTitle>
            <MapPin className="h-4 w-4" style={{ color: "var(--info)" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--info)" }}>
              {filiais.length}
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Regiões com cobertura
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant={statusFilter === "ativo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ativo")}
          >
            Ativas
          </Button>
          <Button
            variant={statusFilter === "inativo" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("inativo")}
          >
            Inativas
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTeams} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform"
              style={{ color: "var(--muted-foreground)" }}
            />
            <Input
              placeholder="Buscar equipes..."
              className="w-64 pl-20"
              aria-label="Buscar equipes"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Nova Equipe
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ color: "var(--foreground)" }}>Equipes Cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="ml-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                Carregando dados reais de equipes...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-3 py-14">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchTeams}>
                Tentar novamente
              </Button>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Nenhuma equipe encontrada com os filtros atuais.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: "var(--foreground)" }}>
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead style={{ color: "var(--foreground)" }}>Nome da Equipe</TableHead>
                  <TableHead style={{ color: "var(--foreground)" }}>Responsável</TableHead>
                  <TableHead style={{ color: "var(--foreground)" }}>Membros</TableHead>
                  <TableHead style={{ color: "var(--foreground)" }}>Especialidade</TableHead>
                  <TableHead style={{ color: "var(--foreground)" }}>Filial</TableHead>
                  <TableHead style={{ color: "var(--foreground)" }}>Contato</TableHead>
                  <TableHead style={{ color: "var(--foreground)" }}>Status</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--foreground)" }}>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell className="font-medium" style={{ color: "var(--foreground)" }}>
                      {team.nome}
                    </TableCell>
                    <TableCell style={{ color: "var(--foreground)" }}>{team.responsavel}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{team.membros} membros</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEspecialidadeColor(team.especialidade)}>{team.especialidade}</Badge>
                    </TableCell>
                    <TableCell style={{ color: "var(--foreground)" }}>{team.filial}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                          <span className="text-sm" style={{ color: "var(--foreground)" }}>
                            {team.telefone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                          <span className="text-sm" style={{ color: "var(--foreground)" }}>
                            {team.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(team.status)}>{team.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" disabled title="Visualização detalhada será conectada em breve">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled title="Edição será conectada em breve">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent text-red-600"
                          disabled
                          title="Exclusão será conectada em breve"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Mostrando {filteredTeams.length} de {teams.length} resultado(s)
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            ←
          </Button>
          <Button variant="outline" size="sm" disabled>
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            →
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "var(--foreground)" }}>Distribuição por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {distributionBySpecialty.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Sem dados para distribuição.
                </p>
              ) : (
                distributionBySpecialty.map((item) => (
                  <div key={item.especialidade} className="flex items-center justify-between rounded bg-muted/50 p-2">
                    <span style={{ color: "var(--foreground)" }}>{item.especialidade}</span>
                    <Badge variant="secondary">{item.quantidade}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ color: "var(--foreground)" }}>Maiores Equipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {biggestTeams.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Sem dados para ranking de equipes.
                </p>
              ) : (
                biggestTeams.map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "var(--foreground)" }}>
                          {team.nome}
                        </p>
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                          {team.filial}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{team.membros} membros</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
