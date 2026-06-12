export interface IOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'pix' | 'bank_transfer' | 'cash';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class Order implements IOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'pix' | 'bank_transfer' | 'cash';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
  shippingAddress?: Address;
  billingAddress?: Address;

  constructor(data: Partial<IOrder>) {
    this.id = data.id || '';
    this.customerId = data.customerId || '';
    this.customerName = data.customerName || '';
    this.customerEmail = data.customerEmail || '';
    this.items = data.items || [];
    this.total = data.total || 0;
    this.status = data.status || 'pending';
    this.paymentStatus = data.paymentStatus || 'pending';
    this.paymentMethod = data.paymentMethod || 'credit_card';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.completedAt = data.completedAt;
    this.notes = data.notes;
    this.shippingAddress = data.shippingAddress;
    this.billingAddress = data.billingAddress;
  }

  // Calcular total do pedido
  calculateTotal(): number {
    this.total = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    return this.total;
  }

  // Adicionar item ao pedido
  addItem(item: OrderItem): void {
    this.items.push(item);
    this.calculateTotal();
    this.updatedAt = new Date();
  }

  // Remover item do pedido
  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
    this.calculateTotal();
    this.updatedAt = new Date();
  }

  // Atualizar status do pedido
  updateStatus(status: IOrder['status']): void {
    this.status = status;
    this.updatedAt = new Date();
    
    if (status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
  }

  // Atualizar status do pagamento
  updatePaymentStatus(paymentStatus: IOrder['paymentStatus']): void {
    this.paymentStatus = paymentStatus;
    this.updatedAt = new Date();
  }

  // Verificar se pedido está pago
  isPaid(): boolean {
    return this.paymentStatus === 'paid';
  }

  // Verificar se pedido está completo
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  // Obter dados públicos (mascarando email)
  getPublicData(): Omit<IOrder, 'customerEmail'> & { customerEmail: string } {
    const { customerEmail, ...publicData } = this;
    return {
      ...publicData,
      customerEmail: this.maskEmail(customerEmail)
    };
  }

  // Mascarar email do cliente
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || localPart.length <= 2) {
      return email;
    }
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }
}
