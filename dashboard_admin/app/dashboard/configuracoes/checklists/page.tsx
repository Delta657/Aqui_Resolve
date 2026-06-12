"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChecklistTemplateModal } from "@/components/checklists/checklist-template-modal"
import {
  deleteChecklistTemplate,
  subscribeChecklistTemplates,
  toggleChecklistTemplateStatus,
} from "@/lib/services/firebase-checklists"
import type { ChecklistTemplate } from "@/types/checklist"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CheckSquare,
  ClipboardList,
  Edit,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react"

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

function formatDate(value: unknown): string {
  const d = toDate(value)
  if (!d) return "—"
  return format(d, "dd/MM/yyyy", { locale: ptBR })
}

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterAtivo, setFilterAtivo] = useState<boolean | undefined>(undefined)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ChecklistTemplate | null>(null)

  const [viewTarget, setViewTarget] = useState<ChecklistTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Realtime subscription
  useEffect(() => {
    setLoading(true)
    const unsub = subscribeChecklistTemplates(
      (data) => {
        setTemplates(data)
        setLoading(false)
      },
      (err) => {
        console.error("Checklists:", err)
        toast.error("Erro ao carregar checklists.")
        setLoading(false)
      },
      { ativo: filterAtivo }
    )
    return unsub
  }, [filterAtivo])

  const filtered = templates.filter((t) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      t.nome.toLowerCase().includes(term) ||
      t.descricao?.toLowerCase().includes(term) ||
      t.cliente?.toLowerCase().includes(term) ||
      t.tiposServico.some((s) => s.toLowerCase().includes(term))
    )
  })

  const handleToggleStatus = useCallback(async (t: ChecklistTemplate) => {
    try {
      await toggleChecklistTemplateStatus(t.id, !t.ativo)
      toast.success(`Checklist ${t.ativo ? "desativado" : "ativado"}.`)
    } catch {
      toast.error("Erro ao atualizar status.")
    }
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteBusy(true)
    try {
      await deleteChecklistTemplate(deleteTarget.id)
      toast.success("Checklist removido.")
      setDeleteTarget(null)
    } catch {
      toast.error("Erro ao remover checklist.")
    } finally {
      setDeleteBusy(false)
    }
  }

  const openNew = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const openEdit = (t: ChecklistTemplate) => {
    setEditTarget(t)
    setModalOpen(true)
  }

  const ativos = templates.filter((t) => t.ativo).length
  const totalItens = templates.reduce((acc, t) => acc + (t.itens?.length ?? 0), 0)
  const tiposUnicos = new Set(templates.flatMap((t) => t.tiposServico)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklists</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os templates de checklist operacional para os prestadores
          </p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Novo Checklist
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total"
          value={loading ? "…" : String(templates.length)}
          subtitle="templates cadastrados"
          icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <KpiCard
          title="Ativos"
          value={loading ? "…" : String(ativos)}
          subtitle="em uso pelos prestadores"
          icon={<CheckSquare className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <KpiCard
          title="Tipos de Serviço"
          value={loading ? "…" : String(tiposUnicos)}
          subtitle="categorias cobertas"
          icon={<Filter className="h-5 w-5 text-orange-600" />}
          color="orange"
        />
        <KpiCard
          title="Total de Itens"
          value={loading ? "…" : String(totalItens)}
          subtitle="perguntas configuradas"
          icon={<ShieldCheck className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tipo ou cliente..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterAtivo === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAtivo(undefined)}
          >
            Todos
          </Button>
          <Button
            variant={filterAtivo === true ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAtivo(true)}
          >
            Ativos
          </Button>
          <Button
            variant={filterAtivo === false ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAtivo(false)}
          >
            Inativos
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => setLoading(true)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {search ? "Nenhum checklist encontrado para esta busca." : "Nenhum checklist cadastrado ainda."}
              </p>
              {!search && (
                <Button variant="outline" onClick={openNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro checklist
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipos de Serviço</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Itens</TableHead>
                  <TableHead className="text-center">Obrigatório</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.nome}</p>
                        {t.descricao && (
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {t.descricao}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.tiposServico.slice(0, 2).map((tipo) => (
                          <Badge key={tipo} variant="secondary" className="text-xs">
                            {tipo}
                          </Badge>
                        ))}
                        {t.tiposServico.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{t.tiposServico.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.cliente}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {t.itens?.length ?? 0} itens
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {t.obrigatorio ? (
                        <Badge className="text-xs bg-red-100 text-red-700">Sim</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={t.ativo}
                        onCheckedChange={() => handleToggleStatus(t)}
                        aria-label="Ativar/desativar checklist"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">v{t.versao ?? 1}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setViewTarget(t)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEdit(t)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(t)}
                          title="Remover"
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

      {/* Resumo por tipo */}
      {!loading && templates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Por tipo de serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from(new Set(templates.flatMap((t) => t.tiposServico)))
                .slice(0, 8)
                .map((tipo) => (
                  <div key={tipo} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5">
                    <span className="text-sm">{tipo}</span>
                    <Badge variant="secondary" className="text-xs">
                      {templates.filter((t) => t.tiposServico.includes(tipo)).length}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Por cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from(new Set(templates.map((t) => t.cliente)))
                .slice(0, 8)
                .map((cliente) => (
                  <div key={cliente} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5">
                    <span className="text-sm">{cliente}</span>
                    <Badge variant="secondary" className="text-xs">
                      {templates.filter((t) => t.cliente === cliente).length}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Criar/Editar */}
      <ChecklistTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {}}
        template={editTarget}
      />

      {/* Modal Visualizar */}
      {viewTarget && (
        <ChecklistViewModal
          template={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => {
            openEdit(viewTarget)
            setViewTarget(null)
          }}
        />
      )}

      {/* Confirm delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover checklist?</AlertDialogTitle>
            <AlertDialogDescription>
              O checklist <strong>{deleteTarget?.nome}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBusy ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── KPI Card helper ─────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: "blue" | "green" | "orange" | "purple"
}) {
  const bg = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    orange: "bg-orange-50 border-orange-100",
    purple: "bg-purple-50 border-purple-100",
  }[color]

  return (
    <Card className={`border ${bg}`}>
      <CardContent className="p-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-1">{icon}</div>
      </CardContent>
    </Card>
  )
}

// ─── Modal de visualização ────────────────────────────────────────────────────

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const FASE_LABELS: Record<string, string> = {
  pre_servico: "Pré-serviço",
  execucao: "Durante execução",
  conclusao: "Conclusão",
}

const TIPO_LABELS: Record<string, string> = {
  checkbox: "Caixa de seleção",
  text: "Texto curto",
  textarea: "Texto longo",
  number: "Número",
  select: "Lista (único)",
  multi_select: "Lista (múltipla)",
  photo: "Foto(s)",
  signature: "Assinatura",
  damage_report: "Registro de avaria",
  rating: "Avaliação",
}

function ChecklistViewModal({
  template,
  onClose,
  onEdit,
}: {
  template: ChecklistTemplate
  onClose: () => void
  onEdit: () => void
}) {
  const itemsByFase = {
    pre_servico: template.itens?.filter((i) => i.fase === "pre_servico") ?? [],
    execucao: template.itens?.filter((i) => i.fase === "execucao") ?? [],
    conclusao: template.itens?.filter((i) => i.fase === "conclusao") ?? [],
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{template.nome}</DialogTitle>
              {template.descricao && (
                <p className="text-sm text-muted-foreground mt-1">{template.descricao}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant={template.ativo ? "default" : "secondary"}>
              {template.ativo ? "Ativo" : "Inativo"}
            </Badge>
            {template.obrigatorio && (
              <Badge className="bg-red-100 text-red-700">Obrigatório</Badge>
            )}
            <Badge variant="outline">v{template.versao ?? 1}</Badge>
            <Badge variant="outline">{template.cliente}</Badge>
            {template.tiposServico.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6">
            {(Object.entries(itemsByFase) as [string, typeof itemsByFase.pre_servico][]).map(
              ([fase, itens]) =>
                itens.length > 0 && (
                  <div key={fase}>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {FASE_LABELS[fase]}
                    </p>
                    <div className="space-y-2">
                      {itens.map((item, idx) => (
                        <div key={item.id} className="rounded-lg border px-4 py-3 bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                                <p className="text-sm font-medium">{item.titulo}</p>
                                {item.obrigatorio && (
                                  <Badge className="text-xs bg-red-100 text-red-700 py-0">
                                    Obrigatório
                                  </Badge>
                                )}
                              </div>
                              {item.descricao && (
                                <p className="text-xs text-muted-foreground mt-1 ml-5">
                                  {item.descricao}
                                </p>
                              )}
                              {item.opcoes && item.opcoes.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 ml-5">
                                  {item.opcoes.map((o) => (
                                    <Badge key={o} variant="outline" className="text-xs">
                                      {o}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {TIPO_LABELS[item.tipo] ?? item.tipo}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )}

            {template.itens?.length === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Nenhum item configurado neste checklist.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
