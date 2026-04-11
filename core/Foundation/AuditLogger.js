"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = exports.AuditEventType = void 0;
const ExceptionHandler_1 = require("../Foundation/ExceptionHandler");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Storage_1 = require("../Storage/Storage");
var AuditEventType;
(function (AuditEventType) {
    AuditEventType["AUTH_SUCCESS"] = "auth_success";
    AuditEventType["AUTH_FAILURE"] = "auth_failure";
    AuditEventType["AUTH_LOGOUT"] = "auth_logout";
    AuditEventType["PASSWORD_CHANGE"] = "password_change";
    AuditEventType["PASSWORD_RESET"] = "password_reset";
    AuditEventType["USER_CREATED"] = "user_created";
    AuditEventType["USER_UPDATED"] = "user_updated";
    AuditEventType["USER_DELETED"] = "user_deleted";
    AuditEventType["ADMIN_ACTION"] = "admin_action";
    AuditEventType["FILE_UPLOAD"] = "file_upload";
    AuditEventType["FILE_DELETE"] = "file_delete";
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
    AuditEventType["RATE_LIMIT_EXCEEDED"] = "rate_limit_exceeded";
    AuditEventType["CSRF_VIOLATION"] = "csrf_violation";
    AuditEventType["SQL_INJECTION_ATTEMPT"] = "sql_injection_attempt";
    AuditEventType["XSS_ATTEMPT"] = "xss_attempt";
})(AuditEventType || (exports.AuditEventType = AuditEventType = {}));
class AuditLogger {
    get logDirectory() {
        return Storage_1.Storage.resolvedPath('logs', 'audit');
    }
    constructor() {
        this.ensureLogDirectory();
    }
    static getInstance() {
        if (!AuditLogger.instance) {
            AuditLogger.instance = new AuditLogger();
        }
        return AuditLogger.instance;
    }
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDirectory)) {
            fs_1.default.mkdirSync(this.logDirectory, { recursive: true });
        }
    }
    log(event) {
        const auditEvent = {
            ...event,
            timestamp: new Date()
        };
        // Log to file
        this.logToFile(auditEvent);
        // Log to console with appropriate level
        this.logToConsole(auditEvent);
        // For critical events, also log as error
        if (event.severity === 'critical') {
            ExceptionHandler_1.logger.critical(`Security Event: ${event.type}`, {
                userId: event.userId,
                ip: event.ip,
                details: event.details
            });
        }
    }
    logToFile(event) {
        const date = event.timestamp.toISOString().split('T')[0];
        const logFile = path_1.default.join(this.logDirectory, `audit-${date}.log`);
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
        fs_1.default.appendFileSync(logFile, logEntry);
    }
    logToConsole(event) {
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
                ExceptionHandler_1.logger.error(message, context);
                break;
            case 'warning':
                ExceptionHandler_1.logger.warning(message, context);
                break;
            case 'info':
            default:
                ExceptionHandler_1.logger.info(message, context);
                break;
        }
    }
    getLogLevel(severity) {
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
    logAuthSuccess(userId, username, ip, userAgent) {
        this.log({
            type: AuditEventType.AUTH_SUCCESS,
            userId,
            username,
            ip,
            userAgent,
            severity: 'low'
        });
    }
    logAuthFailure(username, ip, reason, userAgent) {
        this.log({
            type: AuditEventType.AUTH_FAILURE,
            username,
            ip,
            userAgent,
            details: { reason },
            severity: 'medium'
        });
    }
    logAuthLogout(userId, username, ip) {
        this.log({
            type: AuditEventType.AUTH_LOGOUT,
            userId,
            username,
            ip,
            severity: 'low'
        });
    }
    logPasswordChange(userId, username, ip) {
        this.log({
            type: AuditEventType.PASSWORD_CHANGE,
            userId,
            username,
            ip,
            severity: 'medium'
        });
    }
    logUserCreated(userId, username, ip, createdBy) {
        this.log({
            type: AuditEventType.USER_CREATED,
            userId,
            username,
            ip,
            details: { createdBy },
            severity: 'low'
        });
    }
    logUserDeleted(userId, username, ip, deletedBy) {
        this.log({
            type: AuditEventType.USER_DELETED,
            userId,
            username,
            ip,
            details: { deletedBy },
            severity: 'high'
        });
    }
    logAdminAction(userId, username, ip, action, resource) {
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
    logSuspiciousActivity(ip, activity, details) {
        this.log({
            type: AuditEventType.SUSPICIOUS_ACTIVITY,
            ip,
            details: { activity, ...details },
            severity: 'high'
        });
    }
    logRateLimitExceeded(ip, endpoint) {
        this.log({
            type: AuditEventType.RATE_LIMIT_EXCEEDED,
            ip,
            resource: endpoint,
            severity: 'medium'
        });
    }
    logCsrfViolation(ip, userAgent) {
        this.log({
            type: AuditEventType.CSRF_VIOLATION,
            ip,
            userAgent,
            severity: 'high'
        });
    }
    logFileUpload(userId, filename, ip) {
        this.log({
            type: AuditEventType.FILE_UPLOAD,
            userId,
            ip,
            resource: filename,
            severity: 'low'
        });
    }
    // Search audit logs
    searchLogs(criteria) {
        const files = fs_1.default.readdirSync(this.logDirectory)
            .filter(file => file.startsWith('audit-'))
            .sort()
            .reverse(); // Most recent first
        const results = [];
        for (const file of files) {
            const filePath = path_1.default.join(this.logDirectory, file);
            const content = fs_1.default.readFileSync(filePath, 'utf-8');
            const lines = content.trim().split('\n');
            for (const line of lines) {
                try {
                    const event = JSON.parse(line);
                    // Apply filters
                    if (criteria.type && event.type !== criteria.type)
                        continue;
                    if (criteria.userId && event.userId !== criteria.userId)
                        continue;
                    if (criteria.ip && event.ip !== criteria.ip)
                        continue;
                    if (criteria.severity && event.severity !== criteria.severity)
                        continue;
                    if (criteria.startDate && event.timestamp < criteria.startDate)
                        continue;
                    if (criteria.endDate && event.timestamp > criteria.endDate)
                        continue;
                    results.push(event);
                }
                catch (error) {
                    // Skip malformed lines
                    continue;
                }
            }
        }
        return results;
    }
}
exports.AuditLogger = AuditLogger;
// Export singleton instance
exports.auditLogger = AuditLogger.getInstance();
//# sourceMappingURL=AuditLogger.js.map