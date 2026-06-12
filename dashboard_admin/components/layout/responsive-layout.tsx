"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

interface ResponsiveLayoutProps {
  children: React.ReactNode
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-5">
              <Breadcrumbs />
            </div>
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
