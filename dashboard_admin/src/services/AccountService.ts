import { BankAccount, Transaction, ApiResponse } from '@/types/finance';
import { bankIntegration } from '@/lib/integrations/bank';
import { logger } from '@/lib/logger';
import { encrypt, decrypt } from '@/lib/encryption';

export class AccountService {
  private accounts: Map<string, BankAccount> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Inicializa dados mock para demonstração
   */
  private initializeMockData(): void {
    const mockAccounts: BankAccount[] = [
      {
        id: 'acc_001',
        name: 'Conta Principal',
        bank: 'Banco do Brasil',
        agency: '1234',
        account: '12345-6',
        accountType: 'corrente',
        balance: 48500.75,
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'acc_002',
        name: 'Conta Poupança',
        bank: 'Banco do Brasil',
        agency: '1234',
        account: '65432-1',
        accountType: 'poupanca',
        balance: 12500.00,
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        id: 'acc_003',
        name: 'Conta Investimento',
        bank: 'Itaú',
        agency: '5678',
        account: '98765-4',
        accountType: 'investimento',
        balance: 75000.00,
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    mockAccounts.forEach(account => {
      this.accounts.set(account.id, account);
      this.transactions.set(account.id, this.generateMockTransactions(account.id));
    });
  }

  /**
   * Gera transações mock para uma conta
   */
  private generateMockTransactions(accountId: string): Transaction[] {
    const transactions: Transaction[] = [];
    const today = new Date();
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      transactions.push({
        id: `txn_${accountId}_${i}`,
        accountId,
        type: Math.random() > 0.5 ? 'credit' : 'debit',
        amount: Math.random() * 5000,
        description: `Transação ${i + 1}`,
        category: Math.random() > 0.5 ? 'transfer' : 'payment',
        costCenter: Math.random() > 0.5 ? 'ADMIN' : 'SALES',
        date,
        status: 'confirmed',
        reference: `REF${Date.now()}${i}`,
        createdAt: date,
        updatedAt: date,
        createdBy: 'system',
        updatedBy: 'system',
      });
    }
    
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Lista todas as contas
   */
  async getAccounts(): Promise<ApiResponse<BankAccount[]>> {
    try {
      const accounts = Array.from(this.accounts.values());
      
      logger.info('Accounts retrieved successfully', {
        count: accounts.length,
      });

      return {
        success: true,
        data: accounts,
      };
    } catch (error) {
      logger.error('Failed to get accounts:', error);
      return {
        success: false,
        error: 'Erro ao buscar contas',
      };
    }
  }

  /**
   * Obtém uma conta específica
   */
  async getAccount(id: string): Promise<ApiResponse<BankAccount>> {
    try {
      const account = this.accounts.get(id);
      
      if (!account) {
        return {
          success: false,
          error: 'Conta não encontrada',
        };
      }

      logger.info('Account retrieved successfully', { accountId: id });

      return {
        success: true,
        data: account,
      };
    } catch (error) {
      logger.error('Failed to get account:', error);
      return {
        success: false,
        error: 'Erro ao buscar conta',
      };
    }
  }

  /**
   * Cria uma nova conta
   */
  async createAccount(accountData: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<ApiResponse<BankAccount>> {
    try {
      const id = `acc_${Date.now()}`;
      const now = new Date();
      
      const account: BankAccount = {
        ...accountData,
        id,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system', // TODO: Get from auth context
        updatedBy: 'system',
      };

      this.accounts.set(id, account);
      this.transactions.set(id, []);

      logger.info('Account created successfully', {
        accountId: id,
        accountName: account.name,
      });

      return {
        success: true,
        data: account,
      };
    } catch (error) {
      logger.error('Failed to create account:', error);
      return {
        success: false,
        error: 'Erro ao criar conta',
      };
    }
  }

  /**
   * Atualiza uma conta
   */
  async updateAccount(id: string, updates: Partial<BankAccount>): Promise<ApiResponse<BankAccount>> {
    try {
      const account = this.accounts.get(id);
      
      if (!account) {
        return {
          success: false,
          error: 'Conta não encontrada',
        };
      }

      const updatedAccount: BankAccount = {
        ...account,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
        updatedBy: 'system', // TODO: Get from auth context
      };

      this.accounts.set(id, updatedAccount);

      logger.info('Account updated successfully', {
        accountId: id,
        updates: Object.keys(updates),
      });

      return {
        success: true,
        data: updatedAccount,
      };
    } catch (error) {
      logger.error('Failed to update account:', error);
      return {
        success: false,
        error: 'Erro ao atualizar conta',
      };
    }
  }

  /**
   * Remove uma conta
   */
  async deleteAccount(id: string): Promise<ApiResponse<void>> {
    try {
      const account = this.accounts.get(id);
      
      if (!account) {
        return {
          success: false,
          error: 'Conta não encontrada',
        };
      }

      this.accounts.delete(id);
      this.transactions.delete(id);

      logger.info('Account deleted successfully', { accountId: id });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to delete account:', error);
      return {
        success: false,
        error: 'Erro ao remover conta',
      };
    }
  }

  /**
   * Sincroniza saldo com o banco
   */
  async syncBalance(accountId: string): Promise<ApiResponse<BankAccount>> {
    try {
      const account = this.accounts.get(accountId);
      
      if (!account) {
        return {
          success: false,
          error: 'Conta não encontrada',
        };
      }

      // Integração com banco
      const bankBalance = await bankIntegration.getBalance(accountId);
      
      const updatedAccount: BankAccount = {
        ...account,
        balance: bankBalance.balance,
        updatedAt: new Date(),
        updatedBy: 'system',
        lastSync: new Date(),
      };

      this.accounts.set(accountId, updatedAccount);

      logger.info('Account balance synced successfully', {
        accountId,
        oldBalance: account.balance,
        newBalance: bankBalance.balance,
      });

      return {
        success: true,
        data: updatedAccount,
      };
    } catch (error) {
      logger.error('Failed to sync account balance:', error);
      return {
        success: false,
        error: 'Erro ao sincronizar saldo',
      };
    }
  }

  /**
   * Obtém transações de uma conta
   */
  async getAccountTransactions(accountId: string, options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<Transaction[]>> {
    try {
      const account = this.accounts.get(accountId);
      
      if (!account) {
        return {
          success: false,
          error: 'Conta não encontrada',
        };
      }

      let transactions = this.transactions.get(accountId) || [];

      // Filtrar por data
      if (options.startDate || options.endDate) {
        transactions = transactions.filter(txn => {
          const txnDate = txn.date;
          if (options.startDate && txnDate < options.startDate) return false;
          if (options.endDate && txnDate > options.endDate) return false;
          return true;
        });
      }

      // Paginação
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      const paginatedTransactions = transactions.slice(offset, offset + limit);

      logger.info('Account transactions retrieved successfully', {
        accountId,
        total: transactions.length,
        returned: paginatedTransactions.length,
      });

      return {
        success: true,
        data: paginatedTransactions,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total: transactions.length,
          totalPages: Math.ceil(transactions.length / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get account transactions:', error);
      return {
        success: false,
        error: 'Erro ao buscar transações',
      };
    }
  }

  /**
   * Importa transações do banco
   */
  async importTransactions(accountId: string, startDate: Date, endDate: Date): Promise<ApiResponse<Transaction[]>> {
    try {
      const account = this.accounts.get(accountId);
      
      if (!account) {
        return {
          success: false,
          error: 'Conta não encontrada',
        };
      }

      // Integração com banco
      const bankStatement = await bankIntegration.getStatement(accountId, startDate, endDate);
      
      const importedTransactions: Transaction[] = bankStatement.transactions.map(bankTxn => ({
        id: `imported_${bankTxn.id}`,
        accountId,
        type: bankTxn.type,
        amount: bankTxn.amount,
        description: bankTxn.description,
        category: bankTxn.category || 'imported',
        date: bankTxn.date,
        status: 'confirmed',
        reference: bankTxn.reference,
        integrationId: bankTxn.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      }));

      // Adicionar transações importadas
      const existingTransactions = this.transactions.get(accountId) || [];
      const newTransactions = [...existingTransactions, ...importedTransactions];
      this.transactions.set(accountId, newTransactions);

      logger.info('Transactions imported successfully', {
        accountId,
        imported: importedTransactions.length,
        total: newTransactions.length,
      });

      return {
        success: true,
        data: importedTransactions,
      };
    } catch (error) {
      logger.error('Failed to import transactions:', error);
      return {
        success: false,
        error: 'Erro ao importar transações',
      };
    }
  }

  /**
   * Testa conexão com o banco
   */
  async testBankConnection(accountId: string): Promise<ApiResponse<boolean>> {
    try {
      const account = this.accounts.get(accountId);
      
      if (!account) {
        return {
          success: false,
          error: 'Conta não encontrada',
        };
      }

      const isConnected = await bankIntegration.testConnection();

      logger.info('Bank connection test completed', {
        accountId,
        isConnected,
      });

      return {
        success: true,
        data: isConnected,
      };
    } catch (error) {
      logger.error('Bank connection test failed:', error);
      return {
        success: false,
        error: 'Erro ao testar conexão bancária',
      };
    }
  }

  /**
   * Obtém estatísticas das contas
   */
  async getAccountStats(): Promise<ApiResponse<{
    totalAccounts: number;
    activeAccounts: number;
    totalBalance: number;
    averageBalance: number;
  }>> {
    try {
      const accounts = Array.from(this.accounts.values());
      const activeAccounts = accounts.filter(acc => acc.status === 'active');
      const totalBalance = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      const averageBalance = activeAccounts.length > 0 ? totalBalance / activeAccounts.length : 0;

      const stats = {
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        totalBalance,
        averageBalance,
      };

      logger.info('Account stats retrieved successfully', stats);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      logger.error('Failed to get account stats:', error);
      return {
        success: false,
        error: 'Erro ao buscar estatísticas',
      };
    }
  }
}

// Instância singleton
export const accountService = new AccountService();

