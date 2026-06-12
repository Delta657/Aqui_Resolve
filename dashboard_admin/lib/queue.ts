import Redis from 'ioredis';
import { config } from './config';
import { logger } from './logger';
import { generateToken } from './encryption';

export interface QueueJob {
  id: string;
  name: string;
  data: any;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
  metadata?: Record<string, any>;
}

export interface QueueOptions {
  name: string;
  concurrency?: number;
  maxAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export type JobProcessor = (job: QueueJob) => Promise<any>;

export class Queue {
  private redis: Redis;
  private name: string;
  private processor?: JobProcessor;
  private concurrency: number;
  private maxAttempts: number;
  private retryDelay: number;
  private timeout: number;
  private isProcessing: boolean = false;
  private activeJobs: Set<string> = new Set();

  constructor(options: QueueOptions) {
    this.name = options.name;
    this.concurrency = options.concurrency || 1;
    this.maxAttempts = options.maxAttempts || 3;
    this.retryDelay = options.retryDelay || 5000;
    this.timeout = options.timeout || 30000;

    this.redis = new Redis(config.redis.url, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('error', (error) => {
      logger.error(`Redis error in queue ${this.name}:`, error);
    });

    this.redis.on('connect', () => {
      logger.info(`Redis connected for queue ${this.name}`);
    });
  }

  /**
   * Adiciona um job à fila
   */
  async add(name: string, data: any, options: {
    priority?: number;
    delay?: number;
    attempts?: number;
    maxAttempts?: number;
    metadata?: Record<string, any>;
  } = {}): Promise<string> {
    const job: QueueJob = {
      id: generateToken(16),
      name,
      data,
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 0,
      maxAttempts: options.maxAttempts || this.maxAttempts,
      createdAt: new Date(),
      metadata: options.metadata,
    };

    const jobData = JSON.stringify(job);
    const score = Date.now() + (options.delay || 0);

    await this.redis.zadd(
      `${this.name}:pending`,
      score,
      jobData
    );

    logger.info(`Job added to queue ${this.name}`, {
      jobId: job.id,
      jobName: name,
      delay: options.delay,
      priority: options.priority
    });

    return job.id;
  }

  /**
   * Processa jobs da fila
   */
  async process(processor: JobProcessor): Promise<void> {
    this.processor = processor;
    this.isProcessing = true;

    logger.info(`Starting queue processor for ${this.name}`);

    while (this.isProcessing) {
      try {
        await this.processNextJob();
        await this.sleep(100); // Pequena pausa para não sobrecarregar
      } catch (error) {
        logger.error(`Error processing queue ${this.name}:`, error);
        await this.sleep(1000); // Pausa maior em caso de erro
      }
    }
  }

  /**
   * Para o processamento da fila
   */
  async stop(): Promise<void> {
    this.isProcessing = false;
    logger.info(`Stopping queue processor for ${this.name}`);
  }

  /**
   * Processa o próximo job
   */
  private async processNextJob(): Promise<void> {
    if (this.activeJobs.size >= this.concurrency) {
      return; // Limite de concorrência atingido
    }

    const now = Date.now();
    const jobs = await this.redis.zrangebyscore(
      `${this.name}:pending`,
      0,
      now,
      'LIMIT',
      0,
      1
    );

    if (jobs.length === 0) {
      return; // Nenhum job disponível
    }

    const jobData = jobs[0];
    const job: QueueJob = JSON.parse(jobData);

    // Remove o job da fila de pendentes
    await this.redis.zrem(`${this.name}:pending`, jobData);

    // Adiciona à lista de jobs ativos
    this.activeJobs.add(job.id);

    // Processa o job em background
    this.processJob(job).finally(() => {
      this.activeJobs.delete(job.id);
    });
  }

  /**
   * Processa um job específico
   */
  private async processJob(job: QueueJob): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(`Processing job ${job.id} in queue ${this.name}`, {
        jobName: job.name,
        attempts: job.attempts
      });

      if (!this.processor) {
        throw new Error('No processor registered for this queue');
      }

      // Define timeout para o job
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), this.timeout);
      });

      const result = await Promise.race([
        this.processor(job),
        timeoutPromise
      ]);

      job.result = result;
      job.processedAt = new Date();

      // Move para fila de completados
      await this.redis.lpush(
        `${this.name}:completed`,
        JSON.stringify(job)
      );

      const duration = Date.now() - startTime;
      logger.info(`Job ${job.id} completed successfully`, {
        jobName: job.name,
        duration: `${duration}ms`
      });

    } catch (error) {
      await this.handleJobError(job, error as Error);
    }
  }

  /**
   * Trata erro de job
   */
  private async handleJobError(job: QueueJob, error: Error): Promise<void> {
    job.attempts = (job.attempts || 0) + 1;
    job.error = error.message;

    logger.error(`Job ${job.id} failed`, {
      jobName: job.name,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      error: error.message
    });

    if (job.attempts >= (job.maxAttempts || this.maxAttempts)) {
      // Job falhou definitivamente
      job.failedAt = new Date();
      
      await this.redis.lpush(
        `${this.name}:failed`,
        JSON.stringify(job)
      );

      logger.error(`Job ${job.id} permanently failed`, {
        jobName: job.name,
        attempts: job.attempts
      });
    } else {
      // Reagenda o job para retry
      const delay = this.retryDelay * Math.pow(2, job.attempts - 1); // Backoff exponencial
      const score = Date.now() + delay;

      await this.redis.zadd(
        `${this.name}:pending`,
        score,
        JSON.stringify(job)
      );

      logger.info(`Job ${job.id} scheduled for retry`, {
        jobName: job.name,
        attempts: job.attempts,
        delay: `${delay}ms`
      });
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  async getStats(): Promise<{
    pending: number;
    completed: number;
    failed: number;
    active: number;
  }> {
    const [pending, completed, failed] = await Promise.all([
      this.redis.zcard(`${this.name}:pending`),
      this.redis.llen(`${this.name}:completed`),
      this.redis.llen(`${this.name}:failed`),
    ]);

    return {
      pending,
      completed,
      failed,
      active: this.activeJobs.size,
    };
  }

  /**
   * Limpa jobs antigos
   */
  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAge;

    // Limpa jobs completados antigos
    const completedJobs = await this.redis.lrange(`${this.name}:completed`, 0, -1);
    for (const jobData of completedJobs) {
      const job: QueueJob = JSON.parse(jobData);
      if (job.processedAt && job.processedAt.getTime() < cutoff) {
        await this.redis.lrem(`${this.name}:completed`, 1, jobData);
      }
    }

    // Limpa jobs falhados antigos
    const failedJobs = await this.redis.lrange(`${this.name}:failed`, 0, -1);
    for (const jobData of failedJobs) {
      const job: QueueJob = JSON.parse(jobData);
      if (job.failedAt && job.failedAt.getTime() < cutoff) {
        await this.redis.lrem(`${this.name}:failed`, 1, jobData);
      }
    }

    logger.info(`Cleanup completed for queue ${this.name}`);
  }

  /**
   * Utilitário para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Filas específicas do sistema financeiro
export const createQueue = (options: QueueOptions): Queue => new Queue(options);

export const bankQueue = createQueue({
  name: 'bank-integration',
  concurrency: 2,
  maxAttempts: 3,
  retryDelay: 5000,
  timeout: 30000,
});

export const nfeQueue = createQueue({
  name: 'nfe-integration',
  concurrency: 1,
  maxAttempts: 3,
  retryDelay: 10000,
  timeout: 60000,
});

export const paymentsQueue = createQueue({
  name: 'payments-integration',
  concurrency: 3,
  maxAttempts: 5,
  retryDelay: 3000,
  timeout: 45000,
});

export const emailQueue = createQueue({
  name: 'email-notifications',
  concurrency: 5,
  maxAttempts: 3,
  retryDelay: 2000,
  timeout: 15000,
});

export const reportsQueue = createQueue({
  name: 'reports-generation',
  concurrency: 2,
  maxAttempts: 2,
  retryDelay: 15000,
  timeout: 300000, // 5 minutos para relatórios
});

export const reconciliationQueue = createQueue({
  name: 'bank-reconciliation',
  concurrency: 1,
  maxAttempts: 3,
  retryDelay: 10000,
  timeout: 120000, // 2 minutos para conciliação
});

