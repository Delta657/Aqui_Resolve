import { AlertCircle, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Relatorios Financeiros
        </h1>
        <p className="text-muted-foreground">
          Esta area nao exibe mais relatórios, downloads e agendamentos ficticios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fonte real obrigatoria
          </CardTitle>
          <CardDescription>
            Use a central de relatorios alimentada por dados reais enquanto esta pagina nao tiver backend proprio.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Os cards de volume, listas de arquivos, periodos fixos e agendamentos automáticos foram removidos para evitar
          exibicao de dados artificiais em runtime.
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-6 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
          <p>
            Nenhum relatório financeiro real foi vinculado a esta rota. Quando houver fonte persistida, a tela deve
            listar apenas documentos realmente gerados.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
