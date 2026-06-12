import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { 
  Report, 
  ReportType, 
  ReportFormat, 
  ReportFilter, 
  ReportTemplate,
  ReportSchedule,
  ReportExecution,
  ReportStatistics
} from '../types/finance';
import { AccountService } from './AccountService';
import { InvoiceService } from './InvoiceService';
import { CashFlowService } from './CashFlowService';
import { PayrollService } from './PayrollService';
import { DashboardService } from './DashboardService';
import { ClosingService } from './ClosingService';

export class ReportService {
  private reports: Report[] = [];
  private templates: ReportTemplate[] = [];
  private schedules: ReportSchedule[] = [];
  private executions: ReportExecution[] = [];

  private accountService: AccountService;
  private invoiceService: InvoiceService;
  private cashFlowService: CashFlowService;
  private payrollService: PayrollService;
  private dashboardService: DashboardService;
  private closingService: ClosingService;

  constructor() {
    this.accountService = new AccountService();
    this.invoiceService = new InvoiceService();
    this.cashFlowService = new CashFlowService();
    this.payrollService = new PayrollService();
    this.dashboardService = new DashboardService();
    this.closingService = new ClosingService();
    this.initializeMockData();
  }

  /**
   * Obtém todos os relatórios
   */
  async getReports(filter?: ReportFilter): Promise<Report[]> {
    try {
      let filteredReports = [...this.reports];

      if (filter) {
        if (filter.type) {
          filteredReports = filteredReports.filter(report => report.type === filter.type);
        }
        if (filter.status) {
          filteredReports = filteredReports.filter(report => report.status === filter.status);
        }
        if (filter.createdBy) {
          filteredReports = filteredReports.filter(report => report.createdBy === filter.createdBy);
        }
        if (filter.startDate) {
          filteredReports = filteredReports.filter(report => 
            new Date(report.createdAt) >= new Date(filter.startDate!)
          );
        }
        if (filter.endDate) {
          filteredReports = filteredReports.filter(report => 
            new Date(report.createdAt) <= new Date(filter.endDate!)
          );
        }
      }

      // Ordena por data de criação (mais recente primeiro)
      filteredReports.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      logger.debug('Relatórios obtidos', { 
        total: this.reports.length, 
        filtered: filteredReports.length,
        filter 
      });

      return filteredReports;
    } catch (error) {
      logger.error('Erro ao obter relatórios', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém um relatório específico por ID
   */
  async getReportById(id: string): Promise<Report | null> {
    try {
      const report = this.reports.find(r => r.id === id);
      
      if (report) {
        logger.debug('Relatório encontrado', { id });
      } else {
        logger.debug('Relatório não encontrado', { id });
      }

      return report || null;
    } catch (error) {
      logger.error('Erro ao obter relatório', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Gera um novo relatório
   */
  async generateReport(
    type: ReportType,
    format: ReportFormat,
    filter: ReportFilter,
    createdBy: string
  ): Promise<Report> {
    try {
      logger.info('Iniciando geração de relatório', { type, format, filter, createdBy });

      // Validações básicas
      if (!type) {
        throw new Error('O tipo de relatório é obrigatório');
      }

      if (!format) {
        throw new Error('O formato do relatório é obrigatório');
      }

      // Gera dados do relatório baseado no tipo
      const reportData = await this.generateReportData(type, filter);
      
      // Gera o arquivo no formato especificado
      const fileData = await this.generateFile(format, reportData);

      const report: Report = {
        id: this.generateId(),
        type,
        format,
        filter,
        status: 'completed',
        fileUrl: fileData.url,
        fileSize: fileData.size,
        recordCount: reportData.recordCount,
        totalAmount: reportData.totalAmount,
        createdBy,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        executionTime: fileData.executionTime
      };

      this.reports.push(report);

      // Registra execução
      await this.recordExecution(report.id, 'success', fileData.executionTime);

      logger.info('Relatório gerado com sucesso', { 
        id: report.id,
        type,
        format,
        recordCount: report.recordCount,
        executionTime: report.executionTime
      });

      return report;
    } catch (error) {
      logger.error('Erro ao gerar relatório', { 
        type, 
        format, 
        filter, 
        createdBy,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      // Registra execução com erro
      const failedReport: Report = {
        id: this.generateId(),
        type,
        format,
        filter,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdBy,
        createdAt: new Date().toISOString()
      };

      this.reports.push(failedReport);
      await this.recordExecution(failedReport.id, 'failed', 0);

      throw error;
    }
  }

  /**
   * Obtém todos os templates de relatório
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      logger.debug('Templates de relatório obtidos', { count: this.templates.length });
      return [...this.templates];
    } catch (error) {
      logger.error('Erro ao obter templates de relatório', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Cria um novo template de relatório
   */
  async createTemplate(templateData: Omit<ReportTemplate, 'id' | 'createdAt'>): Promise<ReportTemplate> {
    try {
      // Validações básicas
      if (!templateData.name || templateData.name.trim().length === 0) {
        throw new Error('O nome do template é obrigatório');
      }

      if (!templateData.type) {
        throw new Error('O tipo de relatório é obrigatório');
      }

      // Verifica se já existe um template com o mesmo nome
      const existingTemplate = this.templates.find(t => 
        t.name.toLowerCase() === templateData.name.toLowerCase()
      );
      if (existingTemplate) {
        throw new Error('Já existe um template com este nome');
      }

      const newTemplate: ReportTemplate = {
        id: this.generateId(),
        ...templateData,
        createdAt: new Date().toISOString()
      };

      this.templates.push(newTemplate);

      logger.info('Novo template de relatório criado', { 
        id: newTemplate.id,
        name: newTemplate.name,
        type: newTemplate.type
      });

      return newTemplate;
    } catch (error) {
      logger.error('Erro ao criar template de relatório', { 
        templateData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todos os agendamentos de relatório
   */
  async getSchedules(): Promise<ReportSchedule[]> {
    try {
      logger.debug('Agendamentos de relatório obtidos', { count: this.schedules.length });
      return [...this.schedules];
    } catch (error) {
      logger.error('Erro ao obter agendamentos de relatório', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Cria um novo agendamento de relatório
   */
  async createSchedule(scheduleData: Omit<ReportSchedule, 'id' | 'createdAt'>): Promise<ReportSchedule> {
    try {
      // Validações básicas
      if (!scheduleData.name || scheduleData.name.trim().length === 0) {
        throw new Error('O nome do agendamento é obrigatório');
      }

      if (!scheduleData.type) {
        throw new Error('O tipo de relatório é obrigatório');
      }

      if (!scheduleData.frequency) {
        throw new Error('A frequência é obrigatória');
      }

      const newSchedule: ReportSchedule = {
        id: this.generateId(),
        ...scheduleData,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      this.schedules.push(newSchedule);

      logger.info('Novo agendamento de relatório criado', { 
        id: newSchedule.id,
        name: newSchedule.name,
        type: newSchedule.type,
        frequency: newSchedule.frequency
      });

      return newSchedule;
    } catch (error) {
      logger.error('Erro ao criar agendamento de relatório', { 
        scheduleData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Executa agendamentos pendentes
   */
  async executeScheduledReports(): Promise<Report[]> {
    try {
      logger.info('Iniciando execução de relatórios agendados');

      const activeSchedules = this.schedules.filter(s => s.status === 'active');
      const generatedReports: Report[] = [];

      for (const schedule of activeSchedules) {
        try {
          // Verifica se é hora de executar o agendamento
          if (this.shouldExecuteSchedule(schedule)) {
            const report = await this.generateReport(
              schedule.type,
              schedule.format || 'pdf',
              schedule.filter || {},
              schedule.createdBy || 'system'
            );

            generatedReports.push(report);

            // Atualiza última execução
            schedule.lastExecutedAt = new Date().toISOString();
            schedule.nextExecutionAt = this.calculateNextExecution(schedule);

            logger.info('Relatório agendado executado', { 
              scheduleId: schedule.id,
              reportId: report.id
            });
          }
        } catch (error) {
          logger.error('Erro ao executar relatório agendado', { 
            scheduleId: schedule.id,
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      logger.info('Execução de relatórios agendados concluída', { 
        totalSchedules: activeSchedules.length,
        executedReports: generatedReports.length
      });

      return generatedReports;
    } catch (error) {
      logger.error('Erro na execução de relatórios agendados', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas de relatórios
   */
  async getStatistics(period: string = 'current'): Promise<ReportStatistics> {
    try {
      const reports = await this.getReports();
      const schedules = await this.getSchedules();
      const executions = await this.getExecutions();

      // Filtra por período
      const periodData = this.filterByPeriod(period);
      const filteredReports = reports.filter(report => 
        periodData.startDate <= new Date(report.createdAt) && 
        new Date(report.createdAt) <= periodData.endDate
      );

      // Calcula totais
      const totalReports = filteredReports.length;
      const successfulReports = filteredReports.filter(r => r.status === 'completed').length;
      const failedReports = filteredReports.filter(r => r.status === 'failed').length;
      const totalExecutions = executions.filter(e => 
        periodData.startDate <= new Date(e.createdAt) && 
        new Date(e.createdAt) <= periodData.endDate
      ).length;

      // Agrupa por tipo
      const reportsByType = this.groupByType(filteredReports);
      const reportsByFormat = this.groupByFormat(filteredReports);
      const reportsByStatus = this.groupByStatus(filteredReports);

      // Calcula médias
      const averageExecutionTime = filteredReports.length > 0 ? 
        filteredReports.reduce((sum, r) => sum + (r.executionTime || 0), 0) / filteredReports.length : 0;

      const statistics: ReportStatistics = {
        period,
        totalReports,
        successfulReports,
        failedReports,
        totalSchedules: schedules.length,
        activeSchedules: schedules.filter(s => s.status === 'active').length,
        totalExecutions,
        averageExecutionTime,
        reportsByType,
        reportsByFormat,
        reportsByStatus,
        topReportTypes: this.getTopReportTypes(filteredReports)
      };

      logger.debug('Estatísticas de relatórios calculadas', { period, totalReports });
      return statistics;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de relatórios', { 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todas as execuções
   */
  async getExecutions(filter?: { reportId?: string; status?: string }): Promise<ReportExecution[]> {
    try {
      let filteredExecutions = [...this.executions];

      if (filter) {
        if (filter.reportId) {
          filteredExecutions = filteredExecutions.filter(e => e.reportId === filter.reportId);
        }
        if (filter.status) {
          filteredExecutions = filteredExecutions.filter(e => e.status === filter.status);
        }
      }

      // Ordena por data de criação (mais recente primeiro)
      filteredExecutions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      logger.debug('Execuções obtidas', { 
        total: this.executions.length, 
        filtered: filteredExecutions.length,
        filter 
      });

      return filteredExecutions;
    } catch (error) {
      logger.error('Erro ao obter execuções', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // Métodos auxiliares privados

  private async generateReportData(type: ReportType, filter: ReportFilter): Promise<{
    data: any[];
    recordCount: number;
    totalAmount: number;
  }> {
    const startTime = Date.now();

    switch (type) {
      case 'cash_flow':
        return await this.generateCashFlowReport(filter);
      case 'invoices':
        return await this.generateInvoicesReport(filter);
      case 'payroll':
        return await this.generatePayrollReport(filter);
      case 'accounts':
        return await this.generateAccountsReport(filter);
      case 'closing':
        return await this.generateClosingReport(filter);
      case 'dashboard':
        return await this.generateDashboardReport(filter);
      default:
        throw new Error(`Tipo de relatório não suportado: ${type}`);
    }
  }

  private async generateCashFlowReport(filter: ReportFilter): Promise<{
    data: any[];
    recordCount: number;
    totalAmount: number;
  }> {
    const entries = await this.cashFlowService.getEntries({
      startDate: filter.startDate,
      endDate: filter.endDate,
      categoryId: filter.categoryId,
      costCenterId: filter.costCenterId
    });

    const data = entries.map(entry => ({
      date: entry.date,
      description: entry.description,
      type: entry.type,
      amount: entry.amount,
      category: entry.categoryId,
      costCenter: entry.costCenterId,
      status: entry.status
    }));

    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      data,
      recordCount: data.length,
      totalAmount
    };
  }

  private async generateInvoicesReport(filter: ReportFilter): Promise<{
    data: any[];
    recordCount: number;
    totalAmount: number;
  }> {
    const invoices = await this.invoiceService.getInvoices();

    let filteredInvoices = invoices;

    if (filter.startDate || filter.endDate) {
      filteredInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        const startDate = filter.startDate ? new Date(filter.startDate) : null;
        const endDate = filter.endDate ? new Date(filter.endDate) : null;

        if (startDate && invoiceDate < startDate) return false;
        if (endDate && invoiceDate > endDate) return false;
        return true;
      });
    }

    const data = filteredInvoices.map(invoice => ({
      id: invoice.id,
      clientName: invoice.clientName,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate
    }));

    const totalAmount = data.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    return {
      data,
      recordCount: data.length,
      totalAmount
    };
  }

  private async generatePayrollReport(filter: ReportFilter): Promise<{
    data: any[];
    recordCount: number;
    totalAmount: number;
  }> {
    const payslips = await this.payrollService.getPayslips({
      period: filter.period
    });

    const data = payslips.map(payslip => ({
      employeeName: payslip.employeeName,
      period: payslip.period,
      earnings: payslip.earnings,
      deductions: payslip.deductions,
      netSalary: payslip.netSalary,
      status: payslip.status
    }));

    const totalAmount = data.reduce((sum, payslip) => sum + payslip.netSalary, 0);

    return {
      data,
      recordCount: data.length,
      totalAmount
    };
  }

  private async generateAccountsReport(filter: ReportFilter): Promise<{
    data: any[];
    recordCount: number;
    totalAmount: number;
  }> {
    const accounts = await this.accountService.getAccounts();
    const transactions = await this.accountService.getTransactions();

    const data = accounts.map(account => ({
      accountName: account.name,
      accountType: account.type,
      balance: account.balance,
      currency: account.currency,
      status: account.status,
      lastSync: account.lastSync
    }));

    const totalAmount = data.reduce((sum, account) => sum + account.balance, 0);

    return {
      data,
      recordCount: data.length,
      totalAmount
    };
  }

  private async generateClosingReport(filter: ReportFilter): Promise<{
    data: any[];
    recordCount: number;
    totalAmount: number;
  }> {
    const periods = await this.closingService.getPeriods();
    const reconciliations = await this.closingService.getReconciliations();
    const adjustments = await this.closingService.getAdjustments();

    const data = periods.map(period => {
      const periodReconciliations = reconciliations.filter(r => r.periodId === period.id);
      const periodAdjustments = adjustments.filter(a => a.periodId === period.id);

      return {
        period: `${period.year}/${period.month}`,
        status: period.status,
        reconciliations: periodReconciliations.length,
        adjustments: periodAdjustments.length,
        totalAdjustments: periodAdjustments.reduce((sum, adj) => sum + adj.amount, 0)
      };
    });

    const totalAmount = data.reduce((sum, period) => sum + period.totalAdjustments, 0);

    return {
      data,
      recordCount: data.length,
      totalAmount
    };
  }

  private async generateDashboardReport(filter: ReportFilter): Promise<{
    data: any[];
    recordCount: number;
    totalAmount: number;
  }> {
    const dashboardData = await this.dashboardService.getDashboardData('system', filter.period);

    const data = [
      {
        kpis: dashboardData.kpis,
        cashFlow: dashboardData.cashFlow,
        alerts: dashboardData.alerts,
        accountBalances: dashboardData.accountBalances,
        trends: dashboardData.trends
      }
    ];

    const totalAmount = dashboardData.kpis.reduce((sum, kpi) => sum + (kpi.value || 0), 0);

    return {
      data,
      recordCount: 1,
      totalAmount
    };
  }

  private async generateFile(format: ReportFormat, reportData: {
    data: any[];
    recordCount: number;
    totalAmount: number;
  }): Promise<{
    url: string;
    size: number;
    executionTime: number;
  }> {
    const startTime = Date.now();

    let fileContent: string;
    let fileExtension: string;

    switch (format) {
      case 'pdf':
        fileContent = this.generatePDFContent(reportData);
        fileExtension = 'pdf';
        break;
      case 'excel':
        fileContent = this.generateExcelContent(reportData);
        fileExtension = 'xlsx';
        break;
      case 'csv':
        fileContent = this.generateCSVContent(reportData);
        fileExtension = 'csv';
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }

    // Simula geração de arquivo
    const fileName = `report-${Date.now()}.${fileExtension}`;
    const fileUrl = `/reports/${fileName}`;
    const fileSize = Buffer.byteLength(fileContent, 'utf8');
    const executionTime = Date.now() - startTime;

    logger.debug('Arquivo de relatório gerado', { 
      format, 
      fileName, 
      fileSize, 
      executionTime 
    });

    return {
      url: fileUrl,
      size: fileSize,
      executionTime
    };
  }

  private generatePDFContent(reportData: any): string {
    // Simula geração de PDF
    return `PDF Report Content\nRecords: ${reportData.recordCount}\nTotal: ${reportData.totalAmount}`;
  }

  private generateExcelContent(reportData: any): string {
    // Simula geração de Excel
    return `Excel Report Content\nRecords: ${reportData.recordCount}\nTotal: ${reportData.totalAmount}`;
  }

  private generateCSVContent(reportData: any): string {
    // Simula geração de CSV
    const headers = Object.keys(reportData.data[0] || {}).join(',');
    const rows = reportData.data.map((row: any) => 
      Object.values(row).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  }

  private async recordExecution(reportId: string, status: string, executionTime: number): Promise<void> {
    const execution: ReportExecution = {
      id: this.generateId(),
      reportId,
      status,
      executionTime,
      createdAt: new Date().toISOString()
    };

    this.executions.push(execution);
  }

  private shouldExecuteSchedule(schedule: ReportSchedule): boolean {
    if (!schedule.nextExecutionAt) {
      return true;
    }

    const now = new Date();
    const nextExecution = new Date(schedule.nextExecutionAt);
    
    return now >= nextExecution;
  }

  private calculateNextExecution(schedule: ReportSchedule): string {
    const now = new Date();
    
    switch (schedule.frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      default:
        throw new Error(`Frequência não suportada: ${schedule.frequency}`);
    }

    return now.toISOString();
  }

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

  private groupByType(reports: Report[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByFormat(reports: Report[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      acc[report.format] = (acc[report.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByStatus(reports: Report[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopReportTypes(reports: Report[]): Array<{ type: string; count: number }> {
    const typeCounts = this.groupByType(reports);
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private initializeMockData(): void {
    // Templates de relatório
    this.templates = [
      {
        id: 'template-1',
        name: 'Relatório de Fluxo de Caixa',
        description: 'Relatório detalhado do fluxo de caixa',
        type: 'cash_flow',
        format: 'pdf',
        filter: {},
        createdAt: new Date().toISOString()
      },
      {
        id: 'template-2',
        name: 'Relatório de Faturas',
        description: 'Relatório de faturas emitidas',
        type: 'invoices',
        format: 'excel',
        filter: {},
        createdAt: new Date().toISOString()
      },
      {
        id: 'template-3',
        name: 'Relatório de Folha de Pagamento',
        description: 'Relatório da folha de pagamento',
        type: 'payroll',
        format: 'pdf',
        filter: {},
        createdAt: new Date().toISOString()
      }
    ];

    // Agendamentos
    this.schedules = [
      {
        id: 'schedule-1',
        name: 'Relatório Mensal de Fluxo de Caixa',
        description: 'Relatório automático mensal',
        type: 'cash_flow',
        format: 'pdf',
        frequency: 'monthly',
        filter: { period: 'current' },
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'schedule-2',
        name: 'Relatório Semanal de Faturas',
        description: 'Relatório semanal de faturas',
        type: 'invoices',
        format: 'excel',
        frequency: 'weekly',
        filter: { period: 'current' },
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      }
    ];

    // Relatórios de exemplo
    this.reports = [
      {
        id: 'report-1',
        type: 'cash_flow',
        format: 'pdf',
        filter: { period: 'current' },
        status: 'completed',
        fileUrl: '/reports/cash-flow-2024-01.pdf',
        fileSize: 1024000,
        recordCount: 150,
        totalAmount: 250000,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        executionTime: 2500
      },
      {
        id: 'report-2',
        type: 'invoices',
        format: 'excel',
        filter: { period: 'current' },
        status: 'completed',
        fileUrl: '/reports/invoices-2024-01.xlsx',
        fileSize: 512000,
        recordCount: 75,
        totalAmount: 180000,
        createdBy: 'financeiro',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        executionTime: 1800
      }
    ];

    // Execuções de exemplo
    this.executions = [
      {
        id: 'exec-1',
        reportId: 'report-1',
        status: 'success',
        executionTime: 2500,
        createdAt: new Date().toISOString()
      },
      {
        id: 'exec-2',
        reportId: 'report-2',
        status: 'success',
        executionTime: 1800,
        createdAt: new Date().toISOString()
      }
    ];

    logger.info('Dados mock de relatórios inicializados', {
      templates: this.templates.length,
      schedules: this.schedules.length,
      reports: this.reports.length,
      executions: this.executions.length
    });
  }

  private generateId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}



