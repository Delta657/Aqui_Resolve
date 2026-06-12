"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  FirebaseProvidersService,
  type FirebaseProvider,
} from "@/lib/services/firebase-providers"
import {
  aggregateByCategory,
  UNCATEGORIZED_LABEL,
  type ClassificationRow,
} from "@/lib/services/provider-classification"
import {
  Layers,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const CHART_COLORS = [
  "#ea580c",
  "#c2410c",
  "#f97316",
  "#fb923c",
  "#fdba74",
  "#9a3412",
  "#7c2d12",
]

function isVerifiedProvider(provider: FirebaseProvider) {
  const status = String(provider.verificationStatus || "").toLowerCase()
  return ["verificado", "verified", "approved"].includes(status)
}

type SortKey = "category" | "count" | "percent"
type SortDir = "asc" | "desc"

const NAME_PREVIEW = 6

function ProviderNamesCell({ row }: { row: ClassificationRow }) {
  const list = row.providers
  const [open, setOpen] = useState(false)

  if (list.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const preview = list.slice(0, NAME_PREVIEW)
  const rest = list.slice(NAME_PREVIEW)
  const hasMore = rest.length > 0

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full max-w-md min-w-[200px]">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5",
          open && list.length > 12 && "max-h-56 overflow-y-auto rounded-md border border-border/60 bg-muted/25 p-2 sm:max-h-72"
        )}
      >
        {(open ? list : preview).map((p) => (
          <Badge
            key={p.id}
            variant="secondary"
            className="max-w-[220px] shrink-0 truncate font-normal normal-case"
            title={p.nome}
          >
            {p.nome}
          </Badge>
        ))}
      </div>
      {hasMore && (
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1.5 h-8 gap-1 px-2 text-xs text-orange-700 hover:bg-orange-100/80 hover:text-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
              aria-hidden
            />
            {open ? "Ver menos" : `Ver mais ${rest.length} (${list.length} no total)`}
          </Button>
        </CollapsibleTrigger>
      )}
      {hasMore && (
        <CollapsibleContent>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Lista em ordem alfabética. O mesmo prestador pode aparecer em outras linhas se tiver mais de
            uma especialidade.
          </p>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export function ProviderClassificationDashboard() {
  const [providers, setProviders] = useState<FirebaseProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "verified">("all")
  const [sortKey, setSortKey] = useState<SortKey>("count")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await FirebaseProvidersService.getProviders()
      setProviders(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar prestadores")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      if (filter === "active") return p.status !== "offline"
      if (filter === "verified") return isVerifiedProvider(p)
      return true
    })
  }, [providers, filter])

  const { rows, totalProviders } = useMemo(
    () => aggregateByCategory(filteredProviders),
    [filteredProviders]
  )

  const searchedRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.category.toLowerCase().includes(q) ||
        r.providers.some((p) => p.nome.toLowerCase().includes(q))
    )
  }, [rows, search])

  const sortedRows = useMemo(() => {
    const copy = [...searchedRows]
    const dir = sortDir === "asc" ? 1 : -1
    copy.sort((a, b) => {
      if (a.category === UNCATEGORIZED_LABEL) return 1
      if (b.category === UNCATEGORIZED_LABEL) return -1
      if (sortKey === "category") {
        return dir * a.category.localeCompare(b.category, "pt-BR")
      }
      if (sortKey === "count") {
        return dir * (a.count - b.count)
      }
      return dir * (a.percentOfProviders - b.percentOfProviders)
    })
    return copy
  }, [searchedRows, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "category" ? "asc" : "desc")
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" aria-hidden />
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5" aria-hidden />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5" aria-hidden />
    )
  }

  const distinctCategories = useMemo(() => {
    return rows.filter((r) => r.category !== UNCATEGORIZED_LABEL).length
  }, [rows])

  const uncategorizedCount = useMemo(() => {
    const row = rows.find((r) => r.category === UNCATEGORIZED_LABEL)
    return row?.count ?? 0
  }, [rows])

  const chartData = useMemo(() => {
    const top = sortedRows.slice(0, 12)
    const rest = sortedRows.slice(12)
    const restSum = rest.reduce((acc, r) => acc + r.count, 0)
    const base = top.map((r) => ({ name: r.category, count: r.count }))
    if (restSum > 0) {
      base.push({ name: `Outros (${rest.length})`, count: restSum })
    }
    return base
  }, [sortedRows])

  const maxCount = useMemo(() => {
    return sortedRows.reduce((m, r) => Math.max(m, r.count), 0) || 1
  }, [sortedRows])

  if (loading && providers.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Classificação por serviço
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Dados lidos diretamente da coleção <span className="font-mono text-xs">providers</span> no
            Firestore (especialidades, serviços, categorias e mapas de nichos). Categorias com o mesmo
            nome (acentos/caixa) são unificadas. Um prestador em várias categorias conta em cada linha. A
            busca também filtra pelo nome do prestador.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={loading}
          className="shrink-0 gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-orange-200/60 bg-orange-50/80 dark:border-orange-900/40 dark:bg-orange-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prestadores no filtro
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalProviders}</div>
            <p className="text-xs text-muted-foreground">Base para os totais da tabela</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias distintas
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{distinctCategories}</div>
            <p className="text-xs text-muted-foreground">Sem contar &quot;{UNCATEGORIZED_LABEL}&quot;</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sem categoria
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{uncategorizedCount}</div>
            <p className="text-xs text-muted-foreground">Sem especialidade reconhecida</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cadastro geral
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{providers.length}</div>
            <p className="text-xs text-muted-foreground">Total na base (ignora filtro)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="space-y-4 border-b bg-muted/30 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Planilha de classificação</CardTitle>
              <CardDescription>
                Toque nos cabeçalhos para ordenar. Em telas pequenas, deslize horizontalmente para ver
                todas as colunas.
              </CardDescription>
            </div>
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
              className="w-full lg:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 lg:inline-flex lg:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm">
                  Ativos
                </TabsTrigger>
                <TabsTrigger value="verified" className="text-xs sm:text-sm">
                  Verificados
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por categoria ou nome do prestador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma categoria encontrada para este filtro ou busca.
            </p>
          ) : (
            <div className="relative">
              <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
                <Table className="min-w-[960px] text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-12 text-center font-semibold text-foreground">#</TableHead>
                      <TableHead className="min-w-[180px] font-semibold text-foreground">
                        <button
                          type="button"
                          onClick={() => toggleSort("category")}
                          className="inline-flex items-center rounded-md px-1 py-0.5 hover:bg-muted/80"
                        >
                          Categoria / serviço
                          <SortIcon column="category" />
                        </button>
                      </TableHead>
                      <TableHead className="w-28 text-right font-semibold text-foreground">
                        <button
                          type="button"
                          onClick={() => toggleSort("count")}
                          className="inline-flex w-full items-center justify-end rounded-md px-1 py-0.5 hover:bg-muted/80"
                        >
                          Quantidade
                          <SortIcon column="count" />
                        </button>
                      </TableHead>
                      <TableHead className="min-w-[260px] font-semibold text-foreground">
                        Prestadores nesta categoria
                      </TableHead>
                      <TableHead className="w-28 text-right font-semibold text-foreground">
                        <button
                          type="button"
                          onClick={() => toggleSort("percent")}
                          className="inline-flex w-full items-center justify-end rounded-md px-1 py-0.5 hover:bg-muted/80"
                        >
                          % do filtro
                          <SortIcon column="percent" />
                        </button>
                      </TableHead>
                      <TableHead className="min-w-[160px] font-semibold text-foreground">
                        Distribuição relativa
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((row, index) => (
                      <TableRow
                        key={row.rowKey}
                        className={cn(
                          "transition-colors",
                          row.category === UNCATEGORIZED_LABEL && "bg-amber-50/50 dark:bg-amber-950/20"
                        )}
                      >
                        <TableCell className="text-center tabular-nums text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="align-middle font-medium leading-snug">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{row.category}</span>
                            {row.category === UNCATEGORIZED_LABEL && (
                              <Badge variant="outline" className="text-[10px] font-normal">
                                revisar cadastro
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-foreground">
                          {row.count}
                        </TableCell>
                        <TableCell className="align-top text-muted-foreground">
                          <ProviderNamesCell row={row} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.percentOfProviders}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 pr-1">
                            <Progress
                              value={(row.count / maxCount) * 100}
                              className="h-2 flex-1"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={2} className="font-medium text-muted-foreground">
                        Resumo
                      </TableCell>
                      <TableCell colSpan={4} className="text-right text-sm text-muted-foreground">
                        <span className="tabular-nums">{sortedRows.length}</span> categorias ·{" "}
                        <span className="tabular-nums">{totalProviders}</span> prestador(es) no filtro
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
              <p className="border-t bg-muted/20 px-4 py-2 text-center text-[11px] text-muted-foreground sm:hidden">
                ← Deslize para ver todas as colunas →
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && sortedRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gráfico rápido</CardTitle>
            <CardDescription>Até 12 categorias; demais agrupadas em &quot;Outros&quot;.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[min(380px,55vh)] w-full min-h-[260px] rounded-lg border bg-muted/15 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={118}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(value: number) => [`${value} prestador(es)`, "Quantidade"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={26}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
