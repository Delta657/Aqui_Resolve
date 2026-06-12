"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2, Mail, MessageCircle } from "lucide-react"
import { storage } from "@/lib/firebase"
import { getServiceChecklists, getServiceValidation } from "@/lib/services/firebase-checklists"
import { buildOrderServicePdf } from "@/lib/orders/order-pdf"

interface Props {
  order: Record<string, unknown>
}

function onlyDigits(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "")
}

export function OrderPdfActions({ order }: Props) {
  const [busy, setBusy] = useState<null | "download" | "whatsapp" | "email" | "preview">(null)
  const orderId = String(order.id ?? "")

  async function buildDoc() {
    const [checklists, validation] = await Promise.all([
      getServiceChecklists(orderId).catch(() => []),
      getServiceValidation(orderId).catch(() => null),
    ])
    return buildOrderServicePdf({ order, checklists, validation })
  }

  async function uploadAndGetUrl(blob: Blob): Promise<string> {
    if (!storage) throw new Error("Storage indisponível")
    const path = `ordens-servico/${orderId}/OS-${orderId}-${Date.now()}.pdf`
    const fileRef = ref(storage, path)
    await uploadBytes(fileRef, blob, { contentType: "application/pdf" })
    return getDownloadURL(fileRef)
  }

  const handleDownload = async () => {
    setBusy("download")
    try {
      const doc = await buildDoc()
      doc.save(`OS-${orderId}.pdf`)
      toast.success("PDF da OS gerado.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar PDF.")
    } finally {
      setBusy(null)
    }
  }

  const handlePreview = async () => {
    setBusy("preview")
    try {
      const doc = await buildDoc()
      const url = doc.output("bloburl")
      window.open(url, "_blank")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar PDF.")
    } finally {
      setBusy(null)
    }
  }

  const handleWhatsApp = async () => {
    setBusy("whatsapp")
    try {
      const doc = await buildDoc()
      const blob = doc.output("blob")
      const url = await uploadAndGetUrl(blob)
      const phone = onlyDigits(order.clientPhone ?? order.clienteTelefone)
      const phonePart = phone ? (phone.startsWith("55") ? phone : `55${phone}`) : ""
      const text = encodeURIComponent(
        `Olá! Segue a Ordem de Serviço AquiResolve (OS #${orderId}):\n${url}`
      )
      window.open(`https://wa.me/${phonePart}?text=${text}`, "_blank")
      toast.success("Link da OS pronto para envio no WhatsApp.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao compartilhar no WhatsApp.")
    } finally {
      setBusy(null)
    }
  }

  const handleEmail = async () => {
    setBusy("email")
    try {
      const doc = await buildDoc()
      const blob = doc.output("blob")
      const url = await uploadAndGetUrl(blob)
      const to = String(order.clientEmail ?? order.clienteEmail ?? "")
      const subject = encodeURIComponent(`Ordem de Serviço AquiResolve - OS #${orderId}`)
      const body = encodeURIComponent(
        `Olá,\n\nSegue o link da Ordem de Serviço referente ao atendimento (OS #${orderId}):\n${url}\n\nAtenciosamente,\nEquipe AquiResolve`
      )
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
      toast.success("E-mail preparado com o link da OS.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao compartilhar por e-mail.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
      <Button type="button" size="sm" onClick={handleDownload} disabled={busy !== null} className="w-full bg-orange-600 hover:bg-orange-700 xl:w-auto">
        {busy === "download" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        Baixar PDF
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={handlePreview} disabled={busy !== null} className="w-full xl:w-auto">
        {busy === "preview" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        Visualizar
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={handleWhatsApp} disabled={busy !== null} className="w-full border-green-300 text-green-700 hover:bg-green-50 xl:w-auto">
        {busy === "whatsapp" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
        WhatsApp
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={handleEmail} disabled={busy !== null} className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 xl:w-auto">
        {busy === "email" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
        E-mail
      </Button>
    </div>
  )
}
