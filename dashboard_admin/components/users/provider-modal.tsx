"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { listServiceCatalog, type ServiceCatalogItem } from "@/lib/services/service-catalog"
import { FirebaseProvidersService } from "@/lib/services/firebase-providers"
import { MapPin, Phone, Mail, Calendar, ShoppingBag, DollarSign, Star, Shield, Briefcase, Loader2, Search, Sparkles } from "lucide-react"

interface Provider {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  address: string
  serviceCategories: string[]
  experience: string
  isVerified: boolean
  rating: number
  totalOrders: number
  totalEarnings: number
  status: "active" | "inactive" | "pending" | "blocked"
  createdAt: string
}

interface ProviderModalProps {
  provider: Provider | null
  isOpen: boolean
  onClose: () => void
  onUpdated?: () => Promise<void> | void
  onCategoriesUpdated?: (categories: string[]) => void
}

export function ProviderModal({ provider, isOpen, onClose, onUpdated, onCategoriesUpdated }: ProviderModalProps) {
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [savingCategories, setSavingCategories] = useState(false)

  useEffect(() => {
    setSelectedCategories(provider?.serviceCategories ?? [])
  }, [provider])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let cancelled = false

    const loadCatalog = async () => {
      setCatalogLoading(true)
      try {
        const items = await listServiceCatalog()
        if (!cancelled) {
          setCatalog(items)
        }
      } catch (error) {
        console.error("Erro ao carregar catálogo de serviços:", error)
        if (!cancelled) {
          toast.error("Erro ao carregar catálogo de serviços.")
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  const filteredCatalog = useMemo(() => {
    const needle = catalogSearch.trim().toLowerCase()
    if (!needle) {
      return catalog
    }

    return catalog.filter((item) =>
      item.name.toLowerCase().includes(needle) ||
      item.slug.toLowerCase().includes(needle) ||
      item.description.toLowerCase().includes(needle)
    )
  }, [catalog, catalogSearch])

  const hasCategoryChanges = useMemo(() => {
    const current = [...selectedCategories].sort((a, b) => a.localeCompare(b, "pt-BR"))
    const original = [...(provider?.serviceCategories ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR"))

    return current.length !== original.length || current.some((item, index) => item !== original[index])
  }, [provider?.serviceCategories, selectedCategories])

  if (!provider) return null

  const toDisplayText = (value: unknown, fallback = "Nao informado") => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : fallback
    }
    if (typeof value === "number") {
      return String(value)
    }
    return fallback
  }

  const formatDateSafe = (value: unknown) => {
    if (!value) return "Nao informado"

    const date = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(date.getTime())) {
      return "Nao informado"
    }

    return date.toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case "inactive":
        return <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
      case "blocked":
        return <Badge className="bg-red-100 text-red-800">Bloqueado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const handleCategoryToggle = (category: string, checked: boolean) => {
    setSelectedCategories((current) => {
      if (checked) {
        return current.includes(category) ? current : [...current, category]
      }

      return current.filter((item) => item !== category)
    })
  }

  const handleSaveCategories = async () => {
    try {
      setSavingCategories(true)
      await FirebaseProvidersService.updateProviderServiceCategories(provider.id, selectedCategories)
      onCategoriesUpdated?.(selectedCategories)
      await onUpdated?.()
      toast.success("Serviços do prestador atualizados.")
    } catch (error) {
      console.error("Erro ao atualizar serviços do prestador:", error)
      toast.error("Erro ao atualizar serviços do prestador.")
    } finally {
      setSavingCategories(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Perfil do Prestador
              {provider.isVerified && <Shield className="h-4 w-4 text-blue-600" />}
            </div>
            {getStatusBadge(provider.status)}
          </DialogTitle>
          <DialogDescription>Informações detalhadas do prestador de serviços</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-sm">{toDisplayText(provider.name)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPF</label>
                  <p className="text-sm">{toDisplayText(provider.cpf)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{toDisplayText(provider.email)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{toDisplayText(provider.phone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{toDisplayText(provider.address)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Experiência</label>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{toDisplayText(provider.experience)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Avaliação</label>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm">{provider.rating} de 5</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Categorias de Serviço</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.length > 0 ? (
                    selectedCategories.map((category) => (
                      <Badge key={category} variant="outline">
                        {toDisplayText(category)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nao informado</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status de Verificação</label>
                <div className="flex items-center gap-2 mt-1">
                  {provider.isVerified ? (
                    <>
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">Verificado</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Não verificado</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,247,237,0.85),rgba(255,255,255,1))]">
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                    Serviços liberados para este prestador
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A seleção usa o catálogo central do app e grava nos campos compatíveis do documento
                    <code className="mx-1 rounded bg-white/80 px-1.5 py-0.5 text-xs">providers</code>.
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-white/85 px-3 py-2 text-right shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-orange-700">Selecionados</p>
                  <p className="text-2xl font-semibold text-orange-900">{selectedCategories.length}</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Buscar serviço no catálogo do aplicativo"
                  className="border-orange-200 bg-white pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {catalogLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white/80 px-4 py-10">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-600" />
                  <span className="text-sm text-muted-foreground">Carregando catálogo de serviços...</span>
                </div>
              ) : null}

              {!catalogLoading && filteredCatalog.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-orange-200 bg-white/85 px-4 py-10 text-center">
                  <p className="font-medium text-foreground">Nenhum serviço encontrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ajuste a busca ou publique novos serviços em
                    <code className="mx-1 rounded bg-orange-50 px-1.5 py-0.5 text-xs">/dashboard/servicos/catalogo-app</code>.
                  </p>
                </div>
              ) : null}

              {!catalogLoading && filteredCatalog.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredCatalog.map((item) => {
                    const checked = selectedCategories.includes(item.name)

                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                          checked
                            ? "border-orange-400 bg-orange-50 shadow-sm"
                            : "border-border/70 bg-white hover:border-orange-200"
                        } ${!item.active ? "opacity-70" : ""}`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => handleCategoryToggle(item.name, value === true)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">{item.name}</span>
                            <Badge variant={item.active ? "outline" : "secondary"}>
                              {item.active ? "Ativo no app" : "Inativo no app"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description || "Sem descrição cadastrada no catálogo."}
                          </p>
                          <p className="mt-2 font-mono text-xs text-muted-foreground">{item.slug}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : null}
            </CardContent>
            <DialogFooter className="border-t border-orange-200/70 px-6 pb-6 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCategories(provider.serviceCategories)}
                disabled={savingCategories || !hasCategoryChanges}
              >
                Reverter
              </Button>
              <Button
                type="button"
                onClick={handleSaveCategories}
                disabled={savingCategories || !hasCategoryChanges}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {savingCategories ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar serviços do prestador
              </Button>
            </DialogFooter>
          </Card>

          {/* Performance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance na Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cadastrado em</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateSafe(provider.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Pedidos Concluídos</p>
                      <p className="text-sm text-muted-foreground">{provider.totalOrders} pedidos</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Total de Ganhos</p>
                      <p className="text-sm text-muted-foreground">R$ {provider.totalEarnings.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Avaliação Média</p>
                      <p className="text-sm text-muted-foreground">{provider.rating} estrelas</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
