import { EnvironmentConfig } from '@/types/finance';

// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_URL',
  'REDIS_URL',
  'ENCRYPTION_KEY'
];

// Verificar variáveis obrigatórias
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${envVar}`);
  }
}

// Função para obter valor de ambiente com fallback
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${key}`);
  }
  return value || defaultValue!;
};

// Função para obter valor booleano
const getEnvBool = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnv(key, defaultValue.toString());
  return value.toLowerCase() === 'true';
};

// Função para obter valor numérico
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = getEnv(key, defaultValue.toString());
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Variável de ambiente ${key} deve ser um número válido`);
  }
  return num;
};

// Configuração principal
export const config: EnvironmentConfig = {
  app: {
    env: (getEnv('APP_ENV', 'development') as 'development' | 'staging' | 'production'),
    port: getEnvNumber('PORT', 3000),
    jwtSecret: getEnv('JWT_SECRET'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '24h'),
  },
  database: {
    url: getEnv('DB_URL'),
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    name: getEnv('DB_NAME', 'finance'),
    user: getEnv('DB_USER', 'user'),
    pass: getEnv('DB_PASS', 'pass'),
  },
  redis: {
    url: getEnv('REDIS_URL'),
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: getEnv('REDIS_PASSWORD', undefined),
  },
  features: {
    bank: getEnvBool('FEATURE_BANK', true),
    nfe: getEnvBool('FEATURE_NFE', true),
    nfse: getEnvBool('FEATURE_NFSE', true),
    payments: getEnvBool('FEATURE_PAYMENTS', true),
    email: getEnvBool('FEATURE_EMAIL', true),
    sms: getEnvBool('FEATURE_SMS', true),
    storage: getEnvBool('FEATURE_STORAGE', true),
    oauth: getEnvBool('FEATURE_OAUTH', true),
    sandbox: getEnvBool('FEATURE_SANDBOX', true),
  },
  integrations: {
    bank: {
      baseUrl: getEnv('BANK_API_BASE_URL', 'https://api.sandbox.bank.com'),
      apiKey: getEnv('BANK_API_KEY', undefined),
      webhookSecret: getEnv('BANK_WEBHOOK_SECRET', undefined),
      clientId: getEnv('BANK_CLIENT_ID', undefined),
      clientSecret: getEnv('BANK_CLIENT_SECRET', undefined),
      certPath: getEnv('BANK_CERT_PATH', undefined),
      certPass: getEnv('BANK_CERT_PASS', undefined),
    },
    nfe: {
      baseUrl: getEnv('NFE_API_BASE_URL', 'https://api.sandbox.nfe.com'),
      apiKey: getEnv('NFE_API_KEY', undefined),
      certPath: getEnv('NFE_CERT_PATH', undefined),
      certPass: getEnv('NFE_CERT_PASS', undefined),
      ambiente: getEnvNumber('NFE_AMBIENTE', 2),
      empresaCNPJ: getEnv('NFE_EMPRESA_CNPJ', undefined),
    },
    nfse: {
      baseUrl: getEnv('NFSE_API_BASE_URL', 'https://api.sandbox.nfse.com'),
      apiKey: getEnv('NFSE_API_KEY', undefined),
      certPath: getEnv('NFSE_CERT_PATH', undefined),
      certPass: getEnv('NFSE_CERT_PASS', undefined),
      ambiente: getEnvNumber('NFSE_AMBIENTE', 2),
      empresaCNPJ: getEnv('NFSE_EMPRESA_CNPJ', undefined),
    },
    payments: {
      baseUrl: getEnv('PAYMENTS_API_BASE_URL', 'https://api.sandbox.payments.com'),
      apiKey: getEnv('PAYMENTS_API_KEY', undefined),
      clientId: getEnv('PAYMENTS_CLIENT_ID', undefined),
      clientSecret: getEnv('PAYMENTS_CLIENT_SECRET', undefined),
      pixCertPath: getEnv('PIX_CERT_PATH', undefined),
      pixCertPass: getEnv('PIX_CERT_PASS', undefined),
    },
    email: {
      apiKey: getEnv('EMAIL_API_KEY', undefined),
      from: getEnv('EMAIL_FROM', 'noreply@empresa.com'),
      templatePath: getEnv('EMAIL_TEMPLATE_PATH', './templates/email'),
    },
    sms: {
      apiKey: getEnv('SMS_API_KEY', undefined),
      from: getEnv('SMS_FROM', 'EMPRESA'),
      webhookUrl: getEnv('SMS_WEBHOOK_URL', undefined),
    },
    storage: {
      bucket: getEnv('STORAGE_BUCKET', 'finance-docs'),
      accessKey: getEnv('STORAGE_ACCESS_KEY', undefined),
      secretKey: getEnv('STORAGE_SECRET_KEY', undefined),
      region: getEnv('STORAGE_REGION', 'us-east-1'),
      endpoint: getEnv('STORAGE_ENDPOINT', undefined),
    },
    oauth: {
      google: {
        clientId: getEnv('OAUTH_GOOGLE_CLIENT_ID', undefined),
        clientSecret: getEnv('OAUTH_GOOGLE_CLIENT_SECRET', undefined),
        redirectUrl: getEnv('OAUTH_GOOGLE_REDIRECT_URL', 'http://localhost:3000/auth/google/callback'),
      },
      microsoft: {
        clientId: getEnv('OAUTH_MICROSOFT_CLIENT_ID', undefined),
        clientSecret: getEnv('OAUTH_MICROSOFT_CLIENT_SECRET', undefined),
        redirectUrl: getEnv('OAUTH_MICROSOFT_REDIRECT_URL', 'http://localhost:3000/auth/microsoft/callback'),
      },
    },
  },
  security: {
    bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
    rateLimitWindow: getEnv('RATE_LIMIT_WINDOW', '15m'),
    rateLimitMax: getEnvNumber('RATE_LIMIT_MAX', 100),
    corsOrigin: getEnv('CORS_ORIGIN', 'http://localhost:3000'),
    encryptionKey: getEnv('ENCRYPTION_KEY'),
    encryptionAlgorithm: getEnv('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),
  },
  webhooks: {
    bank: getEnv('WEBHOOK_BANK_URL', 'http://localhost:3000/api/webhooks/bank'),
    payments: getEnv('WEBHOOK_PAYMENTS_URL', 'http://localhost:3000/api/webhooks/payments'),
    fiscal: getEnv('WEBHOOK_FISCAL_URL', 'http://localhost:3000/api/webhooks/fiscal'),
  },
  scheduler: {
    conciliation: getEnv('SCHEDULE_CONCILIATION', '0 1 * * *'),
    closing: getEnv('SCHEDULE_CLOSING', '0 0 1 * *'),
    reports: getEnv('SCHEDULE_REPORTS', '0 6 * * 1'),
  },
};

// Função para verificar se uma integração está configurada
export const isIntegrationConfigured = (integration: keyof EnvironmentConfig['integrations']): boolean => {
  const integrationConfig = config.integrations[integration] as unknown as Record<string, unknown>;

  switch (integration) {
    case 'bank':
      return !!(integrationConfig.apiKey || integrationConfig.clientId);
    case 'nfe':
    case 'nfse':
      return !!(integrationConfig.apiKey || integrationConfig.certPath);
    case 'payments':
      return !!(integrationConfig.apiKey || integrationConfig.clientId);
    case 'email':
    case 'sms':
      return !!integrationConfig.apiKey;
    case 'storage':
      return !!(integrationConfig.accessKey && integrationConfig.secretKey);
    case 'oauth':
      return !!(config.integrations.oauth.google.clientId || config.integrations.oauth.microsoft.clientId);
    default:
      return false;
  }
};

// Função para obter status de uma integração
export const getIntegrationStatus = (integration: keyof EnvironmentConfig['integrations']): 'disabled' | 'sandbox' | 'production' => {
  if (!config.features[integration as keyof EnvironmentConfig['features']]) {
    return 'disabled';
  }
  
  if (!isIntegrationConfigured(integration)) {
    return 'sandbox';
  }
  
  return config.app.env === 'production' ? 'production' : 'sandbox';
};

// Função para mascarar dados sensíveis nos logs
export const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const masked = { ...data };
  const sensitiveKeys = ['password', 'secret', 'key', 'token', 'cert', 'pass'];
  
  for (const key in masked) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      if (typeof masked[key] === 'string' && masked[key].length > 0) {
        masked[key] = '***MASKED***';
      }
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  
  return masked;
};

// Função para validar configuração de ambiente
export const validateConfig = (): void => {
  const errors: string[] = [];
  
  // Validar configurações de segurança
  if (config.app.env === 'production') {
    if (config.security.encryptionKey === 'changeme') {
      errors.push('ENCRYPTION_KEY deve ser alterada em produção');
    }
    if (config.app.jwtSecret === 'changeme') {
      errors.push('JWT_SECRET deve ser alterada em produção');
    }
  }
  
  // Validar configurações de banco de dados
  if (!config.database.url.includes('postgres')) {
    errors.push('DB_URL deve ser uma URL PostgreSQL válida');
  }
  
  // Validar configurações de Redis
  if (!config.redis.url.includes('redis')) {
    errors.push('REDIS_URL deve ser uma URL Redis válida');
  }
  
  if (errors.length > 0) {
    throw new Error(`Erros de configuração:\n${errors.join('\n')}`);
  }
};

// Exportar configuração validada
export default config;

