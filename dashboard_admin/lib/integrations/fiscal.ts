import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { config, isIntegrationConfigured } from '../config';
import { logger } from '../logger';
import { encrypt, decrypt } from '../encryption';

export interface FiscalDocument {
  id: string;
  type: 'nfe' | 'nfse';
  number: string;
  series: string;
  issueDate: Date;
  dueDate: Date;
  clientId: string;
  clientName: string;
  clientDocument: string;
  items: FiscalItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'authorized' | 'cancelled' | 'error';
  accessKey?: string;
  protocol?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface FiscalItem {
  id: string;
  description: string;
  ncm?: string;
  cfop?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
  taxAmount: number;
}

export interface FiscalClient {
  id: string;
  name: string;
  document: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface FiscalWebhookPayload {
  event: string;
  documentId: string;
  documentType: 'nfe' | 'nfse';
  status: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export abstract class FiscalIntegration {
  protected client: AxiosInstance;
  protected config: any;
  protected isSandbox: boolean;
  protected certificate?: Buffer;
  protected certificatePassword?: string;

  constructor(fiscalConfig: any) {
    this.config = fiscalConfig;
    this.isSandbox = config.features.sandbox;

    this.client = axios.create({
      baseURL: fiscalConfig.baseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Finance-System/1.0',
      },
    });

    // Interceptor para logs
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Fiscal API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          provider: this.constructor.name,
          url: config.url,
          method: config.method,
        });
        return config;
      },
      (error) => {
        logger.error('Fiscal API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Fiscal API Response: ${response.status}`, {
          provider: this.constructor.name,
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('Fiscal API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    // Carregar certificado se configurado
    this.loadCertificate();
  }

  /**
   * Carrega certificado digital
   */
  private loadCertificate(): void {
    if (this.config.certPath && fs.existsSync(this.config.certPath)) {
      try {
        this.certificate = fs.readFileSync(this.config.certPath);
        this.certificatePassword = this.config.certPass;
        logger.info('Fiscal certificate loaded successfully');
      } catch (error) {
        logger.error('Failed to load fiscal certificate:', error);
      }
    }
  }

  /**
   * Testa a conexão com o serviço fiscal
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Emite documento fiscal
   */
  abstract issueDocument(document: FiscalDocument): Promise<{
    id: string;
    accessKey: string;
    protocol: string;
    status: string;
  }>;

  /**
   * Consulta documento fiscal
   */
  abstract getDocument(id: string): Promise<FiscalDocument>;

  /**
   * Cancela documento fiscal
   */
  abstract cancelDocument(id: string, reason: string): Promise<{
    id: string;
    protocol: string;
    status: string;
  }>;

  /**
   * Obtém status do documento
   */
  abstract getDocumentStatus(id: string): Promise<string>;

  /**
   * Valida webhook
   */
  abstract validateWebhook(payload: any, signature: string): Promise<boolean>;

  /**
   * Processa webhook
   */
  abstract processWebhook(payload: FiscalWebhookPayload): Promise<void>;
}

// Implementação para NF-e
export class NFEIntegration extends FiscalIntegration {
  constructor() {
    super(config.integrations.nfe);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/status');
      return response.status === 200;
    } catch (error) {
      logger.error('NFE connection test failed:', error);
      return false;
    }
  }

  async issueDocument(document: FiscalDocument): Promise<{
    id: string;
    accessKey: string;
    protocol: string;
    status: string;
  }> {
    try {
      const nfeData = this.buildNFEData(document);
      
      const response = await this.client.post('/nfe/issue', nfeData, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return {
        id: response.data.id,
        accessKey: response.data.accessKey,
        protocol: response.data.protocol,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to issue NFE:', error);
      throw new Error('Failed to issue NFE document');
    }
  }

  async getDocument(id: string): Promise<FiscalDocument> {
    try {
      const response = await this.client.get(`/nfe/${id}`, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return this.parseNFEDocument(response.data);
    } catch (error) {
      logger.error('Failed to get NFE document:', error);
      throw new Error('Failed to retrieve NFE document');
    }
  }

  async cancelDocument(id: string, reason: string): Promise<{
    id: string;
    protocol: string;
    status: string;
  }> {
    try {
      const response = await this.client.post(`/nfe/${id}/cancel`, {
        reason,
      }, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return {
        id: response.data.id,
        protocol: response.data.protocol,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to cancel NFE document:', error);
      throw new Error('Failed to cancel NFE document');
    }
  }

  async getDocumentStatus(id: string): Promise<string> {
    try {
      const response = await this.client.get(`/nfe/${id}/status`, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return response.data.status;
    } catch (error) {
      logger.error('Failed to get NFE status:', error);
      throw new Error('Failed to get NFE status');
    }
  }

  async validateWebhook(payload: any, signature: string): Promise<boolean> {
    // Implementar validação de assinatura
    const expectedSignature = this.generateWebhookSignature(payload);
    return signature === expectedSignature;
  }

  async processWebhook(payload: FiscalWebhookPayload): Promise<void> {
    logger.info('Processing NFE webhook', {
      event: payload.event,
      documentId: payload.documentId,
      status: payload.status,
    });

    switch (payload.event) {
      case 'DOCUMENT_AUTHORIZED':
        await this.handleDocumentAuthorized(payload);
        break;
      case 'DOCUMENT_CANCELLED':
        await this.handleDocumentCancelled(payload);
        break;
      case 'DOCUMENT_ERROR':
        await this.handleDocumentError(payload);
        break;
      default:
        logger.warn('Unknown NFE webhook event', { event: payload.event });
    }
  }

  private buildNFEData(document: FiscalDocument): any {
    return {
      ambiente: this.config.ambiente,
      empresa: {
        cnpj: this.config.empresaCNPJ,
      },
      cliente: {
        nome: document.clientName,
        cpfCnpj: document.clientDocument,
      },
      itens: document.items.map(item => ({
        descricao: item.description,
        ncm: item.ncm,
        cfop: item.cfop,
        quantidade: item.quantity,
        valorUnitario: item.unitPrice,
        valorTotal: item.total,
        aliquotaIcms: item.taxRate,
        valorIcms: item.taxAmount,
      })),
      valores: {
        valorTotal: document.total,
        valorIcms: document.tax,
        valorBaseIcms: document.subtotal,
      },
    };
  }

  private parseNFEDocument(data: any): FiscalDocument {
    return {
      id: data.id,
      type: 'nfe',
      number: data.numero,
      series: data.serie,
      issueDate: new Date(data.dataEmissao),
      dueDate: new Date(data.dataVencimento),
      clientId: data.cliente.id,
      clientName: data.cliente.nome,
      clientDocument: data.cliente.cpfCnpj,
      items: data.itens.map((item: any) => ({
        id: item.id,
        description: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        quantity: item.quantidade,
        unitPrice: item.valorUnitario,
        total: item.valorTotal,
        taxRate: item.aliquotaIcms,
        taxAmount: item.valorIcms,
      })),
      subtotal: data.valores.valorBaseIcms,
      tax: data.valores.valorIcms,
      total: data.valores.valorTotal,
      status: data.status,
      accessKey: data.chaveAcesso,
      protocol: data.protocolo,
      errorMessage: data.mensagemErro,
    };
  }

  private async handleDocumentAuthorized(payload: FiscalWebhookPayload): Promise<void> {
    logger.info('NFE document authorized', {
      documentId: payload.documentId,
      accessKey: payload.data.accessKey,
      protocol: payload.data.protocol,
    });
  }

  private async handleDocumentCancelled(payload: FiscalWebhookPayload): Promise<void> {
    logger.info('NFE document cancelled', {
      documentId: payload.documentId,
      protocol: payload.data.protocol,
    });
  }

  private async handleDocumentError(payload: FiscalWebhookPayload): Promise<void> {
    logger.error('NFE document error', {
      documentId: payload.documentId,
      error: payload.data.error,
    });
  }

  private generateWebhookSignature(payload: any): string {
    const data = JSON.stringify(payload);
    return require('crypto').createHmac('sha256', this.config.webhookSecret || '').update(data).digest('hex');
  }
}

// Implementação para NFS-e
export class NFSEIntegration extends FiscalIntegration {
  constructor() {
    super(config.integrations.nfse);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/status');
      return response.status === 200;
    } catch (error) {
      logger.error('NFSE connection test failed:', error);
      return false;
    }
  }

  async issueDocument(document: FiscalDocument): Promise<{
    id: string;
    accessKey: string;
    protocol: string;
    status: string;
  }> {
    try {
      const nfseData = this.buildNFSEData(document);
      
      const response = await this.client.post('/nfse/issue', nfseData, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return {
        id: response.data.id,
        accessKey: response.data.accessKey,
        protocol: response.data.protocol,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to issue NFSE:', error);
      throw new Error('Failed to issue NFSE document');
    }
  }

  async getDocument(id: string): Promise<FiscalDocument> {
    try {
      const response = await this.client.get(`/nfse/${id}`, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return this.parseNFSEDocument(response.data);
    } catch (error) {
      logger.error('Failed to get NFSE document:', error);
      throw new Error('Failed to retrieve NFSE document');
    }
  }

  async cancelDocument(id: string, reason: string): Promise<{
    id: string;
    protocol: string;
    status: string;
  }> {
    try {
      const response = await this.client.post(`/nfse/${id}/cancel`, {
        reason,
      }, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return {
        id: response.data.id,
        protocol: response.data.protocol,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to cancel NFSE document:', error);
      throw new Error('Failed to cancel NFSE document');
    }
  }

  async getDocumentStatus(id: string): Promise<string> {
    try {
      const response = await this.client.get(`/nfse/${id}/status`, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      });

      return response.data.status;
    } catch (error) {
      logger.error('Failed to get NFSE status:', error);
      throw new Error('Failed to get NFSE status');
    }
  }

  async validateWebhook(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = this.generateWebhookSignature(payload);
    return signature === expectedSignature;
  }

  async processWebhook(payload: FiscalWebhookPayload): Promise<void> {
    logger.info('Processing NFSE webhook', {
      event: payload.event,
      documentId: payload.documentId,
      status: payload.status,
    });

    switch (payload.event) {
      case 'DOCUMENT_AUTHORIZED':
        await this.handleDocumentAuthorized(payload);
        break;
      case 'DOCUMENT_CANCELLED':
        await this.handleDocumentCancelled(payload);
        break;
      case 'DOCUMENT_ERROR':
        await this.handleDocumentError(payload);
        break;
      default:
        logger.warn('Unknown NFSE webhook event', { event: payload.event });
    }
  }

  private buildNFSEData(document: FiscalDocument): any {
    return {
      ambiente: this.config.ambiente,
      prestador: {
        cnpj: this.config.empresaCNPJ,
      },
      tomador: {
        nome: document.clientName,
        cpfCnpj: document.clientDocument,
      },
      servicos: document.items.map(item => ({
        descricao: item.description,
        quantidade: item.quantity,
        valorUnitario: item.unitPrice,
        valorTotal: item.total,
        aliquotaIss: item.taxRate,
        valorIss: item.taxAmount,
      })),
      valores: {
        valorTotal: document.total,
        valorIss: document.tax,
        valorBaseIss: document.subtotal,
      },
    };
  }

  private parseNFSEDocument(data: any): FiscalDocument {
    return {
      id: data.id,
      type: 'nfse',
      number: data.numero,
      series: data.serie,
      issueDate: new Date(data.dataEmissao),
      dueDate: new Date(data.dataVencimento),
      clientId: data.tomador.id,
      clientName: data.tomador.nome,
      clientDocument: data.tomador.cpfCnpj,
      items: data.servicos.map((item: any) => ({
        id: item.id,
        description: item.descricao,
        quantity: item.quantidade,
        unitPrice: item.valorUnitario,
        total: item.valorTotal,
        taxRate: item.aliquotaIss,
        taxAmount: item.valorIss,
      })),
      subtotal: data.valores.valorBaseIss,
      tax: data.valores.valorIss,
      total: data.valores.valorTotal,
      status: data.status,
      accessKey: data.chaveAcesso,
      protocol: data.protocolo,
      errorMessage: data.mensagemErro,
    };
  }

  private async handleDocumentAuthorized(payload: FiscalWebhookPayload): Promise<void> {
    logger.info('NFSE document authorized', {
      documentId: payload.documentId,
      accessKey: payload.data.accessKey,
      protocol: payload.data.protocol,
    });
  }

  private async handleDocumentCancelled(payload: FiscalWebhookPayload): Promise<void> {
    logger.info('NFSE document cancelled', {
      documentId: payload.documentId,
      protocol: payload.data.protocol,
    });
  }

  private async handleDocumentError(payload: FiscalWebhookPayload): Promise<void> {
    logger.error('NFSE document error', {
      documentId: payload.documentId,
      error: payload.data.error,
    });
  }

  private generateWebhookSignature(payload: any): string {
    const data = JSON.stringify(payload);
    return require('crypto').createHmac('sha256', this.config.webhookSecret || '').update(data).digest('hex');
  }
}

// Factory para criar integração fiscal
export class FiscalIntegrationFactory {
  static createNFE(): NFEIntegration {
    if (!isIntegrationConfigured('nfe')) {
      logger.warn('NFE integration not configured, using sandbox mode');
    }
    return new NFEIntegration();
  }

  static createNFSE(): NFSEIntegration {
    if (!isIntegrationConfigured('nfse')) {
      logger.warn('NFSE integration not configured, using sandbox mode');
    }
    return new NFSEIntegration();
  }
}

// Instâncias singleton
export const nfeIntegration = FiscalIntegrationFactory.createNFE();
export const nfseIntegration = FiscalIntegrationFactory.createNFSE();

