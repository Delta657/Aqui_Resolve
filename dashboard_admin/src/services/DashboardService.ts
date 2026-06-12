import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { AccountService } from './AccountService';
import { InvoiceService } from './InvoiceService';
import { CashFlowService } from './CashFlowService';
import { PayrollService } from './PayrollService';
import { 
  DashboardData, 
  KPIMetrics, 
  CashFlowSummary, 
  Alert, 
  AccountBalance,
  FinancialTrend,
  AlertType,
  AlertPriority
} from '../types/finance';

export class DashboardService {
  private accountService: AccountService;
  private invoiceService: InvoiceService;
  private cashFlowService: CashFlowService;
  private payrollService: PayrollService;

  constructor() {
    this.accountService = new AccountService();
    this.invoiceService = new InvoiceService();
    this.cashFlowService = new CashFlowService();
    this.payrollService = new PayrollService();
  }

  /**
   * Obtém todos os dados do dashboard financeiro
   */
  async getDashboardData(userId: string, period: string = 'current'): Promise<DashboardData> {
    try {
      logger.info('Obtendo dados do dashboard financeiro', { userId, period });

      const [
        kpis,
        cashFlow,
        alerts,
        accountBalances,
        trends
      ] = await Promise.all([
        this.getKPIMetrics(period),
        this.getCashFlowSummary(period),
        this.getAlerts(),
        this.getAccountBalances(),
        this.getFinancialTrends(period)
      ]);

      const dashboardData: DashboardData = {
        kpis,
        cashFlow,
        alerts,
        accountBalances,
        trends,
        lastUpdated: new Date().toISOString(),
        period
      };

      logger.info('Dashboard financeiro carregado com sucesso', { 
        userId, 
        period,
        kpiCount: kpis.length,
        alertCount: alerts.length,
        accountCount: accountBalances.length
      });

      return dashboardData;
    } catch (error) {
      logger.error('Erro ao carregar dashboard financeiro', { 
        userId, 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Calcula KPIs financeiros para o período especificado
   */
  async getKPIMetrics(period: string = 'current'): Promise<KPIMetrics[]> {
    try {
      const accounts = await this.accountService.getAccounts();
      const invoices = await this.invoiceService.getInvoices();
      const cashFlow = await this.cashFlowService.getEntries();

      // Filtra dados por período
      const periodData = this.filterByPeriod(period);
      const filteredInvoices = invoices.filter(invoice => 
        periodData.startDate <= new Date(invoice.createdAt) && 
        new Date(invoice.createdAt) <= periodData.endDate
      );
      const filteredCashFlow = cashFlow.filter(entry => 
        periodData.startDate <= new Date(entry.date) && 
        new Date(entry.date) <= periodData.endDate
      );

      // Calcula receitas
      const totalRevenue = filteredInvoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      // Calcula despesas
      const totalExpenses = filteredCashFlow
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      // Calcula lucro
      const netProfit = totalRevenue - totalExpenses;

      // Calcula contas a receber
      const accountsReceivable = filteredInvoices
        .filter(invoice => invoice.status === 'pending')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      // Calcula contas a pagar
      const accountsPayable = filteredCashFlow
        .filter(entry => entry.type === 'expense' && entry.status === 'pending')
        .reduce((sum, entry) => sum + entry.amount, 0);

      // Calcula saldo total das contas
      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

      // Calcula fluxo de caixa
      const cashFlowAmount = filteredCashFlow
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0) - totalExpenses;

      const kpis: KPIMetrics[] = [
        {
          id: 'revenue',
          name: 'Receita Total',
          value: totalRevenue,
          currency: 'BRL',
          change: this.calculateChange(totalRevenue, 150000), // Mock previous period
          changeType: 'percentage',
          trend: totalRevenue > 150000 ? 'up' : 'down',
          icon: 'trending-up',
          color: 'green'
        },
        {
          id: 'expenses',
          name: 'Despesas Totais',
          value: totalExpenses,
          currency: 'BRL',
          change: this.calculateChange(totalExpenses, 120000), // Mock previous period
          changeType: 'percentage',
          trend: totalExpenses < 120000 ? 'up' : 'down',
          icon: 'trending-down',
          color: 'red'
        },
        {
          id: 'profit',
          name: 'Lucro Líquido',
          value: netProfit,
          currency: 'BRL',
          change: this.calculateChange(netProfit, 30000), // Mock previous period
          changeType: 'percentage',
          trend: netProfit > 30000 ? 'up' : 'down',
          icon: 'dollar-sign',
          color: netProfit >= 0 ? 'green' : 'red'
        },
        {
          id: 'receivable',
          name: 'Contas a Receber',
          value: accountsReceivable,
          currency: 'BRL',
          change: this.calculateChange(accountsReceivable, 45000), // Mock previous period
          changeType: 'percentage',
          trend: accountsReceivable < 45000 ? 'up' : 'down',
          icon: 'credit-card',
          color: 'blue'
        },
        {
          id: 'payable',
          name: 'Contas a Pagar',
          value: accountsPayable,
          currency: 'BRL',
          change: this.calculateChange(accountsPayable, 35000), // Mock previous period
          changeType: 'percentage',
          trend: accountsPayable < 35000 ? 'up' : 'down',
          icon: 'file-text',
          color: 'orange'
        },
        {
          id: 'balance',
          name: 'Saldo Total',
          value: totalBalance,
          currency: 'BRL',
          change: this.calculateChange(totalBalance, 200000), // Mock previous period
          changeType: 'percentage',
          trend: totalBalance > 200000 ? 'up' : 'down',
          icon: 'wallet',
          color: 'green'
        },
        {
          id: 'cashflow',
          name: 'Fluxo de Caixa',
          value: cashFlowAmount,
          currency: 'BRL',
          change: this.calculateChange(cashFlowAmount, 25000), // Mock previous period
          changeType: 'percentage',
          trend: cashFlowAmount > 25000 ? 'up' : 'down',
          icon: 'activity',
          color: cashFlowAmount >= 0 ? 'green' : 'red'
        },
        {
          id: 'invoices',
          name: 'Faturas Emitidas',
          value: filteredInvoices.length,
          currency: null,
          change: this.calculateChange(filteredInvoices.length, 45), // Mock previous period
          changeType: 'percentage',
          trend: filteredInvoices.length > 45 ? 'up' : 'down',
          icon: 'file',
          color: 'blue'
        }
      ];

      logger.debug('KPIs calculados', { period, kpiCount: kpis.length });
      return kpis;
    } catch (error) {
      logger.error('Erro ao calcular KPIs', { period, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Obtém resumo do fluxo de caixa
   */
  async getCashFlowSummary(period: string = 'current'): Promise<CashFlowSummary> {
    try {
      const cashFlow = await this.cashFlowService.getEntries();
      const periodData = this.filterByPeriod(period);
      
      const filteredCashFlow = cashFlow.filter(entry => 
        periodData.startDate <= new Date(entry.date) && 
        new Date(entry.date) <= periodData.endDate
      );

      const income = filteredCashFlow
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const expenses = filteredCashFlow
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const netCashFlow = income - expenses;

      // Agrupa por categoria
      const incomeByCategory = this.groupByCategory(
        filteredCashFlow.filter(entry => entry.type === 'income')
      );
      const expensesByCategory = this.groupByCategory(
        filteredCashFlow.filter(entry => entry.type === 'expense')
      );

      const summary: CashFlowSummary = {
        period,
        totalIncome: income,
        totalExpenses: expenses,
        netCashFlow,
        incomeByCategory,
        expensesByCategory,
        dailyData: this.getDailyCashFlowData(filteredCashFlow),
        topCategories: this.getTopCategories(filteredCashFlow)
      };

      logger.debug('Resumo do fluxo de caixa calculado', { period, netCashFlow });
      return summary;
    } catch (error) {
      logger.error('Erro ao calcular resumo do fluxo de caixa', { 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém alertas financeiros
   */
  async getAlerts(): Promise<Alert[]> {
    try {
      const alerts: Alert[] = [];
      const invoices = await this.invoiceService.getInvoices();
      const cashFlow = await this.cashFlowService.getEntries();
      const accounts = await this.accountService.getAccounts();

      // Alerta para contas a receber vencidas
      const overdueInvoices = invoices.filter(invoice => {
        if (invoice.status !== 'pending') return false;
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        return dueDate < today;
      });

      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
        alerts.push({
          id: 'overdue-invoices',
          type: AlertType.ACCOUNTS_RECEIVABLE,
          priority: AlertPriority.HIGH,
          title: 'Contas a Receber Vencidas',
          message: `${overdueInvoices.length} faturas vencidas totalizando R$ ${totalOverdue.toFixed(2)}`,
          amount: totalOverdue,
          count: overdueInvoices.length,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      // Alerta para contas a pagar próximas do vencimento
      const upcomingPayables = cashFlow.filter(entry => {
        if (entry.type !== 'expense' || entry.status !== 'pending') return false;
        const dueDate = new Date(entry.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 7 && daysUntilDue > 0;
      });

      if (upcomingPayables.length > 0) {
        const totalUpcoming = upcomingPayables.reduce((sum, entry) => sum + entry.amount, 0);
        alerts.push({
          id: 'upcoming-payables',
          type: AlertType.ACCOUNTS_PAYABLE,
          priority: AlertPriority.MEDIUM,
          title: 'Contas a Pagar Próximas do Vencimento',
          message: `${upcomingPayables.length} contas vencem em até 7 dias totalizando R$ ${totalUpcoming.toFixed(2)}`,
          amount: totalUpcoming,
          count: upcomingPayables.length,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      // Alerta para saldo baixo
      const lowBalanceAccounts = accounts.filter(account => account.balance < 1000);
      if (lowBalanceAccounts.length > 0) {
        alerts.push({
          id: 'low-balance',
          type: AlertType.LOW_BALANCE,
          priority: AlertPriority.HIGH,
          title: 'Saldo Baixo nas Contas',
          message: `${lowBalanceAccounts.length} conta(s) com saldo abaixo de R$ 1.000,00`,
          amount: lowBalanceAccounts.reduce((sum, account) => sum + account.balance, 0),
          count: lowBalanceAccounts.length,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      // Alerta para fluxo de caixa negativo
      const recentCashFlow = cashFlow.filter(entry => {
        const entryDate = new Date(entry.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return entryDate >= thirtyDaysAgo;
      });

      const recentIncome = recentCashFlow
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);
      const recentExpenses = recentCashFlow
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      if (recentExpenses > recentIncome) {
        alerts.push({
          id: 'negative-cashflow',
          type: AlertType.CASH_FLOW,
          priority: AlertPriority.MEDIUM,
          title: 'Fluxo de Caixa Negativo',
          message: `Despesas (R$ ${recentExpenses.toFixed(2)}) superam receitas (R$ ${recentIncome.toFixed(2)}) nos últimos 30 dias`,
          amount: recentExpenses - recentIncome,
          count: 1,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      logger.debug('Alertas financeiros calculados', { alertCount: alerts.length });
      return alerts;
    } catch (error) {
      logger.error('Erro ao calcular alertas', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Obtém saldos das contas
   */
  async getAccountBalances(): Promise<AccountBalance[]> {
    try {
      const accounts = await this.accountService.getAccounts();
      
      const balances: AccountBalance[] = accounts.map(account => ({
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        balance: account.balance,
        currency: account.currency,
        lastSync: account.lastSync,
        status: account.status
      }));

      logger.debug('Saldos das contas obtidos', { accountCount: balances.length });
      return balances;
    } catch (error) {
      logger.error('Erro ao obter saldos das contas', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Obtém tendências financeiras
   */
  async getFinancialTrends(period: string = 'current'): Promise<FinancialTrend[]> {
    try {
      const invoices = await this.invoiceService.getInvoices();
      const cashFlow = await this.cashFlowService.getEntries();
      
      const periodData = this.filterByPeriod(period);
      
      // Agrupa dados por mês para análise de tendência
      const monthlyData = this.groupByMonth(
        invoices.filter(invoice => 
          periodData.startDate <= new Date(invoice.createdAt) && 
          new Date(invoice.createdAt) <= periodData.endDate
        ),
        cashFlow.filter(entry => 
          periodData.startDate <= new Date(entry.date) && 
          new Date(entry.date) <= periodData.endDate
        )
      );

      const trends: FinancialTrend[] = [
        {
          id: 'revenue-trend',
          name: 'Tendência de Receitas',
          data: monthlyData.map(item => ({
            period: item.month,
            value: item.revenue,
            change: item.revenueChange
          })),
          trend: this.calculateTrendDirection(monthlyData.map(item => item.revenue)),
          color: 'green'
        },
        {
          id: 'expense-trend',
          name: 'Tendência de Despesas',
          data: monthlyData.map(item => ({
            period: item.month,
            value: item.expenses,
            change: item.expensesChange
          })),
          trend: this.calculateTrendDirection(monthlyData.map(item => item.expenses)),
          color: 'red'
        },
        {
          id: 'profit-trend',
          name: 'Tendência de Lucro',
          data: monthlyData.map(item => ({
            period: item.month,
            value: item.profit,
            change: item.profitChange
          })),
          trend: this.calculateTrendDirection(monthlyData.map(item => item.profit)),
          color: 'blue'
        }
      ];

      logger.debug('Tendências financeiras calculadas', { period, trendCount: trends.length });
      return trends;
    } catch (error) {
      logger.error('Erro ao calcular tendências financeiras', { 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Marca alerta como lido
   */
  async markAlertAsRead(alertId: string, userId: string): Promise<void> {
    try {
      logger.info('Marcando alerta como lido', { alertId, userId });
      // Aqui seria implementada a lógica para marcar o alerta como lido no banco de dados
      // Por enquanto, apenas logamos a ação
    } catch (error) {
      logger.error('Erro ao marcar alerta como lido', { 
        alertId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // Métodos auxiliares privados

  private filterByPeriod(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case 'current':
        startDate.setMonth(now.getMonth());
        startDate.setDate(1);
        break;
      case 'previous':
        startDate.setMonth(now.getMonth() - 1);
        startDate.setDate(1);
        endDate.setMonth(now.getMonth());
        endDate.setDate(0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(quarter * 3);
        startDate.setDate(1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear());
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
      default:
        startDate.setMonth(now.getMonth());
        startDate.setDate(1);
    }

    return { startDate, endDate };
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private groupByCategory(entries: any[]): Record<string, number> {
    return entries.reduce((acc, entry) => {
      const category = entry.category || 'Sem categoria';
      acc[category] = (acc[category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private getDailyCashFlowData(entries: any[]): Array<{ date: string; income: number; expenses: number }> {
    const dailyData: Record<string, { income: number; expenses: number }> = {};

    entries.forEach(entry => {
      const date = new Date(entry.date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expenses: 0 };
      }

      if (entry.type === 'income') {
        dailyData[date].income += entry.amount;
      } else {
        dailyData[date].expenses += entry.amount;
      }
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getTopCategories(entries: any[]): Array<{ category: string; amount: number; type: 'income' | 'expense' }> {
    const categoryTotals: Record<string, { income: number; expense: number }> = {};

    entries.forEach(entry => {
      const category = entry.category || 'Sem categoria';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { income: 0, expense: 0 };
      }

      if (entry.type === 'income') {
        categoryTotals[category].income += entry.amount;
      } else {
        categoryTotals[category].expense += entry.amount;
      }
    });

    const topCategories: Array<{ category: string; amount: number; type: 'income' | 'expense' }> = [];

    Object.entries(categoryTotals).forEach(([category, totals]) => {
      if (totals.income > 0) {
        topCategories.push({ category, amount: totals.income, type: 'income' });
      }
      if (totals.expense > 0) {
        topCategories.push({ category, amount: totals.expense, type: 'expense' });
      }
    });

    return topCategories
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  private groupByMonth(invoices: any[], cashFlow: any[]): Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    revenueChange: number;
    expensesChange: number;
    profitChange: number;
  }> {
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {};

    // Processa faturas
    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        const month = new Date(invoice.createdAt).toISOString().substring(0, 7);
        monthlyData[month] = monthlyData[month] || { revenue: 0, expenses: 0 };
        monthlyData[month].revenue += invoice.totalAmount;
      }
    });

    // Processa fluxo de caixa
    cashFlow.forEach(entry => {
      const month = new Date(entry.date).toISOString().substring(0, 7);
      monthlyData[month] = monthlyData[month] || { revenue: 0, expenses: 0 };
      
      if (entry.type === 'income') {
        monthlyData[month].revenue += entry.amount;
      } else {
        monthlyData[month].expenses += entry.amount;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const result: Array<{
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
      revenueChange: number;
      expensesChange: number;
      profitChange: number;
    }> = [];

    sortedMonths.forEach((month, index) => {
      const data = monthlyData[month];
      const profit = data.revenue - data.expenses;

      const revenueChange = index > 0 ? 
        this.calculateChange(data.revenue, monthlyData[sortedMonths[index - 1]].revenue) : 0;
      const expensesChange = index > 0 ? 
        this.calculateChange(data.expenses, monthlyData[sortedMonths[index - 1]].expenses) : 0;
      const profitChange = index > 0 ? 
        this.calculateChange(profit, monthlyData[sortedMonths[index - 1]].revenue - monthlyData[sortedMonths[index - 1]].expenses) : 0;

      result.push({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit,
        revenueChange,
        expensesChange,
        profitChange
      });
    });

    return result;
  }

  private calculateTrendDirection(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3); // Últimos 3 valores
    const previous = values.slice(-6, -3); // 3 valores anteriores
    
    if (recent.length === 0 || previous.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }
}



