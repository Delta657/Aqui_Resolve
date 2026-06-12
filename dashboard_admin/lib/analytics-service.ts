import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

interface AnalyticsEvent {
  eventName: string
  parameters?: Record<string, any>
  userId?: string
  sessionId?: string
}

export class AnalyticsService {
  private static instance: AnalyticsService
  private sessionId: string

  private constructor() {
    this.sessionId = this.generateSessionId()
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!db) {
      console.warn('Firebase não inicializado')
      return
    }

    try {
      await addDoc(collection(db, 'analytics_events'), {
        event_name: event.eventName,
        parameters: event.parameters || {},
        user_id: event.userId || null,
        session_id: event.sessionId || this.sessionId,
        timestamp: serverTimestamp(),
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        referrer: typeof window !== 'undefined' ? document.referrer : null,
      })

      console.log(`📊 Evento rastreado: ${event.eventName}`, event.parameters)
    } catch (error) {
      console.error('Erro ao rastrear evento:', error)
    }
  }

  // Métodos específicos para diferentes tipos de eventos
  public async trackPageView(pageName: string, pageTitle?: string): Promise<void> {
    await this.trackEvent({
      eventName: 'page_view',
      parameters: {
        page_name: pageName,
        page_title: pageTitle || document.title,
        page_path: typeof window !== 'undefined' ? window.location.pathname : null,
      }
    })
  }

  public async trackUserAction(action: string, category: string, value?: number): Promise<void> {
    await this.trackEvent({
      eventName: 'user_action',
      parameters: {
        action,
        category,
        value,
      }
    })
  }

  public async trackBusinessEvent(eventType: string, data: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventName: 'business_event',
      parameters: {
        event_type: eventType,
        ...data,
      }
    })
  }

  public async trackFinancialAction(action: string, amount?: number, currency = 'BRL'): Promise<void> {
    await this.trackEvent({
      eventName: 'financial_action',
      parameters: {
        action,
        amount,
        currency,
      }
    })
  }

  public async trackOrderAction(action: string, orderId?: string, status?: string): Promise<void> {
    await this.trackEvent({
      eventName: 'order_action',
      parameters: {
        action,
        order_id: orderId,
        status,
      }
    })
  }

  public async trackProviderAction(action: string, providerId?: string, status?: string): Promise<void> {
    await this.trackEvent({
      eventName: 'provider_action',
      parameters: {
        action,
        provider_id: providerId,
        status,
      }
    })
  }

  public async trackReportGenerated(reportType: string, filters?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      eventName: 'report_generated',
      parameters: {
        report_type: reportType,
        filters: filters ? JSON.stringify(filters) : null,
      }
    })
  }

  public async trackError(error: string, context?: string, severity = 'error'): Promise<void> {
    await this.trackEvent({
      eventName: 'error_occurred',
      parameters: {
        error_message: error,
        context,
        severity,
      }
    })
  }

  public async trackLogin(method: string, userId?: string): Promise<void> {
    await this.trackEvent({
      eventName: 'login',
      parameters: {
        method,
      },
      userId,
    })
  }

  public async trackLogout(userId?: string): Promise<void> {
    await this.trackEvent({
      eventName: 'logout',
      parameters: {},
      userId,
    })
  }

  public async trackSearch(query: string, resultsCount?: number): Promise<void> {
    await this.trackEvent({
      eventName: 'search',
      parameters: {
        search_term: query,
        results_count: resultsCount,
      }
    })
  }

  public async trackFileUpload(fileName: string, fileSize?: number, fileType?: string): Promise<void> {
    await this.trackEvent({
      eventName: 'file_upload',
      parameters: {
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
      }
    })
  }

  public async trackFileDownload(fileName: string, fileSize?: number, fileType?: string): Promise<void> {
    await this.trackEvent({
      eventName: 'file_download',
      parameters: {
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
      }
    })
  }

  public getSessionId(): string {
    return this.sessionId
  }
}

// Exportar instância singleton
export const analyticsService = AnalyticsService.getInstance()
