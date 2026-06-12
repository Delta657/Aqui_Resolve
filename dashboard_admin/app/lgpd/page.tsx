"use client"

import { DataRightsPanel } from "@/components/lgpd/data-rights-panel"
import { useAuth } from "@/components/auth-provider"

export default function LGPDPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Proteção de Dados Pessoais</h1>
        <p className="text-muted-foreground mb-8">
          Gerencie seus dados pessoais e exerça seus direitos conforme a Lei
          Geral de Proteção de Dados (LGPD)
        </p>
        <DataRightsPanel userId={user.uid} userEmail={user.email || ""} />
      </div>
    </div>
  )
}


