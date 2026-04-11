export declare enum AuditEventType {
    AUTH_SUCCESS = "auth_success",
    AUTH_FAILURE = "auth_failure",
    AUTH_LOGOUT = "auth_logout",
    PASSWORD_CHANGE = "password_change",
    PASSWORD_RESET = "password_reset",
    USER_CREATED = "user_created",
    USER_UPDATED = "user_updated",
    USER_DELETED = "user_deleted",
    ADMIN_ACTION = "admin_action",
    FILE_UPLOAD = "file_upload",
    FILE_DELETE = "file_delete",
    SUSPICIOUS_ACTIVITY = "suspicious_activity",
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
    CSRF_VIOLATION = "csrf_violation",
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt",
    XSS_ATTEMPT = "xss_attempt"
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
export declare class AuditLogger {
    private static instance;
    private get logDirectory();
    private constructor();
    static getInstance(): AuditLogger;
    private ensureLogDirectory;
    log(event: Omit<AuditEvent, 'timestamp'>): void;
    private logToFile;
    private logToConsole;
    private getLogLevel;
    logAuthSuccess(userId: string, username: string, ip: string, userAgent?: string): void;
    logAuthFailure(username: string, ip: string, reason: string, userAgent?: string): void;
    logAuthLogout(userId: string, username: string, ip: string): void;
    logPasswordChange(userId: string, username: string, ip: string): void;
    logUserCreated(userId: string, username: string, ip: string, createdBy?: string): void;
    logUserDeleted(userId: string, username: string, ip: string, deletedBy: string): void;
    logAdminAction(userId: string, username: string, ip: string, action: string, resource: string): void;
    logSuspiciousActivity(ip: string, activity: string, details?: Record<string, any>): void;
    logRateLimitExceeded(ip: string, endpoint: string): void;
    logCsrfViolation(ip: string, userAgent?: string): void;
    logFileUpload(userId: string, filename: string, ip: string): void;
    searchLogs(criteria: {
        type?: AuditEventType;
        userId?: string;
        ip?: string;
        startDate?: Date;
        endDate?: Date;
        severity?: string;
    }): AuditEvent[];
}
export declare const auditLogger: AuditLogger;
//# sourceMappingURL=AuditLogger.d.ts.map