import crypto from 'crypto';
import { config } from './config';

export class EncryptionService {
  private algorithm: string;
  private key: Buffer;
  private ivLength: number;

  constructor() {
    this.algorithm = config.security.encryptionAlgorithm;
    this.key = crypto.scryptSync(config.security.encryptionKey, 'salt', 32);
    this.ivLength = 16;
  }

  /**
   * Criptografa um texto
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error(`Erro ao criptografar: ${error}`);
    }
  }

  /**
   * Descriptografa um texto
   */
  decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Erro ao descriptografar: ${error}`);
    }
  }

  /**
   * Criptografa um objeto
   */
  encryptObject(obj: any): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Descriptografa um objeto
   */
  decryptObject(encryptedText: string): any {
    const decrypted = this.decrypt(encryptedText);
    return JSON.parse(decrypted);
  }

  /**
   * Gera um hash seguro
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Gera um token seguro
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verifica se um texto está criptografado
   */
  isEncrypted(text: string): boolean {
    return text.includes(':') && text.split(':').length === 2;
  }
}

// Instância singleton
export const encryptionService = new EncryptionService();

// Funções utilitárias
export const encrypt = (text: string): string => encryptionService.encrypt(text);
export const decrypt = (text: string): string => encryptionService.decrypt(text);
export const encryptObject = (obj: any): string => encryptionService.encryptObject(obj);
export const decryptObject = (text: string): any => encryptionService.decryptObject(text);
export const hash = (text: string): string => encryptionService.hash(text);
export const generateToken = (length?: number): string => encryptionService.generateToken(length);
export const isEncrypted = (text: string): boolean => encryptionService.isEncrypted(text);

