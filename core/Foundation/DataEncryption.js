"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataEncryption = exports.DataEncryption = void 0;
exports.encryptEmail = encryptEmail;
exports.decryptEmail = decryptEmail;
exports.encryptPhone = encryptPhone;
exports.decryptPhone = decryptPhone;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto_1 = __importDefault(require("crypto"));
const Config_1 = require("../Config/Config");
const ExceptionHandler_1 = require("./ExceptionHandler");
class DataEncryption {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        this.ivLength = 16; // 128 bits
        // Get encryption key from config or generate one
        const keyString = Config_1.config.encryption?.key || process.env.ENCRYPTION_KEY;
        if (!keyString) {
            ExceptionHandler_1.logger.warning('No encryption key provided, generating temporary key. Set ENCRYPTION_KEY in environment variables for production.');
            this.key = crypto_1.default.randomBytes(32); // 256 bits
        }
        else {
            // Derive key from string using PBKDF2
            this.key = crypto_1.default.pbkdf2Sync(keyString, 'salt', 100000, 32, 'sha256');
        }
    }
    static getInstance() {
        if (!DataEncryption.instance) {
            DataEncryption.instance = new DataEncryption();
        }
        return DataEncryption.instance;
    }
    /**
     * Encrypt sensitive data
     */
    encrypt(text) {
        try {
            const iv = crypto_1.default.randomBytes(this.ivLength);
            const cipher = crypto_1.default.createCipheriv(this.algorithm, this.key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            // Return format: iv:encryptedData
            return iv.toString('hex') + ':' + encrypted;
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Encryption failed', { error: error.message });
            throw new Error('Failed to encrypt data');
        }
    }
    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedText) {
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Decryption failed', { error: error.message });
            throw new Error('Failed to decrypt data');
        }
    }
    /**
     * Hash sensitive data (one-way encryption)
     */
    hash(text, saltRounds = 12) {
        try {
            return crypto_1.default.createHash('sha256').update(text).digest('hex');
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Hashing failed', { error: error.message });
            throw new Error('Failed to hash data');
        }
    }
    /**
     * Generate a secure random token
     */
    generateToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    /**
     * Encrypt object fields
     */
    encryptObjectFields(obj, fieldsToEncrypt) {
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
    decryptObjectFields(obj, fieldsToDecrypt) {
        const decrypted = { ...obj };
        fieldsToDecrypt.forEach(field => {
            if (decrypted[field] && decrypted[field + '_encrypted']) {
                try {
                    decrypted[field] = this.decrypt(decrypted[field]);
                    delete decrypted[field + '_encrypted'];
                }
                catch (error) {
                    ExceptionHandler_1.logger.error(`Failed to decrypt field ${field}`, { error: error.message });
                    // Keep encrypted value if decryption fails
                }
            }
        });
        return decrypted;
    }
}
exports.DataEncryption = DataEncryption;
// Export singleton instance
exports.dataEncryption = DataEncryption.getInstance();
// Utility functions for common use cases
function encryptEmail(email) {
    return exports.dataEncryption.encrypt(email);
}
function decryptEmail(encryptedEmail) {
    return exports.dataEncryption.decrypt(encryptedEmail);
}
function encryptPhone(phone) {
    return exports.dataEncryption.encrypt(phone);
}
function decryptPhone(encryptedPhone) {
    return exports.dataEncryption.decrypt(encryptedPhone);
}
function hashPassword(password) {
    // Use bcryptjs (pure JS) to avoid native build toolchains.
    const bcrypt = require('bcryptjs');
    return bcrypt.hash(password, 12);
}
function verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, hash);
}
//# sourceMappingURL=DataEncryption.js.map