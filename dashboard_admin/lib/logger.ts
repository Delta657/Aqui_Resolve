import { config, maskSensitiveData } from './config';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  data?: any;
  error?: Error;
  duration?: number | string;
  metadata?: Record<string, any>;
}

export class Logger {
  private context: string;
  private requestId?: string;
  private userId?: string;

  constructor(context: string = 'app') {
    this.context = context;
  }

  /**
   * Define o contexto da requisição
   */
  setContext(context: string): Logger {
    this.context = context;
    return this;
  }

  /**
   * Define o ID da requisição
   */
  setRequestId(requestId: string): Logger {
    this.requestId = requestId;
    return this;
  }

  /**
   * Define o ID do usuário
   */
  setUserId(userId: string): Logger {
    this.userId = userId;
    return this;
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, { error, data });
  }

  /**
   * Log de aviso
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, { data });
  }

  /**
   * Log de informação
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, { data });
  }

  /**
   * Log de debug
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, { data });
  }

  /**
   * Log de trace
   */
  trace(message: string, data?: any): void {
    this.log(LogLevel.TRACE, message, { data });
  }

  /**
   * Log de requisição HTTP
   */
  logRequest(method: string, url: string, ip: string, userAgent: string, duration?: number): void {
    this.info('HTTP Request', {
      method,
      url,
      ip,
      userAgent,
      duration: duration ? `${duration}ms` : undefined
    });
  }

  /**
   * Log de resposta HTTP
   */
  logResponse(statusCode: number, duration?: number): void {
    this.info('HTTP Response', {
      statusCode,
      duration: duration ? `${duration}ms` : undefined
    });
  }

  /**
   * Log de integração
   */
  logIntegration(provider: string, action: string, success: boolean, data?: any, error?: Error): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `Integration ${provider}: ${action}`, {
      provider,
      action,
      success,
      data: maskSensitiveData(data),
      error
    });
  }

  /**
   * Log de auditoria
   */
  logAudit(action: string, entityType: string, entityId: string, oldValues?: any, newValues?: any): void {
    this.info('Audit Log', {
      action,
      entityType,
      entityId,
      oldValues: maskSensitiveData(oldValues),
      newValues: maskSensitiveData(newValues)
    });
  }

  /**
   * Log de performance
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      metadata
    });
  }

  /**
   * Log principal
   */
  private log(level: LogLevel, message: string, options: {
    error?: Error;
    data?: any;
    ip?: string;
    userAgent?: string;
    duration?: number | string;
    metadata?: Record<string, any>;
    [key: string]: unknown;
  } = {}): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      userId: this.userId,
      requestId: this.requestId,
      ip: options.ip,
      userAgent: options.userAgent,
      data: options.data ? maskSensitiveData(options.data) : undefined,
      error: options.error ? {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack
      } as Error : undefined,
      duration: options.duration,
      metadata: options.metadata
    };

    this.output(logEntry);
  }

  /**
   * Saída do log
   */
  private output(entry: LogEntry): void {
    const shouldLog = this.shouldLog(entry.level);
    if (!shouldLog) return;

    if (config.app.env === 'production' || config.app.env === 'staging') {
      // Log estruturado para produção
      console.log(JSON.stringify(entry));
    } else {
      // Log formatado para desenvolvimento
      this.formatLog(entry);
    }
  }

  /**
   * Verifica se deve fazer log baseado no nível
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(level);
    const configLevelIndex = levels.indexOf(config.app.env === 'production' ? LogLevel.INFO : LogLevel.DEBUG);
    
    return currentLevelIndex <= configLevelIndex;
  }

  /**
   * Formata log para desenvolvimento
   */
  private formatLog(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? `[${entry.context}]` : '';
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';
    const userId = entry.userId ? `[${entry.userId}]` : '';
    
    let output = `${timestamp} ${level} ${context}${requestId}${userId} ${entry.message}`;
    
    if (entry.data) {
      output += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    if (entry.duration) {
      output += `\n  Duration: ${entry.duration}ms`;
    }
    
    if (entry.metadata) {
      output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    
    console.log(output);
  }
}

// Logger principal
export const logger = new Logger();

// Loggers específicos
export const createLogger = (context: string): Logger => new Logger(context);

// Loggers para diferentes módulos
export const financeLogger = createLogger('finance');
export const integrationLogger = createLogger('integration');
export const securityLogger = createLogger('security');
export const auditLogger = createLogger('audit');
export const performanceLogger = createLogger('performance');

// Funções utilitárias
export const logError = (message: string, error?: Error, data?: any): void => {
  logger.error(message, error, data);
};

export const logInfo = (message: string, data?: any): void => {
  logger.info(message, data);
};

export const logDebug = (message: string, data?: any): void => {
  logger.debug(message, data);
};

export const logWarn = (message: string, data?: any): void => {
  logger.warn(message, data);
};

