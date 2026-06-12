import { Invoice, Client, ApiResponse } from '@/types/finance';
import { nfeIntegration, nfseIntegration } from '@/lib/integrations/fiscal';
import { paymentIntegration } from '@/lib/integrations/payments';
import { logger } from '@/lib/logger';

export class InvoiceService {
  private invoices: Map<string, Invoice> = new Map();
  private clients: Map<string, Client> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Inicializa dados mock para demonstração
   */
  private initializeMockData(): void {
    // Mock clients
    const mockClients: Client[] = [
      {
        id: 'client_001',
        name: 'Empresa ABC Ltda',
        document: '12.345.678/0001-90',
        email: 'contato@empresaabc.com',
        phone: '(11) 99999-9999',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Sala 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          country: 'Brasil',
        },
        status: 'active',
        creditLimit: 50000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'client_002',
        name: 'João Silva',
        document: '123.456.789-00',
        email: 'joao.silva@email.com',
        phone: '(11) 88888-8888',
        address: {
          street: 'Av. Paulista',
          number: '1000',
          complement: 'Apto 101',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brasil',
        },
        status: 'active',
        creditLimit: 10000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    mockClients.forEach(client => {
      this.clients.set(client.id, client);
    });

    // Mock invoices
    const mockInvoices: Invoice[] = [
      {
        id: 'inv_001',
        number: '001/2024',
        clientId: 'client_001',
        clientName: 'Empresa ABC Ltda',
        clientDocument: '12.345.678/0001-90',
        items: [
          {
            id: 'item_001',
            description: 'Serviço de Consultoria',
            quantity: 10,
            unitPrice: 500,
            total: 5000,
            category: 'consultoria',
          },
          {
            id: 'item_002',
            description: 'Desenvolvimento de Software',
            quantity: 1,
            unitPrice: 15000,
            total: 15000,
            category: 'desenvolvimento',
          },
        ],
        subtotal: 20000,
        tax: 3600,
        total: 23600,
        dueDate: new Date('2024-02-15'),
        status: 'sent',
        paymentMethod: 'boleto',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'inv_002',
        number: '002/2024',
        clientId: 'client_002',
        clientName: 'João Silva',
        clientDocument: '123.456.789-00',
        items: [
          {
            id: 'item_003',
            description: 'Manutenção de Sistema',
            quantity: 1,
            unitPrice: 800,
            total: 800,
            category: 'manutencao',
          },
        ],
        subtotal: 800,
        tax: 144,
        total: 944,
        dueDate: new Date('2024-02-20'),
        status: 'paid',
        paymentMethod: 'pix',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    mockInvoices.forEach(invoice => {
      this.invoices.set(invoice.id, invoice);
    });
  }

  /**
   * Lista todas as faturas
   */
  async getInvoices(options: {
    status?: string;
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<Invoice[]>> {
    try {
      let invoices = Array.from(this.invoices.values());

      // Filtrar por status
      if (options.status) {
        invoices = invoices.filter(inv => inv.status === options.status);
      }

      // Filtrar por cliente
      if (options.clientId) {
        invoices = invoices.filter(inv => inv.clientId === options.clientId);
      }

      // Filtrar por data
      if (options.startDate || options.endDate) {
        invoices = invoices.filter(inv => {
          const invDate = inv.createdAt;
          if (options.startDate && invDate < options.startDate) return false;
          if (options.endDate && invDate > options.endDate) return false;
          return true;
        });
      }

      // Paginação
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      const paginatedInvoices = invoices.slice(offset, offset + limit);

      logger.info('Invoices retrieved successfully', {
        total: invoices.length,
        returned: paginatedInvoices.length,
        filters: options,
      });

      return {
        success: true,
        data: paginatedInvoices,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total: invoices.length,
          totalPages: Math.ceil(invoices.length / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get invoices:', error);
      return {
        success: false,
        error: 'Erro ao buscar faturas',
      };
    }
  }

  /**
   * Obtém uma fatura específica
   */
  async getInvoice(id: string): Promise<ApiResponse<Invoice>> {
    try {
      const invoice = this.invoices.get(id);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Fatura não encontrada',
        };
      }

      logger.info('Invoice retrieved successfully', { invoiceId: id });

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      logger.error('Failed to get invoice:', error);
      return {
        success: false,
        error: 'Erro ao buscar fatura',
      };
    }
  }

  /**
   * Cria uma nova fatura
   */
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<ApiResponse<Invoice>> {
    try {
      const id = `inv_${Date.now()}`;
      const now = new Date();
      
      const invoice: Invoice = {
        ...invoiceData,
        id,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system', // TODO: Get from auth context
        updatedBy: 'system',
      };

      this.invoices.set(id, invoice);

      logger.info('Invoice created successfully', {
        invoiceId: id,
        clientName: invoice.clientName,
        total: invoice.total,
      });

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      logger.error('Failed to create invoice:', error);
      return {
        success: false,
        error: 'Erro ao criar fatura',
      };
    }
  }

  /**
   * Atualiza uma fatura
   */
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<ApiResponse<Invoice>> {
    try {
      const invoice = this.invoices.get(id);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Fatura não encontrada',
        };
      }

      const updatedInvoice: Invoice = {
        ...invoice,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
        updatedBy: 'system', // TODO: Get from auth context
      };

      this.invoices.set(id, updatedInvoice);

      logger.info('Invoice updated successfully', {
        invoiceId: id,
        updates: Object.keys(updates),
      });

      return {
        success: true,
        data: updatedInvoice,
      };
    } catch (error) {
      logger.error('Failed to update invoice:', error);
      return {
        success: false,
        error: 'Erro ao atualizar fatura',
      };
    }
  }

  /**
   * Remove uma fatura
   */
  async deleteInvoice(id: string): Promise<ApiResponse<void>> {
    try {
      const invoice = this.invoices.get(id);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Fatura não encontrada',
        };
      }

      this.invoices.delete(id);

      logger.info('Invoice deleted successfully', { invoiceId: id });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to delete invoice:', error);
      return {
        success: false,
        error: 'Erro ao remover fatura',
      };
    }
  }

  /**
   * Emite documento fiscal (NF-e ou NFS-e)
   */
  async issueFiscalDocument(invoiceId: string, documentType: 'nfe' | 'nfse'): Promise<ApiResponse<{
    id: string;
    accessKey: string;
    protocol: string;
    status: string;
  }>> {
    try {
      const invoice = this.invoices.get(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Fatura não encontrada',
        };
      }

      // Preparar dados para emissão fiscal
      const fiscalDocument = {
        id: invoice.id,
        type: documentType,
        number: invoice.number,
        series: '1',
        issueDate: new Date(),
        dueDate: invoice.dueDate,
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        clientDocument: invoice.clientDocument,
        items: invoice.items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          taxRate: 18, // ICMS ou ISS
          taxAmount: item.total * 0.18,
        })),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        status: 'draft' as const,
      };

      // Emitir documento fiscal
      let result;
      if (documentType === 'nfe') {
        result = await nfeIntegration.issueDocument(fiscalDocument);
      } else {
        result = await nfseIntegration.issueDocument(fiscalDocument);
      }

      // Atualizar fatura com dados fiscais
      const updatedInvoice: Invoice = {
        ...invoice,
        [`${documentType}Id`]: result.id,
        updatedAt: new Date(),
        updatedBy: 'system',
      };

      this.invoices.set(invoiceId, updatedInvoice);

      logger.info('Fiscal document issued successfully', {
        invoiceId,
        documentType,
        fiscalId: result.id,
        accessKey: result.accessKey,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error('Failed to issue fiscal document:', error);
      return {
        success: false,
        error: 'Erro ao emitir documento fiscal',
      };
    }
  }

  /**
   * Cria cobrança de pagamento
   */
  async createPaymentCharge(invoiceId: string, paymentMethod: 'pix' | 'boleto' | 'card'): Promise<ApiResponse<{
    id: string;
    pixCode?: string;
    qrCode?: string;
    boletoCode?: string;
    boletoUrl?: string;
    expiresAt?: Date;
  }>> {
    try {
      const invoice = this.invoices.get(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Fatura não encontrada',
        };
      }

      const client = this.clients.get(invoice.clientId);
      if (!client) {
        return {
          success: false,
          error: 'Cliente não encontrado',
        };
      }

      // Preparar dados da cobrança
      const charge = {
        id: `charge_${invoiceId}`,
        amount: invoice.total,
        currency: 'BRL',
        description: `Fatura ${invoice.number}`,
        dueDate: invoice.dueDate,
        customerId: invoice.clientId,
        customerName: invoice.clientName,
        customerDocument: invoice.clientDocument,
        customerEmail: client.email,
        customerPhone: client.phone,
        paymentMethod,
        status: 'pending' as const,
      };

      // Criar cobrança
      let result;
      if (paymentMethod === 'pix') {
        result = await paymentIntegration.createPixCharge(charge);
      } else if (paymentMethod === 'boleto') {
        result = await paymentIntegration.createBoletoCharge(charge);
      } else {
        result = await paymentIntegration.processCardPayment(charge);
      }

      // Atualizar fatura
      const updatedInvoice: Invoice = {
        ...invoice,
        paymentMethod,
        updatedAt: new Date(),
        updatedBy: 'system',
      };

      this.invoices.set(invoiceId, updatedInvoice);

      logger.info('Payment charge created successfully', {
        invoiceId,
        paymentMethod,
        chargeId: result.id,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error('Failed to create payment charge:', error);
      return {
        success: false,
        error: 'Erro ao criar cobrança',
      };
    }
  }

  /**
   * Obtém status de pagamento
   */
  async getPaymentStatus(invoiceId: string): Promise<ApiResponse<string>> {
    try {
      const invoice = this.invoices.get(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Fatura não encontrada',
        };
      }

      // Verificar status no provedor de pagamentos
      const chargeId = `charge_${invoiceId}`;
      const status = await paymentIntegration.getChargeStatus(chargeId);

      logger.info('Payment status retrieved successfully', {
        invoiceId,
        status,
      });

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      logger.error('Failed to get payment status:', error);
      return {
        success: false,
        error: 'Erro ao buscar status de pagamento',
      };
    }
  }

  /**
   * Cancela uma fatura
   */
  async cancelInvoice(invoiceId: string, reason: string): Promise<ApiResponse<void>> {
    try {
      const invoice = this.invoices.get(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Fatura não encontrada',
        };
      }

      // Cancelar documento fiscal se existir
      if (invoice.nfeId) {
        await nfeIntegration.cancelDocument(invoice.nfeId, reason);
      }
      if (invoice.nfseId) {
        await nfseIntegration.cancelDocument(invoice.nfseId, reason);
      }

      // Cancelar cobrança se existir
      if (invoice.paymentMethod) {
        const chargeId = `charge_${invoiceId}`;
        await paymentIntegration.cancelCharge(chargeId);
      }

      // Atualizar fatura
      const updatedInvoice: Invoice = {
        ...invoice,
        status: 'cancelled',
        updatedAt: new Date(),
        updatedBy: 'system',
      };

      this.invoices.set(invoiceId, updatedInvoice);

      logger.info('Invoice cancelled successfully', {
        invoiceId,
        reason,
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to cancel invoice:', error);
      return {
        success: false,
        error: 'Erro ao cancelar fatura',
      };
    }
  }

  /**
   * Obtém estatísticas de faturamento
   */
  async getInvoiceStats(): Promise<ApiResponse<{
    totalInvoices: number;
    totalAmount: number;
    paidInvoices: number;
    paidAmount: number;
    overdueInvoices: number;
    overdueAmount: number;
    averageInvoiceValue: number;
  }>> {
    try {
      const invoices = Array.from(this.invoices.values());
      const now = new Date();

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const paidAmount = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);
      const overdueInvoices = invoices.filter(inv => 
        inv.status === 'sent' && inv.dueDate < now
      ).length;
      const overdueAmount = invoices
        .filter(inv => inv.status === 'sent' && inv.dueDate < now)
        .reduce((sum, inv) => sum + inv.total, 0);
      const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      const stats = {
        totalInvoices,
        totalAmount,
        paidInvoices,
        paidAmount,
        overdueInvoices,
        overdueAmount,
        averageInvoiceValue,
      };

      logger.info('Invoice stats retrieved successfully', stats);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      logger.error('Failed to get invoice stats:', error);
      return {
        success: false,
        error: 'Erro ao buscar estatísticas',
      };
    }
  }

  /**
   * Lista clientes
   */
  async getClients(): Promise<ApiResponse<Client[]>> {
    try {
      const clients = Array.from(this.clients.values());
      
      logger.info('Clients retrieved successfully', {
        count: clients.length,
      });

      return {
        success: true,
        data: clients,
      };
    } catch (error) {
      logger.error('Failed to get clients:', error);
      return {
        success: false,
        error: 'Erro ao buscar clientes',
      };
    }
  }

  /**
   * Cria um novo cliente
   */
  async createClient(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<ApiResponse<Client>> {
    try {
      const id = `client_${Date.now()}`;
      const now = new Date();
      
      const client: Client = {
        ...clientData,
        id,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
      };

      this.clients.set(id, client);

      logger.info('Client created successfully', {
        clientId: id,
        clientName: client.name,
      });

      return {
        success: true,
        data: client,
      };
    } catch (error) {
      logger.error('Failed to create client:', error);
      return {
        success: false,
        error: 'Erro ao criar cliente',
      };
    }
  }
}

// Instância singleton
export const invoiceService = new InvoiceService();

