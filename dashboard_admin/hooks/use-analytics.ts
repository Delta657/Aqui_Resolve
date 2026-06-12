"use client"

import { useEffect, useState } from 'react'
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics'
import { analytics } from '@/lib/firebase'
import { useAuth } from '@/components/auth-provider'

interface AnalyticsEvent {
  eventName: string
  parameters?: Record<string, any>
}

export function useAnalytics() {
  const { user } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Verificar se o analytics está disponível
    if (analytics) {
      setIsReady(true)
      
      // Configurar usuário se estiver logado
      if (user) {
        setUserId(analytics, user.uid)
        setUserProperties(analytics, {
          user_type: user.email?.includes('@admin') ? 'admin' : 'user',
          login_method: 'email'
        })
      }
    }
  }, [user])

  const trackEvent = ({ eventName, parameters = {} }: AnalyticsEvent) => {
    if (!analytics || !isReady) {
      return
    }

    try {
      logEvent(analytics, eventName, {
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        ...parameters
      })
      console.log(`📊 Evento rastreado: ${eventName}`, parameters)
    } catch (error) {
      console.error('Erro ao rastrear evento:', error)
    }
  }

  // Eventos específicos do dashboard
  const trackPageView = (pageName: string) => {
    trackEvent({
      eventName: 'page_view',
      parameters: {
        page_name: pageName,
        page_title: document.title
      }
    })
  }

  const trackUserAction = (action: string, category: string, value?: number | Record<string, unknown>) => {
    trackEvent({
      eventName: 'user_action',
      parameters: {
        action,
        category,
        ...(typeof value === 'number' ? { value } : value)
      }
    })
  }

  const trackBusinessEvent = (eventType: string, data: Record<string, any>) => {
    trackEvent({
      eventName: 'business_event',
      parameters: {
        event_type: eventType,
        ...data
      }
    })
  }

  const trackFinancialAction = (action: string, amount?: number, currency = 'BRL') => {
    trackEvent({
      eventName: 'financial_action',
      parameters: {
        action,
        amount,
        currency
      }
    })
  }

  const trackOrderAction = (action: string, orderId?: string, status?: string) => {
    trackEvent({
      eventName: 'order_action',
      parameters: {
        action,
        order_id: orderId,
        status
      }
    })
  }

  const trackProviderAction = (action: string, providerId?: string, status?: string) => {
    trackEvent({
      eventName: 'provider_action',
      parameters: {
        action,
        provider_id: providerId,
        status
      }
    })
  }

  const trackReportGenerated = (reportType: string, filters?: Record<string, any>) => {
    trackEvent({
      eventName: 'report_generated',
      parameters: {
        report_type: reportType,
        filters: JSON.stringify(filters)
      }
    })
  }

  const trackError = (error: string, context?: string) => {
    trackEvent({
      eventName: 'error_occurred',
      parameters: {
        error_message: error,
        context,
        severity: 'error'
      }
    })
  }

  return {
    isReady,
    trackEvent,
    trackPageView,
    trackUserAction,
    trackBusinessEvent,
    trackFinancialAction,
    trackOrderAction,
    trackProviderAction,
    trackReportGenerated,
    trackError
  }
}
