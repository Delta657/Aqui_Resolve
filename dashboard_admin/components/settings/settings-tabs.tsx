"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "./general-settings"
import { SecuritySettings } from "./security-settings"
import { SystemSettings } from "./system-settings"
import { ProfileSettings } from "./profile-settings"

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="security">Segurança</TabsTrigger>
        <TabsTrigger value="system">Sistema</TabsTrigger>
        <TabsTrigger value="profile">Perfil</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralSettings />
      </TabsContent>

      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>

      <TabsContent value="system">
        <SystemSettings />
      </TabsContent>

      <TabsContent value="profile">
        <ProfileSettings />
      </TabsContent>
    </Tabs>
  )
}
