import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config, isIntegrationConfigured } from '../config';
import { logger } from '../logger';
import { encrypt, decrypt } from '../encryption';
import { BankAccount, Transaction } from '@/types/finance';

export interface BankTransaction {
  id: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
  category?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface BankBalance {
  accountId: string;
  balance: number;
  availableBalance: number;
  lastUpdate: Date;
}

export interface BankStatement {
  accountId: string;
  startDate: Date;
  endDate: Date;
  transactions: BankTransaction[];
  openingBalance: number;
  closingBalance: number;
}

export interface BankWebhookPayload {
  event: string;
  accountId: string;
  transactionId?: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export abstract class BankIntegration {
  protected client: AxiosInstance;
  protected config: any;
  protected isSandbox: boolean;

  constructor(bankConfig: any) {
    this.config = bankConfig;
    this.isSandbox = config.features.sandbox;

    this.client = axios.create({
      baseURL: bankConfig.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Finance-System/1.0',
      },
    });

    // Interceptor para logs
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Bank API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          provider: this.constructor.name,
          url: config.url,
          method: config.method,
        });
        return config;
      },
      (error) => {
        logger.error('Bank API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Bank API Response: ${response.status}`, {
          provider: this.constructor.name,
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('Bank API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Testa a conexão com o banco
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Obtém saldo da conta
   */
  abstract getBalance(accountId: string): Promise<BankBalance>;

  /**
   * Obtém extrato da conta
   */
  abstract getStatement(accountId: string, startDate: Date, endDate: Date): Promise<BankStatement>;

  /**
   * Obtém transações recentes
   */
  abstract getRecentTransactions(accountId: string, limit?: number): Promise<BankTransaction[]>;

  /**
   * Faz transferência entre contas
   */
  abstract transfer(fromAccountId: string, toAccountId: string, amount: number, description: string): Promise<string>;

  /**
   * Valida webhook
   */
  abstract validateWebhook(payload: any, signature: string): Promise<boolean>;

  /**
   * Processa webhook
   */
  abstract processWebhook(payload: BankWebhookPayload): Promise<void>;

  /**
   * Utilitário para criptografar dados sensíveis
   */
  protected encryptSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return encrypt(data);
    }
    if (typeof data === 'object' && data !== null) {
      const encrypted = { ...data };
      for (const [key, value] of Object.entries(data)) {
        if (['password', 'token', 'secret', 'key'].some(sensitive => key.toLowerCase().includes(sensitive))) {
          encrypted[key] = encrypt(value as string);
        }
      }
      return encrypted;
    }
    return data;
  }

  /**
   * Utilitário para descriptografar dados sensíveis
   */
  protected decryptSensitiveData(data: any): any {
    if (typeof data === 'string' && data.includes(':')) {
      try {
        return decrypt(data);
      } catch {
        return data;
      }
    }
    if (typeof data === 'object' && data !== null) {
      const decrypted = { ...data };
      for (const [key, value] of Object.entries(data)) {
        if (['password', 'token', 'secret', 'key'].some(sensitive => key.toLowerCase().includes(sensitive))) {
          decrypted[key] = decrypt(value as string);
        }
      }
      return decrypted;
    }
    return data;
  }
}

// Implementação para banco genérico (sandbox)
export class GenericBankIntegration extends BankIntegration {
  constructor() {
    super({
      baseUrl: config.integrations.bank.baseUrl,
      apiKey: config.integrations.bank.apiKey,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Generic bank connection test failed:', error);
      return false;
    }
  }

  async getBalance(accountId: string): Promise<BankBalance> {
    // Mock data para sandbox
    return {
      accountId,
      balance: Math.random() * 100000,
      availableBalance: Math.random() * 95000,
      lastUpdate: new Date(),
    };
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<BankStatement> {
    // Mock data para sandbox
    const transactions: BankTransaction[] = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      if (Math.random() > 0.7) { // 30% chance de ter transação
        transactions.push({
          id: `txn_${Date.now()}_${i}`,
          accountId,
          type: Math.random() > 0.5 ? 'credit' : 'debit',
          amount: Math.random() * 5000,
          description: `Transação ${i + 1}`,
          date,
          category: Math.random() > 0.5 ? 'transfer' : 'payment',
        });
      }
    }

    return {
      accountId,
      startDate,
      endDate,
      transactions,
      openingBalance: Math.random() * 50000,
      closingBalance: Math.random() * 100000,
    };
  }

  async getRecentTransactions(accountId: string, limit: number = 10): Promise<BankTransaction[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const statement = await this.getStatement(accountId, startDate, endDate);
    return statement.transactions.slice(0, limit);
  }

  async transfer(fromAccountId: string, toAccountId: string, amount: number, description: string): Promise<string> {
    // Mock transfer
    const transferId = `transfer_${Date.now()}`;
    logger.info('Mock bank transfer created', {
      transferId,
      fromAccountId,
      toAccountId,
      amount,
      description,
    });
    return transferId;
  }

  async validateWebhook(payload: any, signature: string): Promise<boolean> {
    // Mock validation
    return signature === 'valid_signature';
  }

  async processWebhook(payload: BankWebhookPayload): Promise<void> {
    logger.info('Processing bank webhook', {
      event: payload.event,
      accountId: payload.accountId,
      transactionId: payload.transactionId,
    });
  }
}

// Implementação para Open Finance
export class OpenFinanceIntegration extends BankIntegration {
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor() {
    super({
      baseUrl: config.integrations.bank.baseUrl,
      clientId: config.integrations.bank.clientId,
      clientSecret: config.integrations.bank.clientSecret,
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await this.client.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get Open Finance access token:', error);
      throw new Error('Failed to authenticate with Open Finance');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const response = await this.client.get('/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Open Finance connection test failed:', error);
      return false;
    }
  }

  async getBalance(accountId: string): Promise<BankBalance> {
    const token = await this.getAccessToken();
    const response = await this.client.get(`/accounts/${accountId}/balances`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      accountId,
      balance: response.data.balance,
      availableBalance: response.data.availableBalance,
      lastUpdate: new Date(response.data.lastUpdate),
    };
  }

  async getStatement(accountId: string, startDate: Date, endDate: Date): Promise<BankStatement> {
    const token = await this.getAccessToken();
    const response = await this.client.get(`/accounts/${accountId}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        fromBookingDate: startDate.toISOString().split('T')[0],
        toBookingDate: endDate.toISOString().split('T')[0],
      },
    });

    const transactions: BankTransaction[] = response.data.transactions.map((txn: any) => ({
      id: txn.transactionId,
      accountId,
      type: txn.creditDebitIndicator === 'Credit' ? 'credit' : 'debit',
      amount: parseFloat(txn.amount),
      description: txn.remittanceInformation,
      date: new Date(txn.bookingDate),
      category: txn.category,
      reference: txn.reference,
    }));

    return {
      accountId,
      startDate,
      endDate,
      transactions,
      openingBalance: response.data.openingBalance,
      closingBalance: response.data.closingBalance,
    };
  }

  async getRecentTransactions(accountId: string, limit: number = 10): Promise<BankTransaction[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const statement = await this.getStatement(accountId, startDate, endDate);
    return statement.transactions.slice(0, limit);
  }

  async transfer(fromAccountId: string, toAccountId: string, amount: number, description: string): Promise<string> {
    const token = await this.getAccessToken();
    const response = await this.client.post('/payments', {
      debtorAccount: { identification: fromAccountId },
      creditorAccount: { identification: toAccountId },
      instructedAmount: { amount, currency: 'BRL' },
      remittanceInformation: description,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.paymentId;
  }

  async validateWebhook(payload: any, signature: string): Promise<boolean> {
    // Implementar validação de assinatura conforme especificação Open Finance
    const expectedSignature = this.generateWebhookSignature(payload);
    return signature === expectedSignature;
  }

  async processWebhook(payload: BankWebhookPayload): Promise<void> {
    logger.info('Processing Open Finance webhook', {
      event: payload.event,
      accountId: payload.accountId,
      transactionId: payload.transactionId,
    });

    // Processar diferentes tipos de eventos
    switch (payload.event) {
      case 'TRANSACTION_CREATED':
        await this.handleTransactionCreated(payload);
        break;
      case 'BALANCE_UPDATED':
        await this.handleBalanceUpdated(payload);
        break;
      default:
        logger.warn('Unknown webhook event', { event: payload.event });
    }
  }

  private async handleTransactionCreated(payload: BankWebhookPayload): Promise<void> {
    // Implementar lógica para processar nova transação
    logger.info('Handling transaction created webhook', {
      transactionId: payload.transactionId,
      accountId: payload.accountId,
    });
  }

  private async handleBalanceUpdated(payload: BankWebhookPayload): Promise<void> {
    // Implementar lógica para processar atualização de saldo
    logger.info('Handling balance updated webhook', {
      accountId: payload.accountId,
    });
  }

  private generateWebhookSignature(payload: any): string {
    // Implementar geração de assinatura conforme especificação
    const data = JSON.stringify(payload);
    return require('crypto').createHmac('sha256', this.config.webhookSecret || '').update(data).digest('hex');
  }
}

// Factory para criar integração bancária
export class BankIntegrationFactory {
  static create(): BankIntegration {
    if (!isIntegrationConfigured('bank')) {
      logger.warn('Bank integration not configured, using sandbox mode');
      return new GenericBankIntegration();
    }

    // Determinar tipo de integração baseado na configuração
    if (config.integrations.bank.clientId && config.integrations.bank.clientSecret) {
      return new OpenFinanceIntegration();
    }

    return new GenericBankIntegration();
  }
}

// Instância singleton
export const bankIntegration = BankIntegrationFactory.create();

