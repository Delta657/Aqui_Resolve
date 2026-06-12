/**
 * Serviço de conformidade LGPD
 * Gerencia consentimentos, logs de processamento, direitos do titular e políticas de retenção
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Consent,
  ConsentType,
  DataProcessingLog,
  ProcessingActivity,
  LegalBasis,
  DataSubjectRequest,
  DataSubjectRight,
  DataRetentionPolicy,
  DataBreach,
  PersonalDataMapping,
  LGPDConfig,
} from '@/types/lgpd'

export class LGPDService {
  private static readonly COLLECTIONS = {
    CONSENTS: 'lgpd_consents',
    PROCESSING_LOGS: 'lgpd_processing_logs',
    DATA_SUBJECT_REQUESTS: 'lgpd_data_subject_requests',
    RETENTION_POLICIES: 'lgpd_retention_policies',
    DATA_BREACHES: 'lgpd_data_breaches',
    DATA_MAPPING: 'lgpd_data_mapping',
    CONFIG: 'lgpd_config',
  }

  // ========== CONSENTIMENTOS ==========

  /**
   * Registrar consentimento do usuário
   */
  static async grantConsent(
    userId: string,
    userEmail: string,
    consentType: ConsentType,
    version: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    try {
      const consentData: Omit<Consent, 'id'> = {
        userId,
        userEmail,
        consentType,
        granted: true,
        grantedAt: new Date(),
        version,
        ipAddress,
        userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await addDoc(
        collection(db, this.COLLECTIONS.CONSENTS),
        {
          ...consentData,
          grantedAt: Timestamp.fromDate(consentData.grantedAt),
          createdAt: Timestamp.fromDate(consentData.createdAt),
          updatedAt: Timestamp.fromDate(consentData.updatedAt),
        }
      )

      // Log da atividade
      await this.logProcessingActivity(
        userId,
        userEmail,
        'criacao_usuario',
        ['consentimento'],
        'consentimento',
        `Consentimento ${consentType} concedido`,
        ipAddress,
        userAgent
      )

      return docRef.id
    } catch (error) {
      console.error('Erro ao registrar consentimento:', error)
      throw error
    }
  }

  /**
   * Revogar consentimento
   */
  static async revokeConsent(
    consentId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const consentRef = doc(db, this.COLLECTIONS.CONSENTS, consentId)
      const consentDoc = await getDoc(consentRef)

      if (!consentDoc.exists()) {
        throw new Error('Consentimento não encontrado')
      }

      const consentData = consentDoc.data() as Consent

      await updateDoc(consentRef, {
        granted: false,
        revokedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      // Log da atividade
      await this.logProcessingActivity(
        userId,
        consentData.userEmail,
        'atualizacao_usuario',
        ['consentimento'],
        'consentimento',
        `Consentimento ${consentData.consentType} revogado`,
        ipAddress,
        userAgent
      )
    } catch (error) {
      console.error('Erro ao revogar consentimento:', error)
      throw error
    }
  }

  /**
   * Verificar se usuário tem consentimento ativo
   */
  static async hasConsent(
    userId: string,
    consentType: ConsentType
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.CONSENTS),
        where('userId', '==', userId),
        where('consentType', '==', consentType),
        where('granted', '==', true),
        orderBy('grantedAt', 'desc'),
        limit(1)
      )

      const snapshot = await getDocs(q)
      if (snapshot.empty) return false

      const consent = snapshot.docs[0].data() as Consent
      return !consent.revokedAt
    } catch (error) {
      console.error('Erro ao verificar consentimento:', error)
      return false
    }
  }

  /**
   * Listar consentimentos do usuário
   */
  static async getUserConsents(userId: string): Promise<Consent[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.CONSENTS),
        where('userId', '==', userId),
        orderBy('grantedAt', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        grantedAt: doc.data().grantedAt?.toDate() || new Date(),
        revokedAt: doc.data().revokedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Consent[]
    } catch (error) {
      console.error('Erro ao buscar consentimentos:', error)
      return []
    }
  }

  // ========== LOGS DE PROCESSAMENTO ==========

  /**
   * Registrar atividade de processamento de dados pessoais
   */
  static async logProcessingActivity(
    userId: string,
    userEmail: string,
    activity: ProcessingActivity,
    dataType: string[],
    legalBasis: LegalBasis,
    purpose: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
    retentionPeriod?: number,
    sharedWith?: string[]
  ): Promise<string> {
    try {
      const logData: Omit<DataProcessingLog, 'id'> = {
        userId,
        userEmail,
        activity,
        dataType,
        legalBasis,
        purpose,
        retentionPeriod,
        sharedWith,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        metadata,
      }

      const docRef = await addDoc(
        collection(db, this.COLLECTIONS.PROCESSING_LOGS),
        {
          ...logData,
          timestamp: Timestamp.fromDate(logData.timestamp),
        }
      )

      return docRef.id
    } catch (error) {
      console.error('Erro ao registrar log de processamento:', error)
      throw error
    }
  }

  /**
   * Buscar logs de processamento do usuário
   */
  static async getUserProcessingLogs(
    userId: string,
    limitCount: number = 100
  ): Promise<DataProcessingLog[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.PROCESSING_LOGS),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as DataProcessingLog[]
    } catch (error) {
      console.error('Erro ao buscar logs de processamento:', error)
      return []
    }
  }

  // ========== DIREITOS DO TITULAR ==========

  /**
   * Criar solicitação de direito do titular
   */
  static async createDataSubjectRequest(
    userId: string,
    userEmail: string,
    requestType: DataSubjectRight,
    description?: string
  ): Promise<string> {
    try {
      const requestData: Omit<DataSubjectRequest, 'id'> = {
        userId,
        userEmail,
        requestType,
        status: 'pendente',
        description,
        requestedAt: new Date(),
      }

      const docRef = await addDoc(
        collection(db, this.COLLECTIONS.DATA_SUBJECT_REQUESTS),
        {
          ...requestData,
          requestedAt: Timestamp.fromDate(requestData.requestedAt),
        }
      )

      // Log da atividade
      await this.logProcessingActivity(
        userId,
        userEmail,
        'acesso_dados',
        ['solicitacao_direitos'],
        'obrigacao_legal',
        `Solicitação de ${requestType} criada`,
        undefined,
        undefined,
        { requestId: docRef.id, requestType }
      )

      return docRef.id
    } catch (error) {
      console.error('Erro ao criar solicitação:', error)
      throw error
    }
  }

  /**
   * Processar solicitação de acesso aos dados
   */
  static async processAccessRequest(
    requestId: string,
    userData: any,
    handledBy: string
  ): Promise<void> {
    try {
      const requestRef = doc(
        db,
        this.COLLECTIONS.DATA_SUBJECT_REQUESTS,
        requestId
      )
      const requestDoc = await getDoc(requestRef)

      if (!requestDoc.exists()) {
        throw new Error('Solicitação não encontrada')
      }

      const requestData = requestDoc.data() as DataSubjectRequest

      await updateDoc(requestRef, {
        status: 'concluido',
        completedAt: Timestamp.now(),
        responseData: userData,
        handledBy,
        updatedAt: Timestamp.now(),
      })

      // Log da atividade
      await this.logProcessingActivity(
        requestData.userId,
        requestData.userEmail,
        'acesso_dados',
        ['dados_pessoais'],
        'obrigacao_legal',
        'Acesso aos dados pessoais fornecido',
        undefined,
        undefined,
        { requestId }
      )
    } catch (error) {
      console.error('Erro ao processar solicitação de acesso:', error)
      throw error
    }
  }

  /**
   * Processar solicitação de exclusão
   */
  static async processDeletionRequest(
    requestId: string,
    handledBy: string
  ): Promise<void> {
    try {
      const requestRef = doc(
        db,
        this.COLLECTIONS.DATA_SUBJECT_REQUESTS,
        requestId
      )
      const requestDoc = await getDoc(requestRef)

      if (!requestDoc.exists()) {
        throw new Error('Solicitação não encontrada')
      }

      const requestData = requestDoc.data() as DataSubjectRequest

      await updateDoc(requestRef, {
        status: 'concluido',
        completedAt: Timestamp.now(),
        handledBy,
        updatedAt: Timestamp.now(),
      })

      // Log da atividade
      await this.logProcessingActivity(
        requestData.userId,
        requestData.userEmail,
        'exclusao_usuario',
        ['dados_pessoais'],
        'obrigacao_legal',
        'Dados pessoais excluídos conforme solicitação',
        undefined,
        undefined,
        { requestId }
      )
    } catch (error) {
      console.error('Erro ao processar solicitação de exclusão:', error)
      throw error
    }
  }

  /**
   * Listar solicitações do usuário
   */
  static async getUserRequests(userId: string): Promise<DataSubjectRequest[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.DATA_SUBJECT_REQUESTS),
        where('userId', '==', userId),
        orderBy('requestedAt', 'desc')
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as DataSubjectRequest[]
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error)
      return []
    }
  }

  // ========== POLÍTICAS DE RETENÇÃO ==========

  /**
   * Aplicar política de retenção e anonimização
   */
  static async applyRetentionPolicy(
    userId: string,
    dataType: string
  ): Promise<void> {
    try {
      const policies = await this.getRetentionPolicies()
      const policy = policies.find((p) => p.dataType === dataType)

      if (!policy) return

      // Verificar se precisa anonimizar
      if (policy.anonymizeAfter) {
        // Implementar lógica de anonimização
        await this.anonymizeUserData(userId, dataType)
      }

      // Verificar se precisa deletar
      // Implementar lógica de exclusão automática
    } catch (error) {
      console.error('Erro ao aplicar política de retenção:', error)
      throw error
    }
  }

  /**
   * Buscar políticas de retenção
   */
  static async getRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    try {
      const snapshot = await getDocs(
        collection(db, this.COLLECTIONS.RETENTION_POLICIES)
      )
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as DataRetentionPolicy[]
    } catch (error) {
      console.error('Erro ao buscar políticas de retenção:', error)
      return []
    }
  }

  // ========== ANONIMIZAÇÃO ==========

  /**
   * Anonimizar dados do usuário
   */
  static async anonymizeUserData(
    userId: string,
    dataType?: string
  ): Promise<void> {
    try {
      // Implementar lógica de anonimização
      // Substituir dados pessoais por valores anonimizados
      console.log(`Anonimizando dados do usuário ${userId}`, dataType)
    } catch (error) {
      console.error('Erro ao anonimizar dados:', error)
      throw error
    }
  }

  // ========== VAZAMENTOS ==========

  /**
   * Registrar vazamento de dados
   */
  static async reportDataBreach(breach: Omit<DataBreach, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(
        collection(db, this.COLLECTIONS.DATA_BREACHES),
        {
          ...breach,
          detectedAt: Timestamp.fromDate(breach.detectedAt),
          reportedAt: breach.reportedAt
            ? Timestamp.fromDate(breach.reportedAt)
            : undefined,
          authorityNotificationDate: breach.authorityNotificationDate
            ? Timestamp.fromDate(breach.authorityNotificationDate)
            : undefined,
          resolutionDate: breach.resolutionDate
            ? Timestamp.fromDate(breach.resolutionDate)
            : undefined,
        }
      )

      return docRef.id
    } catch (error) {
      console.error('Erro ao registrar vazamento:', error)
      throw error
    }
  }

  // ========== CONFIGURAÇÃO ==========

  /**
   * Obter configuração LGPD
   */
  static async getConfig(): Promise<LGPDConfig | null> {
    try {
      const configRef = doc(db, this.COLLECTIONS.CONFIG, 'main')
      const configDoc = await getDoc(configRef)

      if (!configDoc.exists()) {
        return null
      }

      return configDoc.data() as LGPDConfig
    } catch (error) {
      console.error('Erro ao buscar configuração LGPD:', error)
      return null
    }
  }

  /**
   * Atualizar configuração LGPD
   */
  static async updateConfig(config: Partial<LGPDConfig>): Promise<void> {
    try {
      const configRef = doc(db, this.COLLECTIONS.CONFIG, 'main')
      await updateDoc(configRef, {
        ...config,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('Erro ao atualizar configuração LGPD:', error)
      throw error
    }
  }
}


