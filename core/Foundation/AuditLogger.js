"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = exports.AuditEventType = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Storage_1 = require("../Storage/Storage");
const ExceptionHandler_1 = require("./ExceptionHandler");
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
    async ensureLogDirectory() {
        try {
            await promises_1.default.mkdir(this.logDirectory, { recursive: true });
        }
        catch {
            // directory may already exist
        }
    }
    log(event) {
        const auditEvent = {
            ...event,
            timestamp: new Date()
        };
        this.logToFile(auditEvent).catch((err) => process.stderr.write(`AUDIT LOG WRITE FAILED: ${err}\n`));
        this.logToConsole(auditEvent);
        if (event.severity === 'critical') {
            ExceptionHandler_1.logger.critical(`Security Event: ${event.type}`, {
                userId: event.userId,
                ip: event.ip,
                details: event.details
            });
        }
    }
    async logToFile(event) {
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
        await promises_1.default.appendFile(logFile, logEntry);
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
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
            default:
                return 'info';
        }
    }
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
    async searchLogs(criteria) {
        let files;
        try {
            files = await promises_1.default.readdir(this.logDirectory);
        }
        catch {
            return [];
        }
        const logFiles = files
            .filter(file => file.startsWith('audit-'))
            .sort()
            .reverse();
        const results = [];
        for (const file of logFiles) {
            const filePath = path_1.default.join(this.logDirectory, file);
            let content;
            try {
                content = await promises_1.default.readFile(filePath, 'utf-8');
            }
            catch {
                continue;
            }
            const lines = content.trim().split('\n');
            for (const line of lines) {
                try {
                    const event = JSON.parse(line);
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
                catch {
                    continue;
                }
            }
        }
        return results;
    }
}
exports.AuditLogger = AuditLogger;
exports.auditLogger = AuditLogger.getInstance();
//# sourceMappingURL=AuditLogger.js.map