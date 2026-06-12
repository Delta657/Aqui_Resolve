"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"

interface RouteGuardProps {
  children: React.ReactNode
  requiredPermission?: keyof import("@/hooks/use-permissions").UserPermissions
  requiredPermissions?: (keyof import("@/hooks/use-permissions").UserPermissions)[]
  fallbackPath?: string
}

export function RouteGuard({ 
  children, 
  requiredPermission, 
  requiredPermissions = [],
  fallbackPath = "/dashboard" 
}: RouteGuardProps) {
  const { hasPermission, loading } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Verificar permissão única
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(fallbackPath)
      return
    }

    // Verificar múltiplas permissões (todas devem ser verdadeiras)
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
      if (!hasAllPermissions) {
        router.push(fallbackPath)
        return
      }
    }
  }, [hasPermission, loading, requiredPermission, requiredPermissions, router, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // Verificar permissões antes de renderizar
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null
  }

  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
    if (!hasAllPermissions) {
      return null
    }
  }

  return <>{children}</>
}
