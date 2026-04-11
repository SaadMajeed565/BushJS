import { logger } from '../Foundation/ExceptionHandler';
import fs from 'fs';
import path from 'path';
import { Storage } from '../Storage/Storage';

export enum AuditEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_LOGOUT = 'auth_logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  ADMIN_ACTION = 'admin_action',
  FILE_UPLOAD = 'file_upload',
  FILE_DELETE = 'file_delete',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CSRF_VIOLATION = 'csrf_violation',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt'
}

export interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  username?: string;
  ip: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AuditLogger {
  private static instance: AuditLogger;

  private get logDirectory(): string {
    return Storage.resolvedPath('logs', 'audit');
  }

  private constructor() {
    this.ensureLogDirectory();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  log(event: Omit<AuditEvent, 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date()
    };

    // Log to file
    this.logToFile(auditEvent);

    // Log to console with appropriate level
    this.logToConsole(auditEvent);

    // For critical events, also log as error
    if (event.severity === 'critical') {
      logger.critical(`Security Event: ${event.type}`, {
        userId: event.userId,
        ip: event.ip,
        details: event.details
      });
    }
  }

  private logToFile(event: AuditEvent): void {
    const date = event.timestamp.toISOString().split('T')[0];
    const logFile = path.join(this.logDirectory, `audit-${date}.log`);

    const logEntry = JSON.stringify({
      timestamp: event.timestamp.toISOString(),
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      username: event.username,
      ip: event.ip,
      userAgent: event.userAgent,
      resource: event.resource,
      action: event.action,
      details: event.details
    }) + '\n';

    fs.appendFileSync(logFile, logEntry);
  }

  private logToConsole(event: AuditEvent): void {
    const level = this.getLogLevel(event.severity);
    const message = `[AUDIT] ${event.type.toUpperCase()} - User: ${event.userId || 'unknown'} - IP: ${event.ip}`;

    const context = {
      type: event.type,
      userId: event.userId,
      username: event.username,
      ip: event.ip,
      resource: event.resource,
      action: event.action,
      details: event.details
    };

    switch (level) {
      case 'error':
        logger.error(message, context);
        break;
      case 'warning':
        logger.warning(message, context);
        break;
      case 'info':
      default:
        logger.info(message, context);
        break;
    }
  }

  private getLogLevel(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  }

  // Convenience methods for common events
  logAuthSuccess(userId: string, username: string, ip: string, userAgent?: string): void {
    this.log({
      type: AuditEventType.AUTH_SUCCESS,
      userId,
      username,
      ip,
      userAgent,
      severity: 'low'
    });
  }

  logAuthFailure(username: string, ip: string, reason: string, userAgent?: string): void {
    this.log({
      type: AuditEventType.AUTH_FAILURE,
      username,
      ip,
      userAgent,
      details: { reason },
      severity: 'medium'
    });
  }

  logAuthLogout(userId: string, username: string, ip: string): void {
    this.log({
      type: AuditEventType.AUTH_LOGOUT,
      userId,
      username,
      ip,
      severity: 'low'
    });
  }

  logPasswordChange(userId: string, username: string, ip: string): void {
    this.log({
      type: AuditEventType.PASSWORD_CHANGE,
      userId,
      username,
      ip,
      severity: 'medium'
    });
  }

  logUserCreated(userId: string, username: string, ip: string, createdBy?: string): void {
    this.log({
      type: AuditEventType.USER_CREATED,
      userId,
      username,
      ip,
      details: { createdBy },
      severity: 'low'
    });
  }

  logUserDeleted(userId: string, username: string, ip: string, deletedBy: string): void {
    this.log({
      type: AuditEventType.USER_DELETED,
      userId,
      username,
      ip,
      details: { deletedBy },
      severity: 'high'
    });
  }

  logAdminAction(userId: string, username: string, ip: string, action: string, resource: string): void {
    this.log({
      type: AuditEventType.ADMIN_ACTION,
      userId,
      username,
      ip,
      action,
      resource,
      severity: 'medium'
    });
  }

  logSuspiciousActivity(ip: string, activity: string, details?: Record<string, any>): void {
    this.log({
      type: AuditEventType.SUSPICIOUS_ACTIVITY,
      ip,
      details: { activity, ...details },
      severity: 'high'
    });
  }

  logRateLimitExceeded(ip: string, endpoint: string): void {
    this.log({
      type: AuditEventType.RATE_LIMIT_EXCEEDED,
      ip,
      resource: endpoint,
      severity: 'medium'
    });
  }

  logCsrfViolation(ip: string, userAgent?: string): void {
    this.log({
      type: AuditEventType.CSRF_VIOLATION,
      ip,
      userAgent,
      severity: 'high'
    });
  }

  logFileUpload(userId: string, filename: string, ip: string): void {
    this.log({
      type: AuditEventType.FILE_UPLOAD,
      userId,
      ip,
      resource: filename,
      severity: 'low'
    });
  }

  // Search audit logs
  searchLogs(criteria: {
    type?: AuditEventType;
    userId?: string;
    ip?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
  }): AuditEvent[] {
    const files = fs.readdirSync(this.logDirectory)
      .filter(file => file.startsWith('audit-'))
      .sort()
      .reverse(); // Most recent first

    const results: AuditEvent[] = [];

    for (const file of files) {
      const filePath = path.join(this.logDirectory, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        try {
          const event: AuditEvent = JSON.parse(line);

          // Apply filters
          if (criteria.type && event.type !== criteria.type) continue;
          if (criteria.userId && event.userId !== criteria.userId) continue;
          if (criteria.ip && event.ip !== criteria.ip) continue;
          if (criteria.severity && event.severity !== criteria.severity) continue;
          if (criteria.startDate && event.timestamp < criteria.startDate) continue;
          if (criteria.endDate && event.timestamp > criteria.endDate) continue;

          results.push(event);
        } catch (error) {
          // Skip malformed lines
          continue;
        }
      }
    }

    return results;
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();