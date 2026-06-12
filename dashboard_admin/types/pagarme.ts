// ==========================================
// TIPOS PAGAR.ME - API v5
// ==========================================

// ==== CLIENTE ====
export interface PagarmeCustomer {
  id: string
  name: string
  email: string
  document?: string
  document_type?: 'cpf' | 'cnpj'
  type?: 'individual' | 'company'
  phones?: {
    mobile_phone?: {
      country_code: string
      area_code: string
      number: string
    }
    home_phone?: {
      country_code: string
      area_code: string
      number: string
    }
  }
  address?: PagarmeAddress
  metadata?: Record<string, any>
  birthdate?: string
  code?: string
  gender?: 'male' | 'female' | 'other'
  created_at?: string
  updated_at?: string
  delinquent?: boolean
}

export interface PagarmeAddress {
  line_1: string
  line_2?: string
  zip_code: string
  city: string
  state: string
  country: string
}

// ==== TRANSAÇÃO / PEDIDO ====
export interface PagarmeOrder {
  id: string
  code?: string
  amount: number
  currency: string
  closed: boolean
  items: PagarmeOrderItem[]
  customer: PagarmeCustomer
  status: 'pending' | 'paid' | 'canceled' | 'processing' | 'failed'
  created_at: string
  updated_at: string
  closed_at?: string
  charges?: PagarmeCharge[]
  metadata?: Record<string, any>
}

export interface PagarmeOrderItem {
  id?: string
  amount: number
  description: string
  quantity: number
  code?: string
  category?: string
}

// ==== COBRANÇA ====
export interface PagarmeCharge {
  id: string
  code?: string
  amount: number
  paid_amount?: number
  status: 'pending' | 'paid' | 'canceled' | 'processing' | 'failed' | 'overpaid' | 'underpaid'
  currency: string
  payment_method: 'credit_card' | 'debit_card' | 'boleto' | 'pix' | 'voucher'
  paid_at?: string
  created_at: string
  updated_at: string
  customer: PagarmeCustomer
  last_transaction?: PagarmeTransaction
  metadata?: Record<string, any>
}

// ==== TRANSAÇÃO ====
export interface PagarmeTransaction {
  id: string
  gateway_id?: string
  amount: number
  status: 'authorized' | 'paid' | 'refunded' | 'waiting_payment' | 'pending_refund' | 'refused' | 'chargedback' | 'analyzing' | 'pending_review'
  success: boolean
  installments?: number
  statement_descriptor?: string
  acquirer_name?: string
  acquirer_tid?: string
  acquirer_nsu?: string
  acquirer_auth_code?: string
  acquirer_message?: string
  acquirer_return_code?: string
  operation_type?: string
  card?: PagarmeCard
  created_at: string
  updated_at: string
  gateway_response?: {
    code: string
    errors?: any[]
  }
  antifraud_response?: any
  metadata?: Record<string, any>
  split?: PagarmeSplit[]
  pix_qr_code?: string
  pix_qr_code_url?: string
  pix_expires_at?: string
  boleto_url?: string
  boleto_barcode?: string
  boleto_pdf?: string
  boleto_due_at?: string
}

// ==== CARTÃO ====
export interface PagarmeCard {
  id: string
  first_six_digits: string
  last_four_digits: string
  brand: string
  holder_name: string
  exp_month: number
  exp_year: number
  status: 'active' | 'blocked' | 'canceled'
  type: 'credit' | 'debit'
  created_at: string
  updated_at: string
  billing_address?: PagarmeAddress
}

// ==== ASSINATURA ====
export interface PagarmeSubscription {
  id: string
  code?: string
  start_at?: string
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  billing_type: 'prepaid' | 'postpaid' | 'exact_day'
  current_cycle?: PagarmeSubscriptionCycle
  payment_method: 'credit_card' | 'boleto' | 'pix'
  currency: string
  installments?: number
  status: 'active' | 'pending' | 'canceled' | 'trialing' | 'ended'
  created_at: string
  updated_at: string
  customer: PagarmeCustomer
  card?: PagarmeCard
  items: PagarmeSubscriptionItem[]
  statement_descriptor?: string
  metadata?: Record<string, any>
  setup?: {
    amount: number
    description: string
    payment: 'credit_card' | 'boleto' | 'pix'
  }
  canceled_at?: string
  ended_at?: string
  trial_period_days?: number
}

export interface PagarmeSubscriptionItem {
  id?: string
  description: string
  quantity: number
  pricing_scheme: {
    price: number
    scheme_type: 'unit' | 'volume' | 'tiered' | 'package' | 'stairstep'
  }
  cycles?: number
  name?: string
}

export interface PagarmeSubscriptionCycle {
  id: string
  start_at: string
  end_at: string
  billing_at: string
  status: 'pending' | 'paid' | 'canceled'
  cycle: number
}

// ==== PLANO DE ASSINATURA ====
export interface PagarmePlan {
  id: string
  name: string
  description?: string
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  billing_type: 'prepaid' | 'postpaid' | 'exact_day'
  payment_methods: Array<'credit_card' | 'boleto' | 'pix'>
  installments: number[]
  status: 'active' | 'inactive'
  currency: string
  items: PagarmePlanItem[]
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  minimum_price?: number
  trial_period_days?: number
}

export interface PagarmePlanItem {
  id?: string
  name: string
  description?: string
  pricing_scheme: {
    price: number
    scheme_type: 'unit' | 'volume' | 'tiered' | 'package' | 'stairstep'
  }
  quantity?: number
  cycles?: number
}

// ==== SPLIT DE PAGAMENTO (MARKETPLACE) ====
export interface PagarmeSplit {
  amount: number
  recipient_id: string
  type: 'flat' | 'percentage'
  options?: {
    liable?: boolean
    charge_processing_fee?: boolean
    charge_remainder_fee?: boolean
  }
}

export interface PagarmeRecipient {
  id: string
  name: string
  email: string
  document: string
  type: 'individual' | 'company'
  status: 'active' | 'inactive' | 'blocked' | 'validation'
  default_bank_account?: PagarmeBankAccount
  created_at: string
  updated_at: string
  automatic_anticipation_settings?: {
    enabled: boolean
    type: 'full' | 'partial'
    volume_percentage?: number
    delay?: number
  }
  transfer_settings?: {
    transfer_enabled: boolean
    transfer_interval: 'daily' | 'weekly' | 'monthly'
    transfer_day?: number
  }
  metadata?: Record<string, any>
}

export interface PagarmeBankAccount {
  id: string
  holder_name: string
  holder_type: 'individual' | 'company'
  holder_document: string
  bank: string
  branch_number: string
  branch_check_digit?: string
  account_number: string
  account_check_digit: string
  type: 'checking' | 'savings'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

// ==== WEBHOOKS ====
export interface PagarmeWebhook {
  id: string
  account_id: string
  type: PagarmeWebhookType
  data: any
  created_at: string
}

export type PagarmeWebhookType =
  | 'charge.paid'
  | 'charge.pending'
  | 'charge.failed'
  | 'charge.refunded'
  | 'charge.chargeback'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'order.paid'
  | 'order.canceled'
  | 'order.payment_failed'
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.payment_failed'

// ==== RESPONSE DA API ====
export interface PagarmeApiResponse<T> {
  data?: T
  errors?: PagarmeError[]
  paging?: {
    total: number
    page: number
    next?: string
    previous?: string
  }
}

export interface PagarmeError {
  type: string
  message: string
  parameter_name?: string
}

// ==== REQUEST DE CRIAÇÃO ====
export interface CreatePagarmeOrderRequest {
  code?: string
  customer: {
    name: string
    email: string
    document?: string
    type?: 'individual' | 'company'
    address?: PagarmeAddress
    phones?: {
      mobile_phone: {
        country_code: string
        area_code: string
        number: string
      }
    }
  }
  items: Array<{
    amount: number
    description: string
    quantity: number
    code?: string
  }>
  payments: Array<{
    payment_method: 'credit_card' | 'debit_card' | 'boleto' | 'pix'
    credit_card?: {
      card?: {
        number: string
        holder_name: string
        exp_month: number
        exp_year: number
        cvv: string
      }
      card_id?: string
      installments?: number
      statement_descriptor?: string
    }
    pix?: {
      expires_in?: number
      additional_information?: Array<{
        name: string
        value: string
      }>
    }
    boleto?: {
      bank?: string
      instructions?: string
      due_at?: string
      document_number?: string
    }
  }>
  metadata?: Record<string, any>
  antifraud_enabled?: boolean
  ip?: string
  session_id?: string
}

export interface CreatePagarmeSubscriptionRequest {
  code?: string
  payment_method: 'credit_card' | 'boleto' | 'pix'
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  billing_type: 'prepaid' | 'postpaid'
  installments?: number
  statement_descriptor?: string
  customer: {
    name: string
    email: string
    document?: string
    type?: 'individual' | 'company'
    address?: PagarmeAddress
    phones?: {
      mobile_phone: {
        country_code: string
        area_code: string
        number: string
      }
    }
  }
  card?: {
    number: string
    holder_name: string
    exp_month: number
    exp_year: number
    cvv: string
    billing_address?: PagarmeAddress
  }
  card_id?: string
  items: Array<{
    description: string
    quantity: number
    pricing_scheme: {
      price: number
    }
  }>
  metadata?: Record<string, any>
  setup?: {
    amount: number
    description: string
    payment: 'credit_card' | 'boleto' | 'pix'
  }
}

// ==== FILTROS E QUERIES ====
export interface PagarmeListQuery {
  page?: number
  size?: number
  code?: string
  status?: string
  created_since?: string
  created_until?: string
  customer_id?: string
}

// ==== BALANCE E TRANSFERÊNCIAS ====
export interface PagarmeBalance {
  available_amount: number
  waiting_funds_amount: number
  transferred_amount: number
  currency: string
}

export interface PagarmeTransfer {
  id: string
  amount: number
  type: 'debit' | 'credit'
  status: 'pending' | 'processing' | 'transferred' | 'failed'
  created_at: string
  updated_at: string
  bank_account: PagarmeBankAccount
  metadata?: Record<string, any>
}

// ==== TIPOS DE ANALYTICS ====
export interface PagarmeAnalytics {
  total_amount: number
  total_orders: number
  total_customers: number
  total_subscriptions: number
  payment_methods: {
    credit_card: number
    debit_card: number
    pix: number
    boleto: number
  }
  status_breakdown: {
    paid: number
    pending: number
    failed: number
    canceled: number
  }
  period: {
    start: string
    end: string
  }
}

