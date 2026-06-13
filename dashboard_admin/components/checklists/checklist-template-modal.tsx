"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { createChecklistTemplate, updateChecklistTemplate } from "@/lib/services/firebase-checklists"
import type {
  ChecklistTemplate,
  ChecklistTemplateItem,
  ChecklistItemType,
  ChecklistItemPhase,
} from "@/types/checklist"
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  Camera,
  FileSignature,
  CheckSquare,
  Type,
  AlignLeft,
  Hash,
  List,
  TriangleAlert,
  Star,
} from "lucide-react"

const TIPOS_SERVICO_SUGERIDOS = [
  "CONSERTO MECANICO",
  "REPARO RESIDENCIAL",
  "ASSISTENCIA VEICULAR",
  "INSTALACAO ELETRICA",
  "INSTALACAO HIDRAULICA",
  "LIMPEZA",
  "MANUTENCAO PREVENTIVA",
  "RESGATE VEICULAR",
]

const ITEM_TYPE_LABELS: Record<ChecklistItemType, string> = {
  checkbox: "Caixa de seleção",
  text: "Texto curto",
  textarea: "Texto longo",
  number: "Número",
  select: "Lista de opções (único)",
  multi_select: "Lista de opções (múltipla)",
  photo: "Foto(s)",
  signature: "Assinatura",
  damage_report: "Registro de avaria",
  rating: "Avaliação (estrelas)",
}

const ITEM_TYPE_ICONS: Record<ChecklistItemType, React.ReactNode> = {
  checkbox: <CheckSquare className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  multi_select: <List className="h-4 w-4" />,
  photo: <Camera className="h-4 w-4" />,
  signature: <FileSignature className="h-4 w-4" />,
  damage_report: <TriangleAlert className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
}

const FASE_LABELS: Record<ChecklistItemPhase, string> = {
  pre_servico: "Pré-serviço",
  execucao: "Durante execução",
  conclusao: "Conclusão",
}

interface ItemDraft extends Omit<ChecklistTemplateItem, "id"> {
  id?: string
  _key: string
}

function emptyItem(ordem: number): ItemDraft {
  return {
    _key: crypto.randomUUID?.() ?? `k${Date.now()}`,
    titulo: "",
    tipo: "checkbox",
    fase: "execucao",
    obrigatorio: false,
    ordem,
  }
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  template?: ChecklistTemplate | null
}

export function ChecklistTemplateModal({ open, onClose, onSuccess, template }: Props) {
  const { user } = useAuth()

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [tiposServico, setTiposServico] = useState<string[]>([])
  const [tipoInput, setTipoInput] = useState("")
  const [cliente, setCliente] = useState("TODOS")
  const [ativo, setAtivo] = useState(true)
  const [obrigatorio, setObrigatorio] = useState(false)
  const [itens, setItens] = useState<ItemDraft[]>([emptyItem(0)])
  const [busy, setBusy] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const isEdit = !!template

  useEffect(() => {
    if (open && template) {
      setNome(template.nome)
      setDescricao(template.descricao)
      setTiposServico(template.tiposServico)
      setCliente(template.cliente)
      setAtivo(template.ativo)
      setObrigatorio(template.obrigatorio)
      setItens(
        template.itens.map((item) => ({ ...item, _key: item.id }))
      )
    } else if (open && !template) {
      setNome("")
      setDescricao("")
      setTiposServico([])
      setCliente("TODOS")
      setAtivo(true)
      setObrigatorio(false)
      setItens([emptyItem(0)])
    }
    setExpandedItem(null)
  }, [open, template])

  const addTipoServico = () => {
    const t = tipoInput.trim().toUpperCase()
    if (t && !tiposServico.includes(t)) {
      setTiposServico((prev) => [...prev, t])
    }
    setTipoInput("")
  }

  const removeTipoServico = (tipo: string) =>
    setTiposServico((prev) => prev.filter((t) => t !== tipo))

  const addItem = () => {
    const item = emptyItem(itens.length)
    setItens((prev) => [...prev, item])
    setExpandedItem(item._key)
  }

  const removeItem = (key: string) =>
    setItens((prev) => prev.filter((i) => i._key !== key).map((i, idx) => ({ ...i, ordem: idx })))

  const updateItem = (key: string, patch: Partial<ItemDraft>) =>
    setItens((prev) => prev.map((i) => (i._key === key ? { ...i, ...patch } : i)))

  const moveItem = (key: string, dir: "up" | "down") => {
    setItens((prev) => {
      const arr = [...prev]
      const idx = arr.findIndex((i) => i._key === key)
      if (idx < 0) return arr
      const swap = dir === "up" ? idx - 1 : idx + 1
      if (swap < 0 || swap >= arr.length) return arr
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return arr.map((i, o) => ({ ...i, ordem: o }))
    })
  }

  const handleSubmit = async () => {
    if (!nome.trim()) { toast.error("Informe o nome do checklist."); return }
    if (tiposServico.length === 0) { toast.error("Adicione pelo menos um tipo de serviço."); return }
    if (itens.some((i) => !i.titulo.trim())) { toast.error("Todos os itens precisam ter título."); return }

    setBusy(true)
    try {
      const actorId = user?.uid ?? "admin"

      if (isEdit && template) {
        await updateChecklistTemplate({
          id: template.id,
          nome,
          descricao,
          tiposServico,
          cliente,
          ativo,
          obrigatorio,
          itens: itens.map(({ _key, ...rest }) => rest as Omit<ChecklistTemplateItem, "id"> & { id?: string }),
          actorId,
        })
        toast.success("Checklist atualizado com sucesso.")
      } else {
        await createChecklistTemplate({
          nome,
          descricao,
          tiposServico,
          cliente,
          ativo,
          obrigatorio,
          itens: itens.map(({ _key, ...rest }) => rest as Omit<ChecklistTemplateItem, "id">),
          actorId,
          actorName: user?.displayName ?? undefined,
        })
        toast.success("Checklist criado com sucesso.")
      }
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar checklist.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{isEdit ? "Editar Checklist" : "Novo Checklist"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edite o template de checklist operacional." : "Configure um novo template de checklist para os prestadores."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Dados básicos */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do checklist *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Checklist Reparo Residencial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente / Fornecedor</Label>
                <Input
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="TODOS"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                placeholder="Descreva o objetivo deste checklist..."
              />
            </div>

            {/* Tipos de serviço */}
            <div className="space-y-2">
              <Label>Tipos de serviço *</Label>
              <div className="flex gap-2">
                <Input
                  value={tipoInput}
                  onChange={(e) => setTipoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTipoServico())}
                  placeholder="Ex: REPARO RESIDENCIAL"
                  list="tipos-sugeridos"
                />
                <datalist id="tipos-sugeridos">
                  {TIPOS_SERVICO_SUGERIDOS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <Button type="button" variant="outline" onClick={addTipoServico}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {tiposServico.map((tipo) => (
                  <Badge key={tipo} variant="secondary" className="gap-1">
                    {tipo}
                    <button
                      type="button"
                      onClick={() => removeTipoServico(tipo)}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="obrigatorio" checked={obrigatorio} onCheckedChange={setObrigatorio} />
                <Label htmlFor="obrigatorio">Obrigatório para finalizar serviço</Label>
              </div>
            </div>

            <Separator />

            {/* Itens */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Itens do checklist ({itens.length})</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar item
                </Button>
              </div>

              {itens.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  Nenhum item adicionado. Clique em &quot;Adicionar item&quot; para começar.
                </p>
              )}

              <div className="space-y-2">
                {itens.map((item, idx) => (
                  <ChecklistItemEditor
                    key={item._key}
                    item={item}
                    index={idx}
                    totalItems={itens.length}
                    expanded={expandedItem === item._key}
                    onToggle={() =>
                      setExpandedItem((prev) => (prev === item._key ? null : item._key))
                    }
                    onChange={(patch) => updateItem(item._key, patch)}
                    onRemove={() => removeItem(item._key)}
                    onMoveUp={() => moveItem(item._key, "up")}
                    onMoveDown={() => moveItem(item._key, "down")}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy} className="bg-blue-600 hover:bg-blue-700">
            {busy ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar checklist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Item editor ─────────────────────────────────────────────────────────────

interface ItemEditorProps {
  item: ItemDraft
  index: number
  totalItems: number
  expanded: boolean
  onToggle: () => void
  onChange: (patch: Partial<ItemDraft>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function ChecklistItemEditor({
  item,
  index,
  totalItems,
  expanded,
  onToggle,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ItemEditorProps) {
  const [opcaoInput, setOpcaoInput] = useState("")

  const addOpcao = () => {
    const o = opcaoInput.trim()
    if (o && !(item.opcoes ?? []).includes(o)) {
      onChange({ opcoes: [...(item.opcoes ?? []), o] })
    }
    setOpcaoInput("")
  }

  const removeOpcao = (o: string) =>
    onChange({ opcoes: (item.opcoes ?? []).filter((x) => x !== o) })

  const hasOpcoes = item.tipo === "select" || item.tipo === "multi_select"
  const hasMinFotos = item.tipo === "photo"

  return (
    <div className="rounded-lg border bg-card">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 rounded-lg"
        onClick={onToggle}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground w-5 shrink-0">{index + 1}</span>
        <div className="text-muted-foreground shrink-0">{ITEM_TYPE_ICONS[item.tipo]}</div>
        <span className="flex-1 text-sm font-medium truncate">
          {item.titulo || <span className="text-muted-foreground italic">Sem título</span>}
        </span>
        <Badge variant="outline" className="text-xs shrink-0">
          {FASE_LABELS[item.fase]}
        </Badge>
        {item.obrigatorio && (
          <Badge className="text-xs bg-red-100 text-red-700 shrink-0">Obrigatório</Badge>
        )}
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={index === 0}
            onClick={onMoveUp}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={index === totalItems - 1}
            onClick={onMoveDown}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Título do item *</Label>
              <Input
                value={item.titulo}
                onChange={(e) => onChange({ titulo: e.target.value })}
                placeholder="Ex: Tomada apresenta defeito?"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de resposta</Label>
              <Select
                value={item.tipo}
                onValueChange={(v) => onChange({ tipo: v as ChecklistItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ITEM_TYPE_LABELS) as ChecklistItemType[]).map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      <div className="flex items-center gap-2">
                        {ITEM_TYPE_ICONS[tipo]}
                        {ITEM_TYPE_LABELS[tipo]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fase do serviço</Label>
              <Select
                value={item.fase}
                onValueChange={(v) => onChange({ fase: v as ChecklistItemPhase })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FASE_LABELS) as ChecklistItemPhase[]).map((fase) => (
                    <SelectItem key={fase} value={fase}>
                      {FASE_LABELS[fase]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasMinFotos && (
              <div className="space-y-2">
                <Label>Mínimo de fotos</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={item.minFotos ?? 1}
                  onChange={(e) => onChange({ minFotos: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição / instrução</Label>
            <Textarea
              value={item.descricao ?? ""}
              onChange={(e) => onChange({ descricao: e.target.value })}
              rows={2}
              placeholder="Instrução ou detalhe para o prestador..."
            />
          </div>

          {hasOpcoes && (
            <div className="space-y-2">
              <Label>Opções</Label>
              <div className="flex gap-2">
                <Input
                  value={opcaoInput}
                  onChange={(e) => setOpcaoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOpcao())}
                  placeholder="Digite uma opção e pressione Enter"
                />
                <Button type="button" variant="outline" onClick={addOpcao}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(item.opcoes ?? []).map((o) => (
                  <Badge key={o} variant="secondary" className="gap-1">
                    {o}
                    <button
                      type="button"
                      onClick={() => removeOpcao(o)}
                      className="ml-1 hover:opacity-70"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch
              id={`obrig-${item._key}`}
              checked={item.obrigatorio}
              onCheckedChange={(v) => onChange({ obrigatorio: v })}
            />
            <Label htmlFor={`obrig-${item._key}`}>Resposta obrigatória</Label>
          </div>
        </div>
      )}
    </div>
  )
}
