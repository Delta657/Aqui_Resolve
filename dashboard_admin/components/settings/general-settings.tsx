"use client"

import { Building, Mail, MapPin, Percent } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Configuracoes Gerais
              </CardTitle>
              <CardDescription>
                Esta area so deve exibir dados persistidos. Nenhum cadastro real foi conectado aqui ainda.
              </CardDescription>
            </div>
            <Badge variant="outline">Sem persistencia</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Os campos de empresa, contato e site foram removidos porque estavam preenchidos com valores ficticios.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email e Notificacoes
          </CardTitle>
          <CardDescription>
            Nenhuma configuracao real de SMTP ou remetente foi carregada do backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Conecte uma fonte real antes de habilitar edicao ou exibir parametros de envio.
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Comissoes
            </CardTitle>
            <CardDescription>
              Taxas por categoria nao foram exibidas para evitar valores artificiais em runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            O cadastro de comissoes deve ser ligado a uma colecao real antes de voltar para esta tela.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regioes e Categorias
            </CardTitle>
            <CardDescription>
              Listas locais de categorias e regioes foram removidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Quando houver fonte real, esta aba pode voltar a listar apenas os registros persistidos.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
