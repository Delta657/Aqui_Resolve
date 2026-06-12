import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { 
  ClosingPeriod, 
  ClosingReconciliation, 
  ClosingAdjustment, 
  ClosingForecast,
  ClosingStatus,
  ClosingFilter,
  ClosingStatistics
} from '../types/finance';
import { AccountService } from './AccountService';
import { InvoiceService } from './InvoiceService';
import { CashFlowService } from './CashFlowService';
import { PayrollService } from './PayrollService';

export class ClosingService {
  private periods: ClosingPeriod[] = [];
  private reconciliations: ClosingReconciliation[] = [];
  private adjustments: ClosingAdjustment[] = [];
  private forecasts: ClosingForecast[] = [];

  private accountService: AccountService;
  private invoiceService: InvoiceService;
  private cashFlowService: CashFlowService;
  private payrollService: PayrollService;

  constructor() {
    this.accountService = new AccountService();
    this.invoiceService = new InvoiceService();
    this.cashFlowService = new CashFlowService();
    this.payrollService = new PayrollService();
    this.initializeMockData();
  }

  /**
   * Obtém todos os períodos de fechamento
   */
  async getPeriods(filter?: ClosingFilter): Promise<ClosingPeriod[]> {
    try {
      let filteredPeriods = [...this.periods];

      if (filter) {
        if (filter.status) {
          filteredPeriods = filteredPeriods.filter(period => period.status === filter.status);
        }
        if (filter.year) {
          filteredPeriods = filteredPeriods.filter(period => period.year === filter.year);
        }
        if (filter.month) {
          filteredPeriods = filteredPeriods.filter(period => period.month === filter.month);
        }
      }

      // Ordena por período (mais recente primeiro)
      filteredPeriods.sort((a, b) => {
        const periodA = `${a.year}-${a.month}`;
        const periodB = `${b.year}-${b.month}`;
        return periodB.localeCompare(periodA);
      });

      logger.debug('Períodos de fechamento obtidos', { 
        total: this.periods.length, 
        filtered: filteredPeriods.length,
        filter 
      });

      return filteredPeriods;
    } catch (error) {
      logger.error('Erro ao obter períodos de fechamento', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém um período específico por ID
   */
  async getPeriodById(id: string): Promise<ClosingPeriod | null> {
    try {
      const period = this.periods.find(p => p.id === id);
      
      if (period) {
        logger.debug('Período de fechamento encontrado', { id });
      } else {
        logger.debug('Período de fechamento não encontrado', { id });
      }

      return period || null;
    } catch (error) {
      logger.error('Erro ao obter período de fechamento', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cria um novo período de fechamento
   */
  async createPeriod(periodData: Omit<ClosingPeriod, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClosingPeriod> {
    try {
      // Validações básicas
      if (!periodData.year || periodData.year < 2020) {
        throw new Error('Ano inválido');
      }

      if (!periodData.month || periodData.month < 1 || periodData.month > 12) {
        throw new Error('Mês inválido');
      }

      // Verifica se já existe um período para este mês/ano
      const existingPeriod = this.periods.find(p => 
        p.year === periodData.year && p.month === periodData.month
      );
      if (existingPeriod) {
        throw new Error('Já existe um período de fechamento para este mês/ano');
      }

      const newPeriod: ClosingPeriod = {
        id: this.generateId(),
        ...periodData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.periods.push(newPeriod);

      logger.info('Novo período de fechamento criado', { 
        id: newPeriod.id,
        year: newPeriod.year,
        month: newPeriod.month
      });

      return newPeriod;
    } catch (error) {
      logger.error('Erro ao criar período de fechamento', { 
        periodData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Atualiza um período existente
   */
  async updatePeriod(id: string, updateData: Partial<ClosingPeriod>): Promise<ClosingPeriod> {
    try {
      const periodIndex = this.periods.findIndex(p => p.id === id);
      if (periodIndex === -1) {
        throw new Error('Período não encontrado');
      }

      const currentPeriod = this.periods[periodIndex];

      // Validações
      if (updateData.status === 'locked' && currentPeriod.status !== 'locked') {
        // Verifica se há conciliações pendentes
        const pendingReconciliations = this.reconciliations.filter(r => 
          r.periodId === id && r.status === 'pending'
        );
        if (pendingReconciliations.length > 0) {
          throw new Error('Não é possível bloquear o período com conciliações pendentes');
        }
      }

      const updatedPeriod: ClosingPeriod = {
        ...currentPeriod,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.periods[periodIndex] = updatedPeriod;

      logger.info('Período de fechamento atualizado', { 
        id,
        year: updatedPeriod.year,
        month: updatedPeriod.month,
        status: updatedPeriod.status
      });

      return updatedPeriod;
    } catch (error) {
      logger.error('Erro ao atualizar período de fechamento', { 
        id, 
        updateData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Bloqueia um período de fechamento
   */
  async lockPeriod(id: string, userId: string): Promise<ClosingPeriod> {
    try {
      const period = await this.getPeriodById(id);
      if (!period) {
        throw new Error('Período não encontrado');
      }

      if (period.status === 'locked') {
        throw new Error('Período já está bloqueado');
      }

      // Executa conciliação automática antes de bloquear
      await this.performAutomaticReconciliation(id);

      const updatedPeriod = await this.updatePeriod(id, {
        status: 'locked',
        lockedAt: new Date().toISOString(),
        lockedBy: userId
      });

      logger.info('Período bloqueado com sucesso', { 
        id,
        year: updatedPeriod.year,
        month: updatedPeriod.month,
        lockedBy: userId
      });

      return updatedPeriod;
    } catch (error) {
      logger.error('Erro ao bloquear período', { 
        id, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Desbloqueia um período de fechamento
   */
  async unlockPeriod(id: string, userId: string): Promise<ClosingPeriod> {
    try {
      const period = await this.getPeriodById(id);
      if (!period) {
        throw new Error('Período não encontrado');
      }

      if (period.status !== 'locked') {
        throw new Error('Período não está bloqueado');
      }

      const updatedPeriod = await this.updatePeriod(id, {
        status: 'open',
        lockedAt: null,
        lockedBy: null
      });

      logger.info('Período desbloqueado com sucesso', { 
        id,
        year: updatedPeriod.year,
        month: updatedPeriod.month,
        unlockedBy: userId
      });

      return updatedPeriod;
    } catch (error) {
      logger.error('Erro ao desbloquear período', { 
        id, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todas as conciliações
   */
  async getReconciliations(filter?: { periodId?: string; status?: string }): Promise<ClosingReconciliation[]> {
    try {
      let filteredReconciliations = [...this.reconciliations];

      if (filter) {
        if (filter.periodId) {
          filteredReconciliations = filteredReconciliations.filter(r => r.periodId === filter.periodId);
        }
        if (filter.status) {
          filteredReconciliations = filteredReconciliations.filter(r => r.status === filter.status);
        }
      }

      // Ordena por data de criação (mais recente primeiro)
      filteredReconciliations.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      logger.debug('Conciliações obtidas', { 
        total: this.reconciliations.length, 
        filtered: filteredReconciliations.length,
        filter 
      });

      return filteredReconciliations;
    } catch (error) {
      logger.error('Erro ao obter conciliações', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Executa conciliação automática para um período
   */
  async performAutomaticReconciliation(periodId: string): Promise<ClosingReconciliation> {
    try {
      const period = await this.getPeriodById(periodId);
      if (!period) {
        throw new Error('Período não encontrado');
      }

      logger.info('Iniciando conciliação automática', { periodId });

      // Obtém dados do período
      const periodString = `${period.year}-${String(period.month).padStart(2, '0')}`;
      
      const accounts = await this.accountService.getAccounts();
      const invoices = await this.invoiceService.getInvoices();
      const cashFlow = await this.cashFlowService.getEntries();
      const payroll = await this.payrollService.getCharges({ period: periodString });

      // Filtra dados do período
      const periodStart = new Date(period.year, period.month - 1, 1);
      const periodEnd = new Date(period.year, period.month, 0);

      const periodInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= periodStart && invoiceDate <= periodEnd;
      });

      const periodCashFlow = cashFlow.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= periodStart && entryDate <= periodEnd;
      });

      // Calcula totais
      const totalRevenue = periodInvoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      const totalExpenses = periodCashFlow
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const totalPayroll = payroll
        .filter(charge => charge.status === 'confirmed')
        .reduce((sum, charge) => sum + charge.totalAmount, 0);

      const totalBankBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

      // Calcula diferenças
      const expectedCashFlow = totalRevenue - totalExpenses - totalPayroll;
      const actualCashFlow = totalBankBalance;
      const difference = expectedCashFlow - actualCashFlow;

      const reconciliation: ClosingReconciliation = {
        id: this.generateId(),
        periodId,
        type: 'automatic',
        description: `Conciliação automática - ${period.year}/${period.month}`,
        expectedAmount: expectedCashFlow,
        actualAmount: actualCashFlow,
        difference,
        status: difference === 0 ? 'reconcilied' : 'pending',
        details: {
          totalRevenue,
          totalExpenses,
          totalPayroll,
          totalBankBalance,
          periodInvoices: periodInvoices.length,
          periodCashFlow: periodCashFlow.length,
          periodPayroll: payroll.length
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.reconciliations.push(reconciliation);

      logger.info('Conciliação automática concluída', { 
        periodId,
        difference,
        status: reconciliation.status
      });

      return reconciliation;
    } catch (error) {
      logger.error('Erro na conciliação automática', { 
        periodId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todos os ajustes
   */
  async getAdjustments(filter?: { periodId?: string; type?: string }): Promise<ClosingAdjustment[]> {
    try {
      let filteredAdjustments = [...this.adjustments];

      if (filter) {
        if (filter.periodId) {
          filteredAdjustments = filteredAdjustments.filter(a => a.periodId === filter.periodId);
        }
        if (filter.type) {
          filteredAdjustments = filteredAdjustments.filter(a => a.type === filter.type);
        }
      }

      // Ordena por data de criação (mais recente primeiro)
      filteredAdjustments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      logger.debug('Ajustes obtidos', { 
        total: this.adjustments.length, 
        filtered: filteredAdjustments.length,
        filter 
      });

      return filteredAdjustments;
    } catch (error) {
      logger.error('Erro ao obter ajustes', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cria um novo ajuste
   */
  async createAdjustment(adjustmentData: Omit<ClosingAdjustment, 'id' | 'createdAt'>): Promise<ClosingAdjustment> {
    try {
      // Validações básicas
      if (!adjustmentData.periodId) {
        throw new Error('O ID do período é obrigatório');
      }

      if (!adjustmentData.description || adjustmentData.description.trim().length === 0) {
        throw new Error('A descrição é obrigatória');
      }

      if (adjustmentData.amount === 0) {
        throw new Error('O valor não pode ser zero');
      }

      // Verifica se o período existe
      const period = await this.getPeriodById(adjustmentData.periodId);
      if (!period) {
        throw new Error('Período não encontrado');
      }

      // Verifica se o período está bloqueado
      if (period.status === 'locked') {
        throw new Error('Não é possível criar ajustes em períodos bloqueados');
      }

      const newAdjustment: ClosingAdjustment = {
        id: this.generateId(),
        ...adjustmentData,
        createdAt: new Date().toISOString()
      };

      this.adjustments.push(newAdjustment);

      logger.info('Novo ajuste criado', { 
        id: newAdjustment.id,
        periodId: newAdjustment.periodId,
        type: newAdjustment.type,
        amount: newAdjustment.amount
      });

      return newAdjustment;
    } catch (error) {
      logger.error('Erro ao criar ajuste', { 
        adjustmentData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todas as previsões
   */
  async getForecasts(filter?: { periodId?: string; type?: string }): Promise<ClosingForecast[]> {
    try {
      let filteredForecasts = [...this.forecasts];

      if (filter) {
        if (filter.periodId) {
          filteredForecasts = filteredForecasts.filter(f => f.periodId === filter.periodId);
        }
        if (filter.type) {
          filteredForecasts = filteredForecasts.filter(f => f.type === filter.type);
        }
      }

      // Ordena por data de criação (mais recente primeiro)
      filteredForecasts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      logger.debug('Previsões obtidas', { 
        total: this.forecasts.length, 
        filtered: filteredForecasts.length,
        filter 
      });

      return filteredForecasts;
    } catch (error) {
      logger.error('Erro ao obter previsões', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cria uma nova previsão
   */
  async createForecast(forecastData: Omit<ClosingForecast, 'id' | 'createdAt'>): Promise<ClosingForecast> {
    try {
      // Validações básicas
      if (!forecastData.periodId) {
        throw new Error('O ID do período é obrigatório');
      }

      if (!forecastData.description || forecastData.description.trim().length === 0) {
        throw new Error('A descrição é obrigatória');
      }

      if (forecastData.forecastedAmount <= 0) {
        throw new Error('O valor previsto deve ser maior que zero');
      }

      // Verifica se o período existe
      const period = await this.getPeriodById(forecastData.periodId);
      if (!period) {
        throw new Error('Período não encontrado');
      }

      const newForecast: ClosingForecast = {
        id: this.generateId(),
        ...forecastData,
        createdAt: new Date().toISOString()
      };

      this.forecasts.push(newForecast);

      logger.info('Nova previsão criada', { 
        id: newForecast.id,
        periodId: newForecast.periodId,
        type: newForecast.type,
        forecastedAmount: newForecast.forecastedAmount
      });

      return newForecast;
    } catch (error) {
      logger.error('Erro ao criar previsão', { 
        forecastData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas de fechamento
   */
  async getStatistics(periodId: string): Promise<ClosingStatistics> {
    try {
      const period = await this.getPeriodById(periodId);
      if (!period) {
        throw new Error('Período não encontrado');
      }

      const reconciliations = await this.getReconciliations({ periodId });
      const adjustments = await this.getAdjustments({ periodId });
      const forecasts = await this.getForecasts({ periodId });

      // Calcula totais
      const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
      const totalForecasts = forecasts.reduce((sum, f) => sum + f.forecastedAmount, 0);
      const pendingReconciliations = reconciliations.filter(r => r.status === 'pending').length;

      const statistics: ClosingStatistics = {
        periodId,
        period: `${period.year}/${period.month}`,
        status: period.status,
        totalReconciliations: reconciliations.length,
        pendingReconciliations,
        totalAdjustments,
        totalForecasts,
        reconciliationsByStatus: this.groupByStatus(reconciliations),
        adjustmentsByType: this.groupByType(adjustments),
        forecastsByType: this.groupByType(forecasts),
        variance: totalForecasts > 0 ? ((totalAdjustments - totalForecasts) / totalForecasts) * 100 : 0
      };

      logger.debug('Estatísticas de fechamento calculadas', { periodId, variance: statistics.variance });
      return statistics;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de fechamento', { 
        periodId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // Métodos auxiliares privados

  private initializeMockData(): void {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Períodos de fechamento
    this.periods = [
      {
        id: 'period-1',
        year: currentYear,
        month: currentMonth,
        description: `Fechamento ${currentYear}/${currentMonth}`,
        status: 'open',
        startDate: new Date(currentYear, currentMonth - 1, 1).toISOString(),
        endDate: new Date(currentYear, currentMonth, 0).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'period-2',
        year: currentYear,
        month: currentMonth - 1,
        description: `Fechamento ${currentYear}/${currentMonth - 1}`,
        status: 'locked',
        startDate: new Date(currentYear, currentMonth - 2, 1).toISOString(),
        endDate: new Date(currentYear, currentMonth - 1, 0).toISOString(),
        lockedAt: new Date().toISOString(),
        lockedBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Conciliações
    this.reconciliations = [
      {
        id: 'recon-1',
        periodId: 'period-1',
        type: 'automatic',
        description: 'Conciliação automática - Receitas vs. Banco',
        expectedAmount: 150000,
        actualAmount: 148500,
        difference: 1500,
        status: 'pending',
        details: {
          totalRevenue: 150000,
          totalExpenses: 80000,
          totalPayroll: 30000,
          totalBankBalance: 148500,
          periodInvoices: 25,
          periodCashFlow: 45,
          periodPayroll: 3
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Ajustes
    this.adjustments = [
      {
        id: 'adj-1',
        periodId: 'period-1',
        type: 'revenue',
        description: 'Ajuste de receita - Correção de faturamento',
        amount: 1500,
        reason: 'Correção de valores de faturamento',
        createdBy: 'financeiro',
        createdAt: new Date().toISOString()
      },
      {
        id: 'adj-2',
        periodId: 'period-1',
        type: 'expense',
        description: 'Ajuste de despesa - Correção de fornecedor',
        amount: -800,
        reason: 'Correção de valores de fornecedor',
        createdBy: 'financeiro',
        createdAt: new Date().toISOString()
      }
    ];

    // Previsões
    this.forecasts = [
      {
        id: 'forecast-1',
        periodId: 'period-1',
        type: 'revenue',
        description: 'Previsão de receita - Vendas',
        forecastedAmount: 160000,
        actualAmount: 150000,
        variance: -6.25,
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'forecast-2',
        periodId: 'period-1',
        type: 'expense',
        description: 'Previsão de despesa - Operacional',
        forecastedAmount: 85000,
        actualAmount: 80000,
        variance: 5.88,
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      }
    ];

    logger.info('Dados mock de fechamento inicializados', {
      periods: this.periods.length,
      reconciliations: this.reconciliations.length,
      adjustments: this.adjustments.length,
      forecasts: this.forecasts.length
    });
  }

  private generateId(): string {
    return `closing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupByStatus(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByType(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}



