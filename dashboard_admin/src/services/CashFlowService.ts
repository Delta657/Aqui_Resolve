import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { 
  CashFlowEntry, 
  CashFlowCategory, 
  CostCenter, 
  CashFlowEntryType,
  CashFlowEntryStatus,
  CashFlowFilter,
  CashFlowStatistics
} from '../types/finance';

export class CashFlowService {
  private entries: CashFlowEntry[] = [];
  private categories: CashFlowCategory[] = [];
  private costCenters: CostCenter[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Obtém todas as entradas do fluxo de caixa
   */
  async getEntries(filter?: CashFlowFilter): Promise<CashFlowEntry[]> {
    try {
      let filteredEntries = [...this.entries];

      if (filter) {
        if (filter.type) {
          filteredEntries = filteredEntries.filter(entry => entry.type === filter.type);
        }
        if (filter.status) {
          filteredEntries = filteredEntries.filter(entry => entry.status === filter.status);
        }
        if (filter.categoryId) {
          filteredEntries = filteredEntries.filter(entry => entry.categoryId === filter.categoryId);
        }
        if (filter.costCenterId) {
          filteredEntries = filteredEntries.filter(entry => entry.costCenterId === filter.costCenterId);
        }
        if (filter.startDate) {
          filteredEntries = filteredEntries.filter(entry => 
            new Date(entry.date) >= new Date(filter.startDate!)
          );
        }
        if (filter.endDate) {
          filteredEntries = filteredEntries.filter(entry => 
            new Date(entry.date) <= new Date(filter.endDate!)
          );
        }
        if (filter.minAmount) {
          filteredEntries = filteredEntries.filter(entry => entry.amount >= filter.minAmount!);
        }
        if (filter.maxAmount) {
          filteredEntries = filteredEntries.filter(entry => entry.amount <= filter.maxAmount!);
        }
      }

      // Ordena por data (mais recente primeiro)
      filteredEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      logger.debug('Entradas do fluxo de caixa obtidas', { 
        total: this.entries.length, 
        filtered: filteredEntries.length,
        filter 
      });

      return filteredEntries;
    } catch (error) {
      logger.error('Erro ao obter entradas do fluxo de caixa', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém uma entrada específica por ID
   */
  async getEntryById(id: string): Promise<CashFlowEntry | null> {
    try {
      const entry = this.entries.find(e => e.id === id);
      
      if (entry) {
        logger.debug('Entrada do fluxo de caixa encontrada', { id });
      } else {
        logger.debug('Entrada do fluxo de caixa não encontrada', { id });
      }

      return entry || null;
    } catch (error) {
      logger.error('Erro ao obter entrada do fluxo de caixa', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cria uma nova entrada no fluxo de caixa
   */
  async createEntry(entryData: Omit<CashFlowEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashFlowEntry> {
    try {
      // Validações básicas
      if (entryData.amount <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }

      if (!entryData.description || entryData.description.trim().length === 0) {
        throw new Error('A descrição é obrigatória');
      }

      if (!entryData.categoryId) {
        throw new Error('A categoria é obrigatória');
      }

      // Verifica se a categoria existe
      const category = this.categories.find(c => c.id === entryData.categoryId);
      if (!category) {
        throw new Error('Categoria não encontrada');
      }

      // Verifica se o centro de custo existe (se fornecido)
      if (entryData.costCenterId) {
        const costCenter = this.costCenters.find(cc => cc.id === entryData.costCenterId);
        if (!costCenter) {
          throw new Error('Centro de custo não encontrado');
        }
      }

      const newEntry: CashFlowEntry = {
        id: this.generateId(),
        ...entryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.entries.push(newEntry);

      logger.info('Nova entrada criada no fluxo de caixa', { 
        id: newEntry.id,
        type: newEntry.type,
        amount: newEntry.amount,
        category: category.name
      });

      return newEntry;
    } catch (error) {
      logger.error('Erro ao criar entrada no fluxo de caixa', { 
        entryData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Atualiza uma entrada existente
   */
  async updateEntry(id: string, updateData: Partial<CashFlowEntry>): Promise<CashFlowEntry> {
    try {
      const entryIndex = this.entries.findIndex(e => e.id === id);
      if (entryIndex === -1) {
        throw new Error('Entrada não encontrada');
      }

      const currentEntry = this.entries[entryIndex];

      // Validações
      if (updateData.amount !== undefined && updateData.amount <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }

      if (updateData.categoryId !== undefined) {
        const category = this.categories.find(c => c.id === updateData.categoryId);
        if (!category) {
          throw new Error('Categoria não encontrada');
        }
      }

      if (updateData.costCenterId !== undefined && updateData.costCenterId) {
        const costCenter = this.costCenters.find(cc => cc.id === updateData.costCenterId);
        if (!costCenter) {
          throw new Error('Centro de custo não encontrado');
        }
      }

      const updatedEntry: CashFlowEntry = {
        ...currentEntry,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.entries[entryIndex] = updatedEntry;

      logger.info('Entrada do fluxo de caixa atualizada', { 
        id,
        type: updatedEntry.type,
        amount: updatedEntry.amount
      });

      return updatedEntry;
    } catch (error) {
      logger.error('Erro ao atualizar entrada do fluxo de caixa', { 
        id, 
        updateData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Remove uma entrada do fluxo de caixa
   */
  async deleteEntry(id: string): Promise<void> {
    try {
      const entryIndex = this.entries.findIndex(e => e.id === id);
      if (entryIndex === -1) {
        throw new Error('Entrada não encontrada');
      }

      const entry = this.entries[entryIndex];
      this.entries.splice(entryIndex, 1);

      logger.info('Entrada do fluxo de caixa removida', { 
        id,
        type: entry.type,
        amount: entry.amount
      });
    } catch (error) {
      logger.error('Erro ao remover entrada do fluxo de caixa', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todas as categorias
   */
  async getCategories(): Promise<CashFlowCategory[]> {
    try {
      logger.debug('Categorias obtidas', { count: this.categories.length });
      return [...this.categories];
    } catch (error) {
      logger.error('Erro ao obter categorias', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Cria uma nova categoria
   */
  async createCategory(categoryData: Omit<CashFlowCategory, 'id' | 'createdAt'>): Promise<CashFlowCategory> {
    try {
      if (!categoryData.name || categoryData.name.trim().length === 0) {
        throw new Error('O nome da categoria é obrigatório');
      }

      // Verifica se já existe uma categoria com o mesmo nome
      const existingCategory = this.categories.find(c => 
        c.name.toLowerCase() === categoryData.name.toLowerCase()
      );
      if (existingCategory) {
        throw new Error('Já existe uma categoria com este nome');
      }

      const newCategory: CashFlowCategory = {
        id: this.generateId(),
        ...categoryData,
        createdAt: new Date().toISOString()
      };

      this.categories.push(newCategory);

      logger.info('Nova categoria criada', { 
        id: newCategory.id,
        name: newCategory.name,
        type: newCategory.type
      });

      return newCategory;
    } catch (error) {
      logger.error('Erro ao criar categoria', { 
        categoryData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todos os centros de custo
   */
  async getCostCenters(): Promise<CostCenter[]> {
    try {
      logger.debug('Centros de custo obtidos', { count: this.costCenters.length });
      return [...this.costCenters];
    } catch (error) {
      logger.error('Erro ao obter centros de custo', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Cria um novo centro de custo
   */
  async createCostCenter(costCenterData: Omit<CostCenter, 'id' | 'createdAt'>): Promise<CostCenter> {
    try {
      if (!costCenterData.name || costCenterData.name.trim().length === 0) {
        throw new Error('O nome do centro de custo é obrigatório');
      }

      // Verifica se já existe um centro de custo com o mesmo nome
      const existingCostCenter = this.costCenters.find(cc => 
        cc.name.toLowerCase() === costCenterData.name.toLowerCase()
      );
      if (existingCostCenter) {
        throw new Error('Já existe um centro de custo com este nome');
      }

      const newCostCenter: CostCenter = {
        id: this.generateId(),
        ...costCenterData,
        createdAt: new Date().toISOString()
      };

      this.costCenters.push(newCostCenter);

      logger.info('Novo centro de custo criado', { 
        id: newCostCenter.id,
        name: newCostCenter.name
      });

      return newCostCenter;
    } catch (error) {
      logger.error('Erro ao criar centro de custo', { 
        costCenterData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas do fluxo de caixa
   */
  async getStatistics(period: string = 'current'): Promise<CashFlowStatistics> {
    try {
      const entries = await this.getEntries();
      
      // Filtra por período
      const periodData = this.filterByPeriod(period);
      const filteredEntries = entries.filter(entry => 
        periodData.startDate <= new Date(entry.date) && 
        new Date(entry.date) <= periodData.endDate
      );

      const income = filteredEntries
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const expenses = filteredEntries
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const netCashFlow = income - expenses;

      // Agrupa por categoria
      const incomeByCategory = this.groupByCategory(
        filteredEntries.filter(entry => entry.type === 'income')
      );
      const expensesByCategory = this.groupByCategory(
        filteredEntries.filter(entry => entry.type === 'expense')
      );

      // Agrupa por centro de custo
      const expensesByCostCenter = this.groupByCostCenter(
        filteredEntries.filter(entry => entry.type === 'expense')
      );

      // Calcula médias
      const totalEntries = filteredEntries.length;
      const averageIncome = totalEntries > 0 ? income / filteredEntries.filter(e => e.type === 'income').length : 0;
      const averageExpense = totalEntries > 0 ? expenses / filteredEntries.filter(e => e.type === 'expense').length : 0;

      const statistics: CashFlowStatistics = {
        period,
        totalIncome: income,
        totalExpenses: expenses,
        netCashFlow,
        totalEntries,
        averageIncome,
        averageExpense,
        incomeByCategory,
        expensesByCategory,
        expensesByCostCenter,
        topCategories: this.getTopCategories(filteredEntries),
        dailyAverages: this.getDailyAverages(filteredEntries)
      };

      logger.debug('Estatísticas do fluxo de caixa calculadas', { period, netCashFlow });
      return statistics;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas do fluxo de caixa', { 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Importa entradas de uma fonte externa (ex: banco, planilha)
   */
  async importEntries(entries: Omit<CashFlowEntry, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<CashFlowEntry[]> {
    try {
      const importedEntries: CashFlowEntry[] = [];

      for (const entryData of entries) {
        try {
          const entry = await this.createEntry(entryData);
          importedEntries.push(entry);
        } catch (error) {
          logger.warn('Erro ao importar entrada', { 
            entryData, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          // Continua com as próximas entradas mesmo se uma falhar
        }
      }

      logger.info('Importação de entradas concluída', { 
        total: entries.length, 
        imported: importedEntries.length 
      });

      return importedEntries;
    } catch (error) {
      logger.error('Erro na importação de entradas', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // Métodos auxiliares privados

  private initializeMockData(): void {
    // Categorias de receita
    this.categories = [
      {
        id: 'cat-1',
        name: 'Vendas',
        type: 'income',
        description: 'Receitas provenientes de vendas',
        color: '#10b981',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat-2',
        name: 'Serviços',
        type: 'income',
        description: 'Receitas provenientes de prestação de serviços',
        color: '#3b82f6',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat-3',
        name: 'Juros e Rendimentos',
        type: 'income',
        description: 'Juros e rendimentos de investimentos',
        color: '#8b5cf6',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat-4',
        name: 'Fornecedores',
        type: 'expense',
        description: 'Despesas com fornecedores',
        color: '#ef4444',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat-5',
        name: 'Funcionários',
        type: 'expense',
        description: 'Despesas com folha de pagamento',
        color: '#f59e0b',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat-6',
        name: 'Impostos',
        type: 'expense',
        description: 'Impostos e taxas',
        color: '#dc2626',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat-7',
        name: 'Marketing',
        type: 'expense',
        description: 'Despesas com marketing e publicidade',
        color: '#ec4899',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cat-8',
        name: 'Infraestrutura',
        type: 'expense',
        description: 'Despesas com infraestrutura e TI',
        color: '#6b7280',
        createdAt: new Date().toISOString()
      }
    ];

    // Centros de custo
    this.costCenters = [
      {
        id: 'cc-1',
        name: 'Administrativo',
        description: 'Centro de custo administrativo',
        code: 'ADM',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cc-2',
        name: 'Comercial',
        description: 'Centro de custo comercial',
        code: 'COM',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cc-3',
        name: 'Operacional',
        description: 'Centro de custo operacional',
        code: 'OP',
        createdAt: new Date().toISOString()
      },
      {
        id: 'cc-4',
        name: 'TI',
        description: 'Centro de custo de tecnologia',
        code: 'TI',
        createdAt: new Date().toISOString()
      }
    ];

    // Entradas de exemplo
    const now = new Date();
    this.entries = [
      {
        id: 'entry-1',
        type: 'income',
        amount: 50000,
        description: 'Venda de produtos - Cliente A',
        date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        categoryId: 'cat-1',
        costCenterId: 'cc-2',
        status: 'confirmed',
        paymentMethod: 'pix',
        reference: 'INV-001',
        notes: 'Venda realizada com sucesso',
        createdAt: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), 15).toISOString()
      },
      {
        id: 'entry-2',
        type: 'income',
        amount: 25000,
        description: 'Prestação de serviços - Cliente B',
        date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        categoryId: 'cat-2',
        costCenterId: 'cc-3',
        status: 'confirmed',
        paymentMethod: 'transfer',
        reference: 'INV-002',
        notes: 'Serviço de consultoria',
        createdAt: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), 20).toISOString()
      },
      {
        id: 'entry-3',
        type: 'expense',
        amount: 15000,
        description: 'Pagamento de fornecedor - Matéria-prima',
        date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
        categoryId: 'cat-4',
        costCenterId: 'cc-3',
        status: 'confirmed',
        paymentMethod: 'transfer',
        reference: 'FOR-001',
        notes: 'Compra de matéria-prima para produção',
        createdAt: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), 10).toISOString()
      },
      {
        id: 'entry-4',
        type: 'expense',
        amount: 30000,
        description: 'Folha de pagamento - Janeiro',
        date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
        categoryId: 'cat-5',
        costCenterId: 'cc-1',
        status: 'confirmed',
        paymentMethod: 'transfer',
        reference: 'FP-001',
        notes: 'Pagamento da folha de pagamento',
        createdAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString()
      },
      {
        id: 'entry-5',
        type: 'expense',
        amount: 8000,
        description: 'Impostos federais',
        date: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        categoryId: 'cat-6',
        costCenterId: 'cc-1',
        status: 'pending',
        paymentMethod: 'boleto',
        reference: 'IMP-001',
        notes: 'Impostos federais do mês',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 25).toISOString(),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
        updatedAt: new Date(now.getFullYear(), now.getMonth(), 20).toISOString()
      }
    ];

    logger.info('Dados mock do fluxo de caixa inicializados', {
      categories: this.categories.length,
      costCenters: this.costCenters.length,
      entries: this.entries.length
    });
  }

  private generateId(): string {
    return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  private groupByCategory(entries: CashFlowEntry[]): Record<string, number> {
    return entries.reduce((acc, entry) => {
      const category = this.categories.find(c => c.id === entry.categoryId);
      const categoryName = category ? category.name : 'Sem categoria';
      acc[categoryName] = (acc[categoryName] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByCostCenter(entries: CashFlowEntry[]): Record<string, number> {
    return entries.reduce((acc, entry) => {
      const costCenter = this.costCenters.find(cc => cc.id === entry.costCenterId);
      const costCenterName = costCenter ? costCenter.name : 'Sem centro de custo';
      acc[costCenterName] = (acc[costCenterName] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopCategories(entries: CashFlowEntry[]): Array<{ category: string; amount: number; type: 'income' | 'expense' }> {
    const categoryTotals: Record<string, { income: number; expense: number }> = {};

    entries.forEach(entry => {
      const category = this.categories.find(c => c.id === entry.categoryId);
      const categoryName = category ? category.name : 'Sem categoria';
      
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = { income: 0, expense: 0 };
      }

      if (entry.type === 'income') {
        categoryTotals[categoryName].income += entry.amount;
      } else {
        categoryTotals[categoryName].expense += entry.amount;
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

  private getDailyAverages(entries: CashFlowEntry[]): { averageIncome: number; averageExpense: number } {
    const dailyData: Record<string, { income: number; expense: number; count: number }> = {};

    entries.forEach(entry => {
      const date = new Date(entry.date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0, count: 0 };
      }

      if (entry.type === 'income') {
        dailyData[date].income += entry.amount;
      } else {
        dailyData[date].expense += entry.amount;
      }
      dailyData[date].count++;
    });

    const totalDays = Object.keys(dailyData).length;
    if (totalDays === 0) return { averageIncome: 0, averageExpense: 0 };

    const totalIncome = Object.values(dailyData).reduce((sum, day) => sum + day.income, 0);
    const totalExpense = Object.values(dailyData).reduce((sum, day) => sum + day.expense, 0);

    return {
      averageIncome: totalIncome / totalDays,
      averageExpense: totalExpense / totalDays
    };
  }
}



