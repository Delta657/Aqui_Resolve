"use client"

import { Key, Trash2, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ProfileSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil
              </CardTitle>
              <CardDescription>
                Os dados de perfil nao sao mais preenchidos com placeholders administrativos.
              </CardDescription>
            </div>
            <Badge variant="outline">Sem fonte real</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Conecte a tela a um usuario autenticado real antes de exibir nome, email, funcao ou data de ingresso.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alteracao de Senha
          </CardTitle>
          <CardDescription>Nenhum fluxo real de troca de senha esta ligado a esta aba.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          O formulario local e os alertas de sucesso foram removidos para evitar falsa persistencia.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Acoes da Conta
          </CardTitle>
          <CardDescription>Operacoes destrutivas permanecem bloqueadas sem backend real.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Exclusao de conta so deve ser habilitada quando existir confirmacao e persistencia reais.
        </CardContent>
      </Card>
    </div>
  )
}
