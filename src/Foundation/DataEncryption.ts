import crypto from 'crypto';
import { config } from '../Config/Config';
import { logger } from './ExceptionHandler';

export class DataEncryption {
  private static instance: DataEncryption;
  private algorithm: string;
  private key: Buffer;
  private ivLength: number;

  private constructor() {
    this.algorithm = 'aes-256-cbc';
    this.ivLength = 16; // 128 bits

    // Get encryption key from config or generate one
    const keyString = config.encryption?.key || process.env.ENCRYPTION_KEY;
    if (!keyString) {
      logger.warning('No encryption key provided, generating temporary key. Set ENCRYPTION_KEY in environment variables for production.');
      this.key = crypto.randomBytes(32); // 256 bits
    } else {
      // Derive key from string using PBKDF2
      this.key = crypto.pbkdf2Sync(keyString, 'salt', 100000, 32, 'sha256');
    }
  }

  static getInstance(): DataEncryption {
    if (!DataEncryption.instance) {
      DataEncryption.instance = new DataEncryption();
    }
    return DataEncryption.instance;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Return format: iv:encryptedData
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Encryption failed', { error: (error as Error).message });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: (error as Error).message });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way encryption)
   */
  hash(text: string, saltRounds: number = 12): string {
    try {
      return crypto.createHash('sha256').update(text).digest('hex');
    } catch (error) {
      logger.error('Hashing failed', { error: (error as Error).message });
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt object fields
   */
  encryptObjectFields(obj: any, fieldsToEncrypt: string[]): any {
    const encrypted = { ...obj };

    fieldsToEncrypt.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
        encrypted[field + '_encrypted'] = true; // Mark as encrypted
      }
    });

    return encrypted;
  }

  /**
   * Decrypt object fields
   */
  decryptObjectFields(obj: any, fieldsToDecrypt: string[]): any {
    const decrypted = { ...obj };

    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] && decrypted[field + '_encrypted']) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
          delete decrypted[field + '_encrypted'];
        } catch (error) {
          logger.error(`Failed to decrypt field ${field}`, { error: (error as Error).message });
          // Keep encrypted value if decryption fails
        }
      }
    });

    return decrypted;
  }
}

// Export singleton instance
export const dataEncryption = DataEncryption.getInstance();

// Utility functions for common use cases
export function encryptEmail(email: string): string {
  return dataEncryption.encrypt(email);
}

export function decryptEmail(encryptedEmail: string): string {
  return dataEncryption.decrypt(encryptedEmail);
}

export function encryptPhone(phone: string): string {
  return dataEncryption.encrypt(phone);
}

export function decryptPhone(encryptedPhone: string): string {
  return dataEncryption.decrypt(encryptedPhone);
}

export function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcrypt');
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcrypt');
  return bcrypt.compare(password, hash);
}