export { Application } from './Foundation/Application';
export { Request } from './Http/Request';
export { Response } from './Http/Response';
export { Controller } from './Http/Controller';
export { Middleware } from './Http/Middleware/Middleware';
export { Model, HasManyRelation, BelongsToRelation } from './Database/Model';
export { connection } from './Database/Connection';
export { Router } from './Http/Router';
export { HttpKernel } from './Http/Kernel';
export { ConsoleKernel } from './Console/Kernel';
export { ValidatorV2, Validator, ValidationException, rules } from './Validation/Validator';
export { BaseSchema, SchemaRunner, SchemaBuilder } from './Database/Schema';
export { auth, Auth, SessionGuard, type Guard } from './Auth/Auth';
export { AuthMiddleware, GuestMiddleware } from './Http/Middleware/AuthMiddleware';
export { CsrfMiddleware } from './Http/Middleware/CsrfMiddleware';
export { RateLimitMiddleware, authLimiter, apiLimiter } from './Http/Middleware/RateLimitMiddleware';
export { Logger, LogLevel, ExceptionHandler, logger, exceptionHandler } from './Foundation/ExceptionHandler';
export { config } from './Config/Config';
export { GracefulShutdown, setupGracefulShutdown } from './Foundation/GracefulShutdown';

// New Security & Advanced Features
export { SecureFileUpload, imageUpload, documentUpload, avatarUpload, cleanupUploadedFiles } from './Http/Middleware/SecureFileUpload';
export { AuditLogger, AuditEventType, auditLogger } from './Foundation/AuditLogger';
export { DataEncryption, dataEncryption, encryptEmail, decryptEmail, encryptPhone, decryptPhone, hashPassword, verifyPassword } from './Foundation/DataEncryption';
export { MonitoringService, monitoring } from './Foundation/MonitoringService';
export { BackupService, backupService } from './Foundation/BackupService';
export { APIVersioning, apiVersioning, v1Route, v2Route, requireVersion, deprecateVersion } from './Http/APIVersioning';
export { DependencyScanner, dependencyScanner } from './Console/Commands/DependencyScanCommand';