"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, CheckCircle2, XCircle, Info } from "lucide-react"
import type { ConsentType } from "@/types/lgpd"

interface ConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConsent: (consents: ConsentType[]) => void
  userId: string
  userEmail: string
  privacyPolicyVersion: string
}

const consentTypes: Array<{
  type: ConsentType
  label: string
  description: string
  required: boolean
}> = [
  {
    type: "necessario",
    label: "Dados Necessários",
    description: "Dados essenciais para prestação do serviço",
    required: true,
  },
  {
    type: "contrato",
    label: "Execução de Contrato",
    description: "Dados necessários para execução do contrato de prestação de serviços",
    required: true,
  },
  {
    type: "marketing",
    label: "Marketing e Comunicações",
    description: "Envio de ofertas, promoções e comunicações comerciais",
    required: false,
  },
  {
    type: "analytics",
    label: "Análise e Melhorias",
    description: "Análise de uso do serviço para melhorias e otimizações",
    required: false,
  },
]

export function ConsentModal({
  isOpen,
  onClose,
  onConsent,
  userId,
  userEmail,
  privacyPolicyVersion,
}: ConsentModalProps) {
  const [selectedConsents, setSelectedConsents] = useState<ConsentType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Selecionar automaticamente os consentimentos obrigatórios
      const required = consentTypes
        .filter((c) => c.required)
        .map((c) => c.type)
      setSelectedConsents(required)
    }
  }, [isOpen])

  const handleToggleConsent = (type: ConsentType, required: boolean) => {
    if (required) return // Não permitir desmarcar obrigatórios

    setSelectedConsents((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Registrar cada consentimento
      for (const consentType of selectedConsents) {
        const response = await fetch("/api/lgpd/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            userEmail,
            consentType,
            action: "grant",
            version: privacyPolicyVersion,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao registrar consentimento")
        }
      }

      onConsent(selectedConsents)
      onClose()
    } catch (err: any) {
      setError(err.message || "Erro ao processar consentimentos")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-orange-600" />
            <DialogTitle>Consentimento para Tratamento de Dados</DialogTitle>
          </div>
          <DialogDescription>
            Conforme a Lei Geral de Proteção de Dados (LGPD), precisamos do seu
            consentimento para tratar seus dados pessoais.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você pode revogar seus consentimentos a qualquer momento nas
                configurações de privacidade.
              </AlertDescription>
            </Alert>

            {consentTypes.map((consent) => (
              <div
                key={consent.type}
                className={`p-4 border rounded-lg ${
                  consent.required
                    ? "bg-orange-50 border-orange-200"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={consent.type}
                    checked={selectedConsents.includes(consent.type)}
                    onCheckedChange={() =>
                      handleToggleConsent(consent.type, consent.required)
                    }
                    disabled={consent.required}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor={consent.type}
                        className="font-semibold cursor-pointer"
                      >
                        {consent.label}
                      </Label>
                      {consent.required && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Obrigatório
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {consent.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Base Legal:</strong> Conforme art. 7º da LGPD, o
                tratamento de dados pessoais pode ser realizado mediante
                consentimento do titular, execução de contrato, cumprimento de
                obrigação legal, entre outras bases legais.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Versão da Política:</strong> {privacyPolicyVersion}
              </p>
            </div>
          </div>
        </ScrollArea>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedConsents.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              "Processando..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aceitar e Continuar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


