import bcrypt from 'bcryptjs';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'manager' | 'estoque' | 'frota';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  avatar?: string;
  phone?: string;
  department?: string;
  permissions?: {
    servicos?: {
      visualizar: boolean;
      criar: boolean;
      editar: boolean;
      excluir: boolean;
    };
    controle?: {
      autemMobile: boolean;
      estoque: boolean;
      frota: boolean;
    };
    usuarios?: {
      visualizar: boolean;
      criar: boolean;
      editar: boolean;
      excluir: boolean;
    };
                  financeiro?: {
                visualizar: boolean;
                criar: boolean;
                editar: boolean;
                excluir: boolean;
                exportar: boolean;
              };
    relatorios?: {
      visualizar: boolean;
      exportar: boolean;
    };
  };
}

export class User implements IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'manager' | 'estoque' | 'frota';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  avatar?: string;
  phone?: string;
  department?: string;
  permissions?: IUser['permissions'];

  constructor(data: Partial<IUser>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.role = data.role || 'user';
    this.isActive = data.isActive ?? true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLogin = data.lastLogin;
    this.avatar = data.avatar;
    this.phone = data.phone;
    this.department = data.department;
    this.permissions = data.permissions || this.getDefaultPermissions(data.role);
  }

  // Método para criptografar senha
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Método para verificar senha
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Método para mascarar email
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || localPart.length <= 2) {
      return email;
    }
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  // Método para obter dados públicos (sem senha)
  getPublicData(): Omit<IUser, 'password'> {
    const { password, ...publicData } = this;
    return {
      ...publicData,
      email: User.maskEmail(this.email),
      lastLogin: this.lastLogin,
      avatar: this.avatar,
      phone: this.phone,
      department: this.department
    };
  }

  // Método para atualizar dados
  update(data: Partial<Omit<IUser, 'id' | 'createdAt'>>): void {
    Object.assign(this, data);
    this.updatedAt = new Date();
  }

  // Método para desativar usuário
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  // Método para ativar usuário
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  // Método para registrar login
  recordLogin(): void {
    this.lastLogin = new Date();
    this.updatedAt = new Date();
  }

  // Método para obter permissões padrão baseadas no role
  private getDefaultPermissions(role?: string): IUser['permissions'] {
    switch (role) {
                        case 'admin':
                    return {
                      servicos: { visualizar: true, criar: true, editar: true, excluir: true },
                      controle: { autemMobile: true, estoque: true, frota: true },
                      usuarios: { visualizar: true, criar: true, editar: true, excluir: true },
                      financeiro: { visualizar: true, criar: true, editar: true, excluir: true, exportar: true },
                      relatorios: { visualizar: true, exportar: true }
                    };
                  case 'manager':
                    return {
                      servicos: { visualizar: true, criar: true, editar: true, excluir: false },
                      controle: { autemMobile: true, estoque: true, frota: true },
                      usuarios: { visualizar: true, criar: true, editar: true, excluir: false },
                      financeiro: { visualizar: true, criar: true, editar: true, excluir: false, exportar: true },
                      relatorios: { visualizar: true, exportar: true }
                    };
                        case 'estoque':
                    return {
                      servicos: { visualizar: true, criar: false, editar: false, excluir: false },
                      controle: { autemMobile: false, estoque: true, frota: false },
                      usuarios: { visualizar: false, criar: false, editar: false, excluir: false },
                      financeiro: { visualizar: false, criar: false, editar: false, excluir: false, exportar: false },
                      relatorios: { visualizar: true, exportar: false }
                    };
                  case 'frota':
                    return {
                      servicos: { visualizar: true, criar: false, editar: false, excluir: false },
                      controle: { autemMobile: false, estoque: false, frota: true },
                      usuarios: { visualizar: false, criar: false, editar: false, excluir: false },
                      financeiro: { visualizar: false, criar: false, editar: false, excluir: false, exportar: false },
                      relatorios: { visualizar: true, exportar: false }
                    };
                  default: // user
                    return {
                      servicos: { visualizar: true, criar: false, editar: false, excluir: false },
                      controle: { autemMobile: false, estoque: false, frota: false },
                      usuarios: { visualizar: false, criar: false, editar: false, excluir: false },
                      financeiro: { visualizar: false, criar: false, editar: false, excluir: false, exportar: false },
                      relatorios: { visualizar: false, exportar: false }
                    };
    }
  }

  // Método para verificar permissão específica
  hasPermission(module: keyof IUser['permissions'], action?: string): boolean {
    if (!this.permissions) return false;
    
    const modulePermissions = this.permissions[module];
    if (!modulePermissions) return false;

    if (action) {
      return modulePermissions[action as keyof typeof modulePermissions] === true;
    }

    return Object.values(modulePermissions).some(permission => permission === true);
  }

  // Método para atualizar permissões
  updatePermissions(permissions: IUser['permissions']): void {
    this.permissions = { ...this.permissions, ...permissions };
    this.updatedAt = new Date();
  }

  // Método para verificar se tem acesso ao módulo de controle
  hasControleAccess(module: 'autemMobile' | 'estoque' | 'frota'): boolean {
    return this.hasPermission('controle', module);
  }
}
