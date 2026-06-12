"use client"

import { AppShell } from "@/components/layout/app-shell"
import { PageWithBack } from "@/components/layout/page-with-back"
import { ProviderClassificationDashboard } from "@/components/users/provider-classification-dashboard"

export default function ClassificacaoPrestadoresPage() {
  return (
    <AppShell>
      <PageWithBack backButtonLabel="Voltar para Dashboard">
        <ProviderClassificationDashboard />
      </PageWithBack>
    </AppShell>
  )
}
