// ==== TIPOS BASE ====
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AuditLog extends BaseEntity {
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

// ==== CONFIGURAÇÕES ====
export interface EnvironmentConfig {
  app: {
    env: 'development' | 'staging' | 'production';
    port: number;
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    pass: string;
  };
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string;
  };
  features: {
    bank: boolean;
    nfe: boolean;
    nfse: boolean;
    payments: boolean;
    email: boolean;
    sms: boolean;
    storage: boolean;
    oauth: boolean;
    sandbox: boolean;
  };
  integrations: {
    bank: BankConfig;
    nfe: NFEConfig;
    nfse: NFSEConfig;
    payments: PaymentsConfig;
    email: EmailConfig;
    sms: SMSConfig;
    storage: StorageConfig;
    oauth: OAuthConfig;
  };
  security: {
    bcryptRounds: number;
    rateLimitWindow: string;
    rateLimitMax: number;
    corsOrigin: string;
    encryptionKey: string;
    encryptionAlgorithm: string;
  };
  webhooks: {
    bank: string;
    payments: string;
    fiscal: string;
  };
  scheduler: {
    conciliation: string;
    closing: string;
    reports: string;
  };
}

// ==== CONFIGURAÇÕES DE INTEGRAÇÃO ====
export interface BankConfig {
  baseUrl: string;
  apiKey?: string;
  webhookSecret?: string;
  clientId?: string;
  clientSecret?: string;
  certPath?: string;
  certPass?: string;
}

export interface NFEConfig {
  baseUrl: string;
  apiKey?: string;
  certPath?: string;
  certPass?: string;
  ambiente: number;
  empresaCNPJ?: string;
}

export interface NFSEConfig {
  baseUrl: string;
  apiKey?: string;
  certPath?: string;
  certPass?: string;
  ambiente: number;
  empresaCNPJ?: string;
}

export interface PaymentsConfig {
  baseUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  pixCertPath?: string;
  pixCertPass?: string;
}

export interface EmailConfig {
  apiKey?: string;
  from: string;
  templatePath: string;
}

export interface SMSConfig {
  apiKey?: string;
  from: string;
  webhookUrl?: string;
}

export interface StorageConfig {
  bucket: string;
  accessKey?: string;
  secretKey?: string;
  region: string;
  endpoint?: string;
}

export interface OAuthConfig {
  google: {
    clientId?: string;
    clientSecret?: string;
    redirectUrl: string;
  };
  microsoft: {
    clientId?: string;
    clientSecret?: string;
    redirectUrl: string;
  };
}

// ==== DOMÍNIO FINANCEIRO ====

// Contas Bancárias
export interface BankAccount extends BaseEntity {
  name: string;
  bank: string;
  agency: string;
  account: string;
  accountType: 'corrente' | 'poupanca' | 'investimento';
  balance: number;
  status: 'active' | 'inactive' | 'blocked';
  integrationId?: string;
  lastSync?: Date;
  metadata?: Record<string, any>;
}

// Transações
export interface Transaction extends BaseEntity {
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: string;
  costCenter?: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  reference?: string;
  integrationId?: string;
  metadata?: Record<string, any>;
}

// Faturas
export interface Invoice extends BaseEntity {
  number: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: 'pix' | 'boleto' | 'card' | 'transfer';
  nfeId?: string;
  nfseId?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

// Clientes
export interface Client extends BaseEntity {
  name: string;
  document: string;
  email: string;
  phone?: string;
  address?: Address;
  status: 'active' | 'inactive';
  creditLimit?: number;
  metadata?: Record<string, any>;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Categorias
export interface Category extends BaseEntity {
  name: string;
  type: 'income' | 'expense';
  parentId?: string;
  color?: string;
  icon?: string;
  active: boolean;
}

// Centros de Custo
export interface CostCenter extends BaseEntity {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  active: boolean;
}

// Folha de Pagamento
export interface Employee extends BaseEntity {
  name: string;
  document: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  status: 'active' | 'inactive' | 'vacation' | 'leave';
  hireDate: Date;
  terminationDate?: Date;
  metadata?: Record<string, any>;
}

export interface Payroll extends BaseEntity {
  employeeId: string;
  period: string; // YYYY-MM
  baseSalary: number;
  allowances: PayrollItem[];
  deductions: PayrollItem[];
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: Date;
  metadata?: Record<string, any>;
}

export interface PayrollItem {
  description: string;
  amount: number;
  type: 'allowance' | 'deduction';
  category: string;
}

// Fechamentos
export interface Closing extends BaseEntity {
  period: string; // YYYY-MM
  type: 'monthly' | 'quarterly' | 'annual';
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'locked';
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  notes?: string;
  metadata?: Record<string, any>;
}

// Relatórios
export interface Report extends BaseEntity {
  name: string;
  type: 'income_expense' | 'cash_flow' | 'invoicing' | 'overdue' | 'commissions' | 'balance_sheet';
  period: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  metadata?: Record<string, any>;
}

// ==== INTEGRAÇÕES ====

// Webhooks
export interface Webhook extends BaseEntity {
  provider: string;
  event: string;
  payload: Record<string, any>;
  status: 'pending' | 'processed' | 'failed';
  retryCount: number;
  processedAt?: Date;
  errorMessage?: string;
}

// Sincronizações
export interface Sync extends BaseEntity {
  provider: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  processedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// ==== PERMISSÕES ====
export interface Permission {
  resource: string;
  actions: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  active: boolean;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
}

// ==== ENUMS ====
export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  PIX = 'pix',
  BOLETO = 'boleto',
  CARD = 'card',
  TRANSFER = 'transfer'
}

export enum AccountType {
  CORRENTE = 'corrente',
  POUPANCA = 'poupanca',
  INVESTIMENTO = 'investimento'
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export enum ClosingStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  LOCKED = 'locked'
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv'
}

// ==== RESPONSES ====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netProfit: number;
  profitMargin: number;
  overdueInvoices: number;
  pendingTransactions: number;
  activeAccounts: number;
  totalEmployees: number;
}

export interface CashFlowData {
  period: string;
  income: number;
  expenses: number;
  netFlow: number;
  cumulativeBalance: number;
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  total: number;
  details: ReconciliationDetail[];
}

export interface ReconciliationDetail {
  bankTransaction: Transaction;
  systemTransaction?: Transaction;
  status: 'matched' | 'unmatched' | 'manual';
  confidence: number;
}

