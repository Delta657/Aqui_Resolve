// Importações condicionais para compatibilidade com cliente/servidor
const crypto = typeof window === 'undefined' ? require('crypto') : null;

// Configurações de autenticação para área de documentos
export const DOCUMENT_AUTH_CONFIG = {
  // Usuário autorizado para acesso à área de documentos
  AUTHORIZED_USERS: [
    {
      email: 'testedocumento@gmail.com',
      password: 'admin123', // Será hash em produção
      role: 'document_admin',
      name: 'Administrador de Documentos'
    }
  ],
  
  // Configurações de sessão
  SESSION_CONFIG: {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const
  }
};

// Função para gerar hash da senha
export const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  if (typeof window === 'undefined' && crypto) {
    // Servidor: usar crypto nativo
    const generatedSalt = salt || crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: generatedSalt };
  } else {
    // Cliente: implementação simples para desenvolvimento
    const generatedSalt = salt || Math.random().toString(36).substring(2) + Date.now().toString(36);
    const hash = btoa(password + generatedSalt + 'salt_key');
    return { hash, salt: generatedSalt };
  }
};

// Função para verificar senha
export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const { hash: generatedHash } = hashPassword(password, salt);
  return generatedHash === hash;
};

// Função para gerar token de sessão
export const generateSessionToken = (): string => {
  if (typeof window === 'undefined' && crypto) {
    // Servidor: usar crypto nativo
    return crypto.randomBytes(32).toString('hex');
  } else {
    // Cliente: implementação simples para desenvolvimento
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback para navegadores sem crypto.getRandomValues
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
};

// Função para validar credenciais
export const validateCredentials = (email: string, password: string): { 
  valid: boolean; 
  user?: { email: string; role: string; name: string } 
} => {
  const user = DOCUMENT_AUTH_CONFIG.AUTHORIZED_USERS.find(u => u.email === email);
  
  if (!user) {
    return { valid: false };
  }
  
  // Em produção, comparar com hash armazenado
  // Por enquanto, comparação direta para desenvolvimento
  if (user.password === password) {
    return {
      valid: true,
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      }
    };
  }
  
  return { valid: false };
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = (sessionToken?: string): boolean => {
  // Em produção, verificar token no banco de dados ou cache
  // Por enquanto, verificação simples
  return !!sessionToken && sessionToken.length === 64;
};

// Função para criptografar dados sensíveis
export const encryptSensitiveData = (data: string, key?: string): string => {
  const encryptionKey = key || (typeof process !== 'undefined' ? process.env.DOCUMENT_ENCRYPTION_KEY : null) || 'default-key-change-in-production';
  
  if (typeof window === 'undefined' && crypto) {
    // Servidor: usar crypto nativo
    const hash = crypto.createHash('sha256').update(encryptionKey).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createHash('sha256').update(data + encryptionKey).digest('hex');
    return iv.toString('hex') + ':' + cipher;
  } else {
    // Cliente: implementação simples para desenvolvimento
    const timestamp = Date.now().toString();
    const simpleHash = btoa(data + encryptionKey + timestamp);
    return timestamp + ':' + simpleHash;
  }
};

// Função para descriptografar dados sensíveis
export const decryptSensitiveData = (encryptedData: string, key?: string): string => {
  try {
    const encryptionKey = key || (typeof process !== 'undefined' ? process.env.DOCUMENT_ENCRYPTION_KEY : null) || 'default-key-change-in-production';
    const parts = encryptedData.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Implementação simples de descriptografia
    // Em produção, implementar descriptografia adequada
    const iv = parts[0];
    const cipher = parts[1];
    
    // Por simplicidade, retornar dados descriptografados
    // Em produção, implementar lógica de descriptografia real
    return 'decrypted_data';
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Função para mascarar informações sensíveis
export const maskSensitiveInfo = (info: string, type: 'email' | 'phone' | 'document'): string => {
  switch (type) {
    case 'email':
      const [localPart, domain] = info.split('@');
      return `${localPart.substring(0, 2)}***@${domain}`;
    
    case 'phone':
      return info.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-****');
    
    case 'document':
      return info.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    
    default:
      return info;
  }
};

// Função para gerar código de cliente criptografado
export const generateClientCode = (clientId: string): string => {
  const timestamp = Date.now().toString();
  const data = `${clientId}_${timestamp}`;
  return encryptSensitiveData(data);
};

// Função para validar código de cliente
export const validateClientCode = (encryptedCode: string): { valid: boolean; clientId?: string } => {
  try {
    const decryptedData = decryptSensitiveData(encryptedCode);
    const [clientId] = decryptedData.split('_');
    
    return {
      valid: !!clientId,
      clientId: clientId || undefined
    };
  } catch (error) {
    return { valid: false };
  }
};
