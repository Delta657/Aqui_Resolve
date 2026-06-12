"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TrendingUp, MessageSquare, Eye, Shield } from "lucide-react"

interface SimpleTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SimpleTabs({ activeTab, onTabChange }: SimpleTabsProps) {
  const tabs = [
    { id: "overview", label: "Visão Geral", icon: TrendingUp },
    { id: "conversations", label: "Conversas", icon: MessageSquare },
    { id: "messages", label: "Mensagens", icon: Eye },
    { id: "logs", label: "Logs Admin", icon: Shield },
  ]

  return (
    <div className="flex space-x-2 bg-card border border-border rounded-lg p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 ${
              activeTab === tab.id 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        )
      })}
    </div>
  )
}
