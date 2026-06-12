"use client"

import { usePathname } from "next/navigation"
import { BackButton } from "@/components/ui/back-button"

interface PageWithBackProps {
  children: React.ReactNode
  showBackButton?: boolean
  backButtonLabel?: string
  backButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function PageWithBack({ 
  children, 
  showBackButton = true,
  backButtonLabel,
  backButtonVariant = "outline"
}: PageWithBackProps) {
  const pathname = usePathname()
  
  // Páginas que não devem mostrar o botão de voltar
  const hideBackButtonPages = ['/', '/dashboard', '/login']
  
  // Verificar se deve mostrar o botão de voltar
  const shouldShowBackButton = showBackButton && !hideBackButtonPages.includes(pathname)
  
  // Determinar o label do botão baseado na rota
  const getBackButtonLabel = () => {
    if (backButtonLabel) return backButtonLabel
    
    const routeLabels: Record<string, string> = {
      '/users': 'Voltar para Usuários',
      '/users/clients': 'Voltar para Clientes',
      '/users/providers': 'Voltar para Prestadores',
      '/users/verifications': 'Voltar para Verificações',
      '/orders': 'Voltar para Pedidos',
      '/financial': 'Voltar para Financeiro',
      '/reports': 'Voltar para Relatórios',
      '/settings': 'Voltar para Configurações',
      '/services': 'Voltar para Serviços',
      '/controle': 'Voltar para Controle',
      '/configuracoes': 'Voltar para Configurações'
    }
    
    // Verificar se a rota atual corresponde a alguma das rotas conhecidas
    for (const [route, label] of Object.entries(routeLabels)) {
      if (pathname.startsWith(route)) {
        return label
      }
    }
    
    return 'Voltar'
  }

  return (
    <div className="space-y-6">
      {shouldShowBackButton && (
        <div className="flex items-center gap-4">
          <BackButton 
            label={getBackButtonLabel()}
            variant={backButtonVariant}
          />
          <div className="h-6 w-px bg-border" />
        </div>
      )}
      {children}
    </div>
  )
}
