"use client"

import { useState, useEffect } from "react"
import { LGPDService } from "@/lib/services/lgpd-service"
import type { ConsentType, Consent } from "@/types/lgpd"

export function useLGPD(userId?: string) {
  const [consents, setConsents] = useState<Consent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasRequiredConsents, setHasRequiredConsents] = useState(false)

  useEffect(() => {
    if (userId) {
      loadConsents()
    }
  }, [userId])

  const loadConsents = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/lgpd/consent?userId=${userId}`)
      const data = await response.json()
      if (data.success) {
        setConsents(data.consents || [])
        checkRequiredConsents(data.consents || [])
      }
    } catch (error) {
      console.error("Erro ao carregar consentimentos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkRequiredConsents = (userConsents: Consent[]) => {
    const requiredTypes: ConsentType[] = ["necessario", "contrato"]
    const activeConsents = userConsents.filter(
      (c) => c.granted && !c.revokedAt
    )
    const hasAllRequired = requiredTypes.every((type) =>
      activeConsents.some((c) => c.consentType === type)
    )
    setHasRequiredConsents(hasAllRequired)
  }

  const grantConsent = async (
    consentType: ConsentType,
    version: string
  ): Promise<boolean> => {
    if (!userId) return false

    setIsLoading(true)
    try {
      const response = await fetch("/api/lgpd/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail: "", // Preencher com email do usuário
          consentType,
          action: "grant",
          version,
        }),
      })

      if (response.ok) {
        await loadConsents()
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao conceder consentimento:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const revokeConsent = async (consentId: string): Promise<boolean> => {
    if (!userId) return false

    setIsLoading(true)
    try {
      const response = await fetch("/api/lgpd/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          consentId,
          action: "revoke",
        }),
      })

      if (response.ok) {
        await loadConsents()
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao revogar consentimento:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const hasConsent = (consentType: ConsentType): boolean => {
    return consents.some(
      (c) =>
        c.consentType === consentType &&
        c.granted &&
        !c.revokedAt
    )
  }

  return {
    consents,
    isLoading,
    hasRequiredConsents,
    grantConsent,
    revokeConsent,
    hasConsent,
    loadConsents,
  }
}


