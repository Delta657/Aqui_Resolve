"use client"

import { ChatDashboard } from "@/components/chat/chat-dashboard"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

function ChatPageContent() {
  const searchParams = useSearchParams()
  const protocolo = searchParams.get('protocolo')
  const servicoId = searchParams.get('servico')
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  return (
    <ChatDashboard 
      initialProtocolo={protocolo} 
      initialServicoId={servicoId}
      initialOrderId={orderId}
    />
  )
}

export default function ChatMonitoringPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] px-2 py-4 sm:px-4 sm:py-6">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando chat...</p>
            </div>
          </div>
        }>
          <ChatPageContent />
        </Suspense>
      </div>
    </div>
  )
}
