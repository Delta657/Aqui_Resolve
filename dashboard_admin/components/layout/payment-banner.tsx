"use client"

import { useState } from "react"
import { AlertTriangle, X, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PaymentBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-orange-500 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex items-center space-x-4">
            <span className="font-medium">Pagamento em aberto!</span>
            <Button
              variant="outline"
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 border-orange-400 text-white"
            >
              Visualizar Faturas
            </Button>
            <a
              href="mailto:financeiro@satellitus.com"
              className="flex items-center space-x-1 text-orange-100 hover:text-white transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>financeiro@satellitus.com</span>
            </a>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-orange-100 hover:text-white hover:bg-orange-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
