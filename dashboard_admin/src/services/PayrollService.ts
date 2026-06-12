import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { 
  Employee, 
  PayrollItem, 
  PayrollPeriod, 
  Payslip, 
  PayrollCharge,
  PayrollEarning,
  PayrollDeduction,
  PayrollFilter,
  PayrollStatistics
} from '../types/finance';

export class PayrollService {
  private employees: Employee[] = [];
  private payrollItems: PayrollItem[] = [];
  private payrollPeriods: PayrollPeriod[] = [];
  private payslips: Payslip[] = [];
  private charges: PayrollCharge[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Obtém todos os funcionários
   */
  async getEmployees(filter?: { active?: boolean; department?: string }): Promise<Employee[]> {
    try {
      let filteredEmployees = [...this.employees];

      if (filter) {
        if (filter.active !== undefined) {
          filteredEmployees = filteredEmployees.filter(emp => emp.active === filter.active);
        }
        if (filter.department) {
          filteredEmployees = filteredEmployees.filter(emp => emp.department === filter.department);
        }
      }

      logger.debug('Funcionários obtidos', { 
        total: this.employees.length, 
        filtered: filteredEmployees.length,
        filter 
      });

      return filteredEmployees;
    } catch (error) {
      logger.error('Erro ao obter funcionários', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém um funcionário específico por ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const employee = this.employees.find(emp => emp.id === id);
      
      if (employee) {
        logger.debug('Funcionário encontrado', { id });
      } else {
        logger.debug('Funcionário não encontrado', { id });
      }

      return employee || null;
    } catch (error) {
      logger.error('Erro ao obter funcionário', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cria um novo funcionário
   */
  async createEmployee(employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    try {
      // Validações básicas
      if (!employeeData.name || employeeData.name.trim().length === 0) {
        throw new Error('O nome do funcionário é obrigatório');
      }

      if (!employeeData.cpf || employeeData.cpf.trim().length === 0) {
        throw new Error('O CPF é obrigatório');
      }

      // Verifica se já existe um funcionário com o mesmo CPF
      const existingEmployee = this.employees.find(emp => emp.cpf === employeeData.cpf);
      if (existingEmployee) {
        throw new Error('Já existe um funcionário com este CPF');
      }

      const newEmployee: Employee = {
        id: this.generateId(),
        ...employeeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.employees.push(newEmployee);

      logger.info('Novo funcionário criado', { 
        id: newEmployee.id,
        name: newEmployee.name,
        cpf: newEmployee.cpf
      });

      return newEmployee;
    } catch (error) {
      logger.error('Erro ao criar funcionário', { 
        employeeData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Atualiza um funcionário existente
   */
  async updateEmployee(id: string, updateData: Partial<Employee>): Promise<Employee> {
    try {
      const employeeIndex = this.employees.findIndex(emp => emp.id === id);
      if (employeeIndex === -1) {
        throw new Error('Funcionário não encontrado');
      }

      const currentEmployee = this.employees[employeeIndex];

      // Validações
      if (updateData.cpf !== undefined) {
        const existingEmployee = this.employees.find(emp => 
          emp.cpf === updateData.cpf && emp.id !== id
        );
        if (existingEmployee) {
          throw new Error('Já existe um funcionário com este CPF');
        }
      }

      const updatedEmployee: Employee = {
        ...currentEmployee,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.employees[employeeIndex] = updatedEmployee;

      logger.info('Funcionário atualizado', { 
        id,
        name: updatedEmployee.name
      });

      return updatedEmployee;
    } catch (error) {
      logger.error('Erro ao atualizar funcionário', { 
        id, 
        updateData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Remove um funcionário
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      const employeeIndex = this.employees.findIndex(emp => emp.id === id);
      if (employeeIndex === -1) {
        throw new Error('Funcionário não encontrado');
      }

      const employee = this.employees[employeeIndex];
      this.employees.splice(employeeIndex, 1);

      logger.info('Funcionário removido', { 
        id,
        name: employee.name
      });
    } catch (error) {
      logger.error('Erro ao remover funcionário', { 
        id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todos os itens da folha de pagamento
   */
  async getPayrollItems(filter?: PayrollFilter): Promise<PayrollItem[]> {
    try {
      let filteredItems = [...this.payrollItems];

      if (filter) {
        if (filter.employeeId) {
          filteredItems = filteredItems.filter(item => item.employeeId === filter.employeeId);
        }
        if (filter.period) {
          filteredItems = filteredItems.filter(item => item.period === filter.period);
        }
        if (filter.type) {
          filteredItems = filteredItems.filter(item => item.type === filter.type);
        }
        if (filter.category) {
          filteredItems = filteredItems.filter(item => item.category === filter.category);
        }
      }

      // Ordena por período e funcionário
      filteredItems.sort((a, b) => {
        if (a.period !== b.period) {
          return b.period.localeCompare(a.period);
        }
        return a.employeeId.localeCompare(b.employeeId);
      });

      logger.debug('Itens da folha de pagamento obtidos', { 
        total: this.payrollItems.length, 
        filtered: filteredItems.length,
        filter 
      });

      return filteredItems;
    } catch (error) {
      logger.error('Erro ao obter itens da folha de pagamento', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cria um novo item da folha de pagamento
   */
  async createPayrollItem(itemData: Omit<PayrollItem, 'id' | 'createdAt'>): Promise<PayrollItem> {
    try {
      // Validações básicas
      if (!itemData.employeeId) {
        throw new Error('O ID do funcionário é obrigatório');
      }

      if (!itemData.description || itemData.description.trim().length === 0) {
        throw new Error('A descrição é obrigatória');
      }

      if (itemData.amount <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }

      // Verifica se o funcionário existe
      const employee = this.employees.find(emp => emp.id === itemData.employeeId);
      if (!employee) {
        throw new Error('Funcionário não encontrado');
      }

      const newItem: PayrollItem = {
        id: this.generateId(),
        ...itemData,
        createdAt: new Date().toISOString()
      };

      this.payrollItems.push(newItem);

      logger.info('Novo item da folha de pagamento criado', { 
        id: newItem.id,
        employeeId: newItem.employeeId,
        type: newItem.type,
        amount: newItem.amount
      });

      return newItem;
    } catch (error) {
      logger.error('Erro ao criar item da folha de pagamento', { 
        itemData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todos os contracheques
   */
  async getPayslips(filter?: { employeeId?: string; period?: string }): Promise<Payslip[]> {
    try {
      let filteredPayslips = [...this.payslips];

      if (filter) {
        if (filter.employeeId) {
          filteredPayslips = filteredPayslips.filter(payslip => payslip.employeeId === filter.employeeId);
        }
        if (filter.period) {
          filteredPayslips = filteredPayslips.filter(payslip => payslip.period === filter.period);
        }
      }

      // Ordena por período (mais recente primeiro)
      filteredPayslips.sort((a, b) => b.period.localeCompare(a.period));

      logger.debug('Contracheques obtidos', { 
        total: this.payslips.length, 
        filtered: filteredPayslips.length,
        filter 
      });

      return filteredPayslips;
    } catch (error) {
      logger.error('Erro ao obter contracheques', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Gera contracheque para um funcionário em um período específico
   */
  async generatePayslip(employeeId: string, period: string): Promise<Payslip> {
    try {
      // Verifica se o funcionário existe
      const employee = this.employees.find(emp => emp.id === employeeId);
      if (!employee) {
        throw new Error('Funcionário não encontrado');
      }

      // Verifica se já existe um contracheque para este funcionário e período
      const existingPayslip = this.payslips.find(p => 
        p.employeeId === employeeId && p.period === period
      );
      if (existingPayslip) {
        throw new Error('Já existe um contracheque para este funcionário e período');
      }

      // Obtém todos os itens da folha para este funcionário e período
      const payrollItems = await this.getPayrollItems({ 
        employeeId, 
        period 
      });

      // Calcula proventos
      const earnings = payrollItems
        .filter(item => item.type === 'earning')
        .reduce((sum, item) => sum + item.amount, 0);

      // Calcula descontos
      const deductions = payrollItems
        .filter(item => item.type === 'deduction')
        .reduce((sum, item) => sum + item.amount, 0);

      // Calcula salário líquido
      const netSalary = earnings - deductions;

      const payslip: Payslip = {
        id: this.generateId(),
        employeeId,
        employeeName: employee.name,
        period,
        earnings,
        deductions,
        netSalary,
        status: 'generated',
        generatedAt: new Date().toISOString(),
        items: payrollItems
      };

      this.payslips.push(payslip);

      logger.info('Contracheque gerado', { 
        id: payslip.id,
        employeeId,
        period,
        netSalary
      });

      return payslip;
    } catch (error) {
      logger.error('Erro ao gerar contracheque', { 
        employeeId, 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém todas as cobranças da folha de pagamento
   */
  async getCharges(filter?: { period?: string; status?: string }): Promise<PayrollCharge[]> {
    try {
      let filteredCharges = [...this.charges];

      if (filter) {
        if (filter.period) {
          filteredCharges = filteredCharges.filter(charge => charge.period === filter.period);
        }
        if (filter.status) {
          filteredCharges = filteredCharges.filter(charge => charge.status === filter.status);
        }
      }

      // Ordena por período (mais recente primeiro)
      filteredCharges.sort((a, b) => b.period.localeCompare(a.period));

      logger.debug('Cobranças da folha de pagamento obtidas', { 
        total: this.charges.length, 
        filtered: filteredCharges.length,
        filter 
      });

      return filteredCharges;
    } catch (error) {
      logger.error('Erro ao obter cobranças da folha de pagamento', { 
        filter, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Cria uma nova cobrança da folha de pagamento
   */
  async createCharge(chargeData: Omit<PayrollCharge, 'id' | 'createdAt'>): Promise<PayrollCharge> {
    try {
      // Validações básicas
      if (!chargeData.period || chargeData.period.trim().length === 0) {
        throw new Error('O período é obrigatório');
      }

      if (chargeData.totalAmount <= 0) {
        throw new Error('O valor total deve ser maior que zero');
      }

      const newCharge: PayrollCharge = {
        id: this.generateId(),
        ...chargeData,
        createdAt: new Date().toISOString()
      };

      this.charges.push(newCharge);

      logger.info('Nova cobrança da folha de pagamento criada', { 
        id: newCharge.id,
        period: newCharge.period,
        totalAmount: newCharge.totalAmount
      });

      return newCharge;
    } catch (error) {
      logger.error('Erro ao criar cobrança da folha de pagamento', { 
        chargeData, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Obtém estatísticas da folha de pagamento
   */
  async getStatistics(period: string = 'current'): Promise<PayrollStatistics> {
    try {
      const employees = await this.getEmployees({ active: true });
      const payrollItems = await this.getPayrollItems({ period });
      const payslips = await this.getPayslips({ period });
      const charges = await this.getCharges({ period });

      // Calcula totais
      const totalEarnings = payrollItems
        .filter(item => item.type === 'earning')
        .reduce((sum, item) => sum + item.amount, 0);

      const totalDeductions = payrollItems
        .filter(item => item.type === 'deduction')
        .reduce((sum, item) => sum + item.amount, 0);

      const totalNetSalary = totalEarnings - totalDeductions;

      // Agrupa por categoria
      const earningsByCategory = this.groupByCategory(
        payrollItems.filter(item => item.type === 'earning')
      );
      const deductionsByCategory = this.groupByCategory(
        payrollItems.filter(item => item.type === 'deduction')
      );

      // Calcula médias
      const activeEmployees = employees.length;
      const averageSalary = activeEmployees > 0 ? totalNetSalary / activeEmployees : 0;

      const statistics: PayrollStatistics = {
        period,
        totalEmployees: activeEmployees,
        totalEarnings,
        totalDeductions,
        totalNetSalary,
        averageSalary,
        earningsByCategory,
        deductionsByCategory,
        payslipsGenerated: payslips.length,
        chargesCreated: charges.length,
        topEarnings: this.getTopItems(payrollItems.filter(item => item.type === 'earning')),
        topDeductions: this.getTopItems(payrollItems.filter(item => item.type === 'deduction'))
      };

      logger.debug('Estatísticas da folha de pagamento calculadas', { period, totalNetSalary });
      return statistics;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas da folha de pagamento', { 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Processa a folha de pagamento para um período
   */
  async processPayroll(period: string): Promise<{ payslips: Payslip[]; charge: PayrollCharge }> {
    try {
      logger.info('Iniciando processamento da folha de pagamento', { period });

      const activeEmployees = await this.getEmployees({ active: true });
      const payslips: Payslip[] = [];
      let totalAmount = 0;

      // Gera contracheque para cada funcionário ativo
      for (const employee of activeEmployees) {
        try {
          const payslip = await this.generatePayslip(employee.id, period);
          payslips.push(payslip);
          totalAmount += payslip.netSalary;
        } catch (error) {
          logger.warn('Erro ao gerar contracheque para funcionário', { 
            employeeId: employee.id, 
            period, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          // Continua com os próximos funcionários mesmo se um falhar
        }
      }

      // Cria cobrança da folha de pagamento
      const charge = await this.createCharge({
        period,
        description: `Folha de pagamento - ${period}`,
        totalAmount,
        employeeCount: payslips.length,
        status: 'pending',
        dueDate: this.getPayrollDueDate(period),
        paymentMethod: 'transfer'
      });

      logger.info('Processamento da folha de pagamento concluído', { 
        period,
        payslipsGenerated: payslips.length,
        totalAmount
      });

      return { payslips, charge };
    } catch (error) {
      logger.error('Erro no processamento da folha de pagamento', { 
        period, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  // Métodos auxiliares privados

  private initializeMockData(): void {
    // Funcionários
    this.employees = [
      {
        id: 'emp-1',
        name: 'João Silva',
        cpf: '123.456.789-00',
        email: 'joao.silva@empresa.com',
        phone: '(11) 99999-9999',
        position: 'Desenvolvedor',
        department: 'TI',
        salary: 5000,
        admissionDate: '2023-01-15',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'emp-2',
        name: 'Maria Santos',
        cpf: '987.654.321-00',
        email: 'maria.santos@empresa.com',
        phone: '(11) 88888-8888',
        position: 'Analista',
        department: 'Administrativo',
        salary: 4000,
        admissionDate: '2023-03-20',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'emp-3',
        name: 'Pedro Costa',
        cpf: '456.789.123-00',
        email: 'pedro.costa@empresa.com',
        phone: '(11) 77777-7777',
        position: 'Vendedor',
        department: 'Comercial',
        salary: 3500,
        admissionDate: '2023-02-10',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Períodos da folha de pagamento
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    this.payrollPeriods = [
      {
        id: 'period-1',
        period: currentPeriod,
        description: `Folha de pagamento - ${currentPeriod}`,
        startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
        endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
        status: 'open',
        createdAt: new Date().toISOString()
      }
    ];

    // Itens da folha de pagamento
    this.payrollItems = [
      // Proventos
      {
        id: 'item-1',
        employeeId: 'emp-1',
        period: currentPeriod,
        type: 'earning',
        category: 'salary',
        description: 'Salário base',
        amount: 5000,
        createdAt: new Date().toISOString()
      },
      {
        id: 'item-2',
        employeeId: 'emp-1',
        period: currentPeriod,
        type: 'earning',
        category: 'bonus',
        description: 'Bônus de produtividade',
        amount: 500,
        createdAt: new Date().toISOString()
      },
      {
        id: 'item-3',
        employeeId: 'emp-2',
        period: currentPeriod,
        type: 'earning',
        category: 'salary',
        description: 'Salário base',
        amount: 4000,
        createdAt: new Date().toISOString()
      },
      {
        id: 'item-4',
        employeeId: 'emp-3',
        period: currentPeriod,
        type: 'earning',
        category: 'salary',
        description: 'Salário base',
        amount: 3500,
        createdAt: new Date().toISOString()
      },
      {
        id: 'item-5',
        employeeId: 'emp-3',
        period: currentPeriod,
        type: 'earning',
        category: 'commission',
        description: 'Comissão de vendas',
        amount: 800,
        createdAt: new Date().toISOString()
      },
      // Descontos
      {
        id: 'item-6',
        employeeId: 'emp-1',
        period: currentPeriod,
        type: 'deduction',
        category: 'inss',
        description: 'INSS',
        amount: 550,
        createdAt: new Date().toISOString()
      },
      {
        id: 'item-7',
        employeeId: 'emp-1',
        period: currentPeriod,
        type: 'deduction',
        category: 'irrf',
        description: 'IRRF',
        amount: 300,
        createdAt: new Date().toISOString()
      },
      {
        id: 'item-8',
        employeeId: 'emp-2',
        period: currentPeriod,
        type: 'deduction',
        category: 'inss',
        description: 'INSS',
        amount: 440,
        createdAt: new Date().toISOString()
      },
      {
        id: 'item-9',
        employeeId: 'emp-3',
        period: currentPeriod,
        type: 'deduction',
        category: 'inss',
        description: 'INSS',
        amount: 385,
        createdAt: new Date().toISOString()
      }
    ];

    // Contracheques
    this.payslips = [
      {
        id: 'payslip-1',
        employeeId: 'emp-1',
        employeeName: 'João Silva',
        period: currentPeriod,
        earnings: 5500,
        deductions: 850,
        netSalary: 4650,
        status: 'generated',
        generatedAt: new Date().toISOString(),
        items: this.payrollItems.filter(item => item.employeeId === 'emp-1' && item.period === currentPeriod)
      },
      {
        id: 'payslip-2',
        employeeId: 'emp-2',
        employeeName: 'Maria Santos',
        period: currentPeriod,
        earnings: 4000,
        deductions: 440,
        netSalary: 3560,
        status: 'generated',
        generatedAt: new Date().toISOString(),
        items: this.payrollItems.filter(item => item.employeeId === 'emp-2' && item.period === currentPeriod)
      },
      {
        id: 'payslip-3',
        employeeId: 'emp-3',
        employeeName: 'Pedro Costa',
        period: currentPeriod,
        earnings: 4300,
        deductions: 385,
        netSalary: 3915,
        status: 'generated',
        generatedAt: new Date().toISOString(),
        items: this.payrollItems.filter(item => item.employeeId === 'emp-3' && item.period === currentPeriod)
      }
    ];

    // Cobranças
    this.charges = [
      {
        id: 'charge-1',
        period: currentPeriod,
        description: `Folha de pagamento - ${currentPeriod}`,
        totalAmount: 12125, // 4650 + 3560 + 3915
        employeeCount: 3,
        status: 'pending',
        dueDate: this.getPayrollDueDate(currentPeriod),
        paymentMethod: 'transfer',
        createdAt: new Date().toISOString()
      }
    ];

    logger.info('Dados mock da folha de pagamento inicializados', {
      employees: this.employees.length,
      payrollItems: this.payrollItems.length,
      payslips: this.payslips.length,
      charges: this.charges.length
    });
  }

  private generateId(): string {
    return `payroll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupByCategory(items: PayrollItem[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopItems(items: PayrollItem[]): Array<{ description: string; amount: number; employeeName: string }> {
    return items
      .map(item => {
        const employee = this.employees.find(emp => emp.id === item.employeeId);
        return {
          description: item.description,
          amount: item.amount,
          employeeName: employee ? employee.name : 'Funcionário não encontrado'
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  private getPayrollDueDate(period: string): string {
    // Simula o vencimento da folha de pagamento (geralmente dia 5 do mês seguinte)
    const [year, month] = period.split('-');
    const nextMonth = new Date(parseInt(year), parseInt(month), 5);
    return nextMonth.toISOString();
  }
}



