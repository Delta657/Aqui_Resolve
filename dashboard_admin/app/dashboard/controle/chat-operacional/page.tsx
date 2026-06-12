"use client"

import { ChatOperationsDashboard } from "@/components/chat/chat-operations-dashboard"
import { Suspense } from "react"

export default function ChatOperacionalPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1700px] px-2 py-4 sm:px-4 sm:py-6">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center text-muted-foreground">Carregando central operacional…</div>
          }
        >
          <ChatOperationsDashboard />
        </Suspense>
      </div>
    </div>
  )
}
