import { AdminLayout } from "@/components/layout/admin-layout"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie configurações gerais, segurança e preferências da plataforma</p>
        </div>

        <SettingsTabs />
      </div>
    </AdminLayout>
  )
}
