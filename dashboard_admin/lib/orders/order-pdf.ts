import { jsPDF } from "jspdf"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type {
  ServiceChecklist,
  ChecklistItemResposta,
  FotoServico,
  AvariaPreExistente,
} from "@/types/checklist"
import { deriveStatusFechamento, STATUS_FECHAMENTO_CONFIG } from "@/lib/orders/checklist-closure"

// ─── Helpers de data ──────────────────────────────────────────────────────────

function toDate(v: unknown): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof (v as { toDate?: () => Date }).toDate === "function") {
    const d = (v as { toDate: () => Date }).toDate()
    return d instanceof Date ? d : null
  }
  const p = new Date(String(v))
  return Number.isNaN(p.getTime()) ? null : p
}

function fmtDate(v: unknown, withTime = true): string {
  const d = toDate(v)
  if (!d) return "—"
  return format(d, withTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: ptBR })
}

function money(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function valorResposta(r: ChecklistItemResposta): string {
  const v = r.valor
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "boolean") return v ? "Sim" : "Não"
  if (Array.isArray(v)) return v.join(", ")
  return String(v)
}

// ─── Carregamento de imagem (best-effort, tolera falha de CORS) ────────────────

interface LoadedImage {
  dataUrl: string
  format: "JPEG" | "PNG"
  width: number
  height: number
}

async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const res = await fetch(url, { mode: "cors" })
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve({ w: 0, h: 0 })
      img.src = dataUrl
    })
    const fmt: "JPEG" | "PNG" = /image\/png/i.test(blob.type) ? "PNG" : "JPEG"
    return { dataUrl, format: fmt, width: dims.w || 1, height: dims.h || 1 }
  } catch {
    return null
  }
}

// dataUrl direto (assinaturas já vêm em base64) — só lê dimensões
async function loadDataUrl(dataUrl: string): Promise<LoadedImage | null> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null
  try {
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve({ w: 0, h: 0 })
      img.src = dataUrl
    })
    const fmt: "JPEG" | "PNG" = /^data:image\/png/i.test(dataUrl) ? "PNG" : "JPEG"
    return { dataUrl, format: fmt, width: dims.w || 1, height: dims.h || 1 }
  } catch {
    return null
  }
}

// ─── Geração do documento ──────────────────────────────────────────────────────

const ORANGE: [number, number, number] = [234, 88, 12]
const DARK: [number, number, number] = [17, 24, 39]
const GRAY: [number, number, number] = [107, 114, 128]
const LIGHT: [number, number, number] = [243, 244, 246]

const FASE_RESP_LABEL: Record<string, string> = {
  pre_servico: "Pré-serviço",
  execucao: "Durante a execução",
  conclusao: "Conclusão",
}

const FASE_FOTO_LABEL: Record<string, string> = {
  antes: "Antes",
  durante: "Durante",
  depois: "Depois",
  avaria: "Avaria",
}

export interface OrderPdfData {
  order: Record<string, unknown>
  checklists: ServiceChecklist[]
  validation?: Record<string, unknown> | null
}

export async function buildOrderServicePdf(data: OrderPdfData): Promise<jsPDF> {
  const { order, checklists, validation } = data
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2
  let y = margin

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage()
      y = margin
    }
  }

  const sectionTitle = (title: string) => {
    ensureSpace(12)
    doc.setFillColor(...LIGHT)
    doc.rect(margin, y, contentW, 8, "F")
    doc.setTextColor(...DARK)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(title, margin + 2, y + 5.5)
    y += 11
  }

  const field = (label: string, value: string) => {
    const lines = doc.splitTextToSize(value || "—", contentW - 42)
    const h = Math.max(5, lines.length * 4.4)
    ensureSpace(h)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text(label, margin, y + 3.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...DARK)
    doc.text(lines, margin + 40, y + 3.5)
    y += h + 1.5
  }

  // ── Cabeçalho ──
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageW, 26, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("AquiResolve", margin, 12)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...ORANGE)
  doc.text("ORDEM DE SERVIÇO", margin, 19)
  doc.setTextColor(220, 220, 220)
  doc.setFontSize(9)
  const osId = String(order.id ?? order.numero ?? "—")
  doc.text(`OS #${osId}`, pageW - margin, 12, { align: "right" })
  doc.text(`Emitida em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageW - margin, 18, {
    align: "right",
  })
  y = 32

  // ── Dados do serviço ──
  sectionTitle("Dados do Serviço")
  field("Categoria", String(order.serviceCategory ?? order.categoria ?? "—"))
  field("Descrição", String(order.description ?? order.descricao ?? "—"))
  field("Status", String(order.status ?? "—"))
  field("Valor", money(order.budget ?? order.valor ?? order.price))
  field("Criado em", fmtDate(order.createdAt))
  if (order.completedAt) field("Concluído em", fmtDate(order.completedAt))

  // ── Cliente ──
  sectionTitle("Cliente")
  field("Nome", String(order.clientName ?? order.clienteNome ?? "—"))
  field("Telefone", String(order.clientPhone ?? order.clienteTelefone ?? "—"))
  field("E-mail", String(order.clientEmail ?? order.clienteEmail ?? "—"))
  field(
    "Endereço",
    String(order.location ?? order.address ?? order.endereco ?? "—") +
      (order.city ? ` - ${String(order.city)}` : "") +
      (order.state ? `/${String(order.state)}` : "")
  )

  // ── Prestador ──
  const assigned = order.assignedTechnician as { name?: string; id?: string; team?: string } | undefined
  sectionTitle("Prestador")
  field("Nome", String(assigned?.name ?? order.providerName ?? "—"))
  field("ID", String(assigned?.id ?? order.providerId ?? "—"))
  if (assigned?.team) field("Equipe", String(assigned.team))

  // ── Validação de início ──
  if (validation && validation.code) {
    sectionTitle("Validação de Início de Serviço")
    field("Código do cliente", String(validation.code))
    field("Status", String(validation.status ?? "—"))
    field("Gerado em", fmtDate(validation.generatedAt))
    if (validation.confirmedAt) field("Confirmado em", fmtDate(validation.confirmedAt))
  }

  // ── Checklists ──
  if (checklists.length === 0) {
    sectionTitle("Checklist do Serviço")
    ensureSpace(8)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text("Nenhum checklist preenchido para este serviço.", margin, y + 3)
    y += 8
  }

  for (const cl of checklists) {
    sectionTitle(`Checklist: ${cl.templateNome || "Serviço"}`)
    field("Prestador", String(cl.providerNome ?? "—"))
    field("Status", String(cl.status ?? "—"))
    field("Iniciado em", fmtDate(cl.iniciadoEm))
    field("Concluído em", fmtDate(cl.concluidoEm))
    const sf = deriveStatusFechamento(cl)
    if (sf) field("Desfecho", STATUS_FECHAMENTO_CONFIG[sf].label)
    if (cl.servicosRealizados && cl.servicosRealizados.length > 0)
      field("Serviços realizados", cl.servicosRealizados.join(", "))
    if (cl.avariasPreExistentes) field("Avarias pré-existentes", String(cl.avariasPreExistentes))
    if (cl.motivoNaoConclusao) field("Motivo não conclusão", String(cl.motivoNaoConclusao))
    if (cl.observacoesTecnicas) field("Observações do desfecho", String(cl.observacoesTecnicas))
    if (cl.termoAceite?.aceito) field("Termo de aceite", `Aceito — "${cl.termoAceite.texto}"`)

    // Respostas agrupadas por fase
    const respostas = cl.respostas ?? []
    if (respostas.length > 0) {
      const fases = ["pre_servico", "execucao", "conclusao"]
      for (const fase of fases) {
        const itens = respostas.filter((r) => r.fase === fase)
        if (itens.length === 0) continue
        ensureSpace(8)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor(...ORANGE)
        doc.text(FASE_RESP_LABEL[fase] ?? fase, margin, y + 3)
        y += 6
        for (const r of itens) {
          renderRespostaRow(doc, r, margin, contentW, () => y, (v) => (y = v), ensureSpace)
        }
        y += 1
      }
    }

    // Avarias pré-existentes
    const avarias = cl.avariasPre ?? []
    if (avarias.length > 0) {
      ensureSpace(8)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(...ORANGE)
      doc.text(`Avarias pré-existentes (${avarias.length})`, margin, y + 3)
      y += 6
      for (const a of avarias as AvariaPreExistente[]) {
        const txt = `• ${a.descricao}${a.localização ? ` — ${a.localização}` : ""}`
        const lines = doc.splitTextToSize(txt, contentW - 4)
        ensureSpace(lines.length * 4.2 + 2)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8.5)
        doc.setTextColor(...DARK)
        doc.text(lines, margin + 2, y + 3)
        y += lines.length * 4.2 + 2
      }
    }

    // Fotos
    const fotos = cl.fotos ?? []
    if (fotos.length > 0) {
      y = await renderFotos(doc, fotos, margin, contentW, pageH, () => y, (v) => (y = v))
    }

    // Assinaturas
    y = await renderAssinaturas(doc, cl, margin, contentW, () => y, (v) => (y = v), ensureSpace)
  }

  // ── Rodapé com paginação ──
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.text(
      "AquiResolve — Documento gerado automaticamente. Assinaturas digitais com hash de integridade.",
      margin,
      pageH - 6
    )
    doc.text(`Página ${i} de ${pages}`, pageW - margin, pageH - 6, { align: "right" })
  }

  return doc
}

function renderRespostaRow(
  doc: jsPDF,
  r: ChecklistItemResposta,
  margin: number,
  contentW: number,
  getY: () => number,
  setY: (v: number) => void,
  ensureSpace: (n: number) => void
) {
  const valor = valorResposta(r)
  const titulo = r.titulo || r.itemId
  const tituloLines = doc.splitTextToSize(titulo, contentW - 45)
  const obsLines = r.observacao ? doc.splitTextToSize(`Obs: ${r.observacao}`, contentW - 45) : []
  const h = Math.max(5, tituloLines.length * 4.2 + obsLines.length * 4)
  ensureSpace(h + 1)
  let y = getY()
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(31, 41, 55)
  doc.text(tituloLines, margin + 2, y + 3)
  if (obsLines.length > 0) {
    doc.setTextColor(120, 120, 120)
    doc.text(obsLines, margin + 2, y + 3 + tituloLines.length * 4.2)
  }
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...ORANGE)
  doc.text(valor, margin + contentW, y + 3, { align: "right" })
  setY(y + h + 1)
}

async function renderFotos(
  doc: jsPDF,
  fotos: FotoServico[],
  margin: number,
  contentW: number,
  pageH: number,
  getY: () => number,
  setY: (v: number) => void
): Promise<number> {
  let y = getY()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...ORANGE)
  if (y + 10 > pageH - margin) {
    doc.addPage()
    y = margin
  }
  doc.text(`Registro fotográfico (${fotos.length})`, margin, y + 3)
  y += 6

  const cols = 3
  const gap = 4
  const cellW = (contentW - gap * (cols - 1)) / cols
  const cellH = cellW * 0.75
  let col = 0
  let rowStartY = y

  for (const foto of fotos) {
    const url = foto.thumbnailUrl || foto.url
    const img = await loadImage(url)
    const x = margin + col * (cellW + gap)

    if (col === 0 && y + cellH + 8 > pageH - margin) {
      doc.addPage()
      y = margin
      rowStartY = y
    }

    // moldura
    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(248, 248, 248)
    doc.rect(x, y, cellW, cellH, "FD")

    if (img) {
      const ratio = img.width / img.height || 1.33
      let drawW = cellW - 2
      let drawH = drawW / ratio
      if (drawH > cellH - 2) {
        drawH = cellH - 2
        drawW = drawH * ratio
      }
      const ox = x + (cellW - drawW) / 2
      const oy = y + (cellH - drawH) / 2
      try {
        doc.addImage(img.dataUrl, img.format, ox, oy, drawW, drawH)
      } catch {
        /* ignora imagem inválida */
      }
    } else {
      doc.setFont("helvetica", "italic")
      doc.setFontSize(7)
      doc.setTextColor(...GRAY)
      doc.text("imagem indisponível", x + cellW / 2, y + cellH / 2, { align: "center" })
    }

    // legenda de fase
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(...DARK)
    doc.text(FASE_FOTO_LABEL[foto.fase] ?? foto.fase, x + 1, y + cellH + 4)

    col++
    if (col >= cols) {
      col = 0
      y = y + cellH + 8
      rowStartY = y
    }
  }
  if (col !== 0) {
    y = rowStartY + cellH + 8
  }
  setY(y + 2)
  return y + 2
}

async function renderAssinaturas(
  doc: jsPDF,
  cl: ServiceChecklist,
  margin: number,
  contentW: number,
  getY: () => number,
  setY: (v: number) => void,
  ensureSpace: (n: number) => void
): Promise<number> {
  ensureSpace(40)
  let y = getY()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...ORANGE)
  doc.text("Assinaturas digitais", margin, y + 3)
  y += 7

  const boxW = (contentW - 8) / 2
  const boxH = 30
  const pairs: Array<{ label: string; sig?: ServiceChecklist["assinaturaCliente"] }> = [
    { label: "Cliente", sig: cl.assinaturaCliente },
    { label: "Prestador", sig: cl.assinaturaPrestador },
  ]

  let x = margin
  for (const p of pairs) {
    doc.setDrawColor(210, 210, 210)
    doc.rect(x, y, boxW, boxH)
    if (p.sig?.dataUrl) {
      const img = await loadDataUrl(p.sig.dataUrl)
      if (img) {
        const ratio = img.width / img.height || 2
        let dw = boxW - 8
        let dh = dw / ratio
        if (dh > boxH - 12) {
          dh = boxH - 12
          dw = dh * ratio
        }
        try {
          doc.addImage(img.dataUrl, img.format, x + (boxW - dw) / 2, y + 3, dw, dh)
        } catch {
          /* ignore */
        }
      }
    }
    doc.setDrawColor(120, 120, 120)
    doc.line(x + 6, y + boxH - 8, x + boxW - 6, y + boxH - 8)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...DARK)
    const name = p.sig?.signatoryName || "Não assinado"
    doc.text(`${p.label}: ${name}`, x + 6, y + boxH - 4)
    if (p.sig?.signedAt) {
      doc.setTextColor(...GRAY)
      doc.text(fmtDate(p.sig.signedAt), x + boxW - 6, y + boxH - 4, { align: "right" })
    }
    x += boxW + 8
  }
  setY(y + boxH + 6)
  return y + boxH + 6
}
