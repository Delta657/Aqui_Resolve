"use client"

import { useState } from "react"
import { Menu, Search, Bell, User, LogOut, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Link from "next/link"

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuário'

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Abrir menu lateral"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Campo de Busca */}
          <div className="relative hidden md:block">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Buscar pedidos, clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-72 lg:w-80 h-10 text-sm bg-muted/50 border-border rounded-xl focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              aria-label="Buscar no sistema"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 h-10 px-2 sm:px-3 hover:bg-muted rounded-xl"
                aria-label="Menu do usuário"
              >
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-orange-500/20">
                  {userInitial.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                  {userName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-card border-border shadow-card rounded-xl p-1.5"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-semibold shadow-md shadow-orange-500/20">
                    {userInitial.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link href="/dashboard/configuracoes" className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-muted/50">
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link href="/dashboard/controle/notificacoes" className="flex items-center gap-2 px-3 py-2 text-foreground hover:bg-muted/50">
                  <Bell className="h-4 w-4" />
                  Notificações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
