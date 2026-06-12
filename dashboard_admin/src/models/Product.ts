export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  images: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  supplier?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export class Product implements IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  brand: string;
  sku: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  images: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  supplier?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };

  constructor(data: Partial<IProduct>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.cost = data.cost || 0;
    this.category = data.category || '';
    this.brand = data.brand || '';
    this.sku = data.sku || '';
    this.stock = data.stock || 0;
    this.minStock = data.minStock || 0;
    this.isActive = data.isActive ?? true;
    this.images = data.images || [];
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.supplier = data.supplier;
    this.weight = data.weight;
    this.dimensions = data.dimensions;
  }

  // Calcular margem de lucro
  getProfitMargin(): number {
    if (this.cost === 0) return 0;
    return ((this.price - this.cost) / this.cost) * 100;
  }

  // Calcular lucro unitário
  getUnitProfit(): number {
    return this.price - this.cost;
  }

  // Verificar se produto está em estoque
  isInStock(): boolean {
    return this.stock > 0;
  }

  // Verificar se estoque está baixo
  isLowStock(): boolean {
    return this.stock <= this.minStock;
  }

  // Adicionar ao estoque
  addToStock(quantity: number): void {
    this.stock += quantity;
    this.updatedAt = new Date();
  }

  // Remover do estoque
  removeFromStock(quantity: number): boolean {
    if (this.stock >= quantity) {
      this.stock -= quantity;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  // Atualizar preço
  updatePrice(newPrice: number): void {
    this.price = newPrice;
    this.updatedAt = new Date();
  }

  // Atualizar custo
  updateCost(newCost: number): void {
    this.cost = newCost;
    this.updatedAt = new Date();
  }

  // Adicionar imagem
  addImage(imageUrl: string): void {
    this.images.push(imageUrl);
    this.updatedAt = new Date();
  }

  // Remover imagem
  removeImage(imageUrl: string): void {
    this.images = this.images.filter(img => img !== imageUrl);
    this.updatedAt = new Date();
  }

  // Adicionar tag
  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  // Remover tag
  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
  }

  // Ativar produto
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Desativar produto
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Obter dados públicos
  getPublicData(): Omit<IProduct, 'cost' | 'supplier'> {
    const { cost, supplier, ...publicData } = this;
    return publicData;
  }
}
