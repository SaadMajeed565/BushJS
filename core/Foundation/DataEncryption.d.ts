export declare class DataEncryption {
    private static instance;
    private algorithm;
    private key;
    private ivLength;
    private constructor();
    static getInstance(): DataEncryption;
    /**
     * Encrypt sensitive data
     */
    encrypt(text: string): string;
    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedText: string): string;
    /**
     * Hash sensitive data (one-way encryption)
     */
    hash(text: string, saltRounds?: number): string;
    /**
     * Generate a secure random token
     */
    generateToken(length?: number): string;
    /**
     * Encrypt object fields
     */
    encryptObjectFields(obj: any, fieldsToEncrypt: string[]): any;
    /**
     * Decrypt object fields
     */
    decryptObjectFields(obj: any, fieldsToDecrypt: string[]): any;
}
export declare const dataEncryption: DataEncryption;
export declare function encryptEmail(email: string): string;
export declare function decryptEmail(encryptedEmail: string): string;
export declare function encryptPhone(phone: string): string;
export declare function decryptPhone(encryptedPhone: string): string;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
//# sourceMappingURL=DataEncryption.d.ts.map