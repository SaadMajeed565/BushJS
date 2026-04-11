"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoring = exports.MonitoringService = void 0;
const ExceptionHandler_1 = require("./ExceptionHandler");
class MonitoringService {
    constructor() {
        this.metrics = [];
        this.systemMetrics = [];
        this.alerts = [];
        this.maxMetricsHistory = 10000; // Keep last 10k requests
        this.maxSystemMetricsHistory = 1000; // Keep last 1k system metrics
        this.highMemoryThreshold = 90; // % of heap used before starting to evaluate alerts
        this.criticalMemoryThreshold = 97; // % of heap used for critical sustained alerts
        this.criticalHeapUsedBytes = 512 * 1024 * 1024; // minimum bytes before critical escalation
        this.sustainedMemorySamples = 4; // consecutive samples to confirm sustained high usage
        this.sustainedCriticalSamples = 2; // fewer samples for critical conditions
        this.memoryGrowthWindow = 10; // number of samples to compare for growth detection (~5 minutes)
        this.memoryGrowthPercentThreshold = 10; // percent heap growth over the window to alert
        this.memoryWarmupMs = 120000; // suppress normal startup memory growth for 2 minutes
        this.alertCooldownMs = 300000; // 5-minute cooldown between repeated alerts of the same type
        this.lastAlertTimes = new Map();
        this.startSystemMetricsCollection();
    }
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    // Request metrics
    recordRequest(req, res, responseTime, userId) {
        const metrics = {
            timestamp: new Date(),
            responseTime,
            statusCode: res.statusCode,
            method: req.method,
            path: req.path,
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent'),
            userId
        };
        this.metrics.push(metrics);
        // Keep only recent metrics
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics = this.metrics.slice(-this.maxMetricsHistory);
        }
        // Check for performance issues
        this.checkPerformanceAlerts(metrics);
    }
    // System metrics collection
    startSystemMetricsCollection() {
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000); // Every 30 seconds
    }
    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const metrics = {
            timestamp: new Date(),
            cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
            memoryUsage: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss
            },
            uptime: process.uptime(),
            activeConnections: 0, // Would need to be set by the server
            requestRate: this.calculateRequestRate()
        };
        this.systemMetrics.push(metrics);
        if (this.systemMetrics.length > this.maxSystemMetricsHistory) {
            this.systemMetrics = this.systemMetrics.slice(-this.maxSystemMetricsHistory);
        }
        // Check system health
        this.checkSystemAlerts(metrics);
    }
    calculateRequestRate() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentRequests = this.metrics.filter(m => m.timestamp.getTime() > oneMinuteAgo);
        return recentRequests.length;
    }
    // Alert checking
    checkPerformanceAlerts(metrics) {
        if (metrics.responseTime > 5000) { // 5 seconds
            this.createAlert('high_response_time', 'High response time detected', {
                responseTime: metrics.responseTime,
                path: metrics.path,
                method: metrics.method
            }, 'warning');
        }
        if (metrics.statusCode >= 500) {
            this.createAlert('server_error', 'Server error occurred', {
                statusCode: metrics.statusCode,
                path: metrics.path,
                method: metrics.method
            }, 'error');
        }
    }
    checkSystemAlerts(metrics) {
        const heapUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
        const now = Date.now();
        const suppressMemory = this.shouldSuppressWarmupAlert(metrics, heapUsagePercent);
        if (!suppressMemory && this.shouldAlertHighMemory(metrics, heapUsagePercent) && !this.isAlertThrottled('high_memory_usage', now)) {
            this.createAlert('high_memory_usage', 'High memory usage detected', {
                heapUsagePercent,
                heapUsed: metrics.memoryUsage.heapUsed,
                heapTotal: metrics.memoryUsage.heapTotal,
                rss: metrics.memoryUsage.rss
            }, 'warning');
            this.lastAlertTimes.set('high_memory_usage', now);
        }
        if (metrics.cpuUsage > 80 && !this.isAlertThrottled('high_cpu_usage', now)) { // CPU usage > 80%
            this.createAlert('high_cpu_usage', 'High CPU usage detected', {
                cpuUsage: metrics.cpuUsage
            }, 'warning');
            this.lastAlertTimes.set('high_cpu_usage', now);
        }
    }
    shouldSuppressWarmupAlert(metrics, heapUsagePercent) {
        return metrics.uptime * 1000 < this.memoryWarmupMs && heapUsagePercent < this.criticalMemoryThreshold;
    }
    shouldAlertHighMemory(metrics, heapUsagePercent) {
        const isAboveHigh = heapUsagePercent > this.highMemoryThreshold;
        const isAboveCritical = heapUsagePercent >= this.criticalMemoryThreshold && metrics.memoryUsage.heapUsed >= this.criticalHeapUsedBytes;
        if (isAboveCritical && this.hasSustainedHighHeapUsage(this.sustainedCriticalSamples)) {
            return true;
        }
        if (isAboveHigh && this.hasSustainedHighHeapUsage()) {
            return true;
        }
        if (this.hasRapidHeapGrowth(metrics)) {
            return true;
        }
        return false;
    }
    hasSustainedHighHeapUsage(samples = this.sustainedMemorySamples) {
        const recentMetrics = this.systemMetrics.slice(-samples);
        if (recentMetrics.length < samples) {
            return false;
        }
        return recentMetrics.every(metric => {
            const percent = (metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal) * 100;
            return percent > this.highMemoryThreshold;
        });
    }
    hasRapidHeapGrowth(metrics) {
        const history = this.systemMetrics.slice(-this.memoryGrowthWindow);
        if (history.length < this.memoryGrowthWindow) {
            return false;
        }
        const oldest = history[0];
        if (oldest.memoryUsage.heapUsed === 0) {
            return false;
        }
        const growthPercent = ((metrics.memoryUsage.heapUsed - oldest.memoryUsage.heapUsed) / oldest.memoryUsage.heapUsed) * 100;
        return growthPercent >= this.memoryGrowthPercentThreshold;
    }
    isAlertThrottled(type, now) {
        const lastAlert = this.lastAlertTimes.get(type);
        return lastAlert !== undefined && now - lastAlert < this.alertCooldownMs;
    }
    createAlert(type, message, data, severity) {
        const alert = {
            id: this.generateAlertId(),
            type,
            message,
            data,
            severity,
            timestamp: new Date(),
            acknowledged: false
        };
        this.alerts.push(alert);
        // Keep only recent alerts (last 100)
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
        // Log alert
        ExceptionHandler_1.logger[severity](`[ALERT] ${message}`, data);
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Public API methods
    getMetrics(timeRange) {
        let filtered = this.metrics;
        if (timeRange) {
            filtered = this.metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
        }
        return filtered;
    }
    getSystemMetrics() {
        return this.systemMetrics;
    }
    getAlerts(acknowledged = false) {
        return this.alerts.filter(alert => alert.acknowledged === acknowledged);
    }
    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }
    getHealthStatus() {
        const latestSystem = this.systemMetrics[this.systemMetrics.length - 1];
        const activeAlerts = this.alerts.filter(a => !a.acknowledged).length;
        let status = 'healthy';
        if (activeAlerts > 0) {
            status = 'warning';
        }
        if (latestSystem) {
            const heapUsagePercent = (latestSystem.memoryUsage.heapUsed / latestSystem.memoryUsage.heapTotal) * 100;
            if (heapUsagePercent > 95 || latestSystem.cpuUsage > 90) {
                status = 'critical';
            }
        }
        return {
            status,
            uptime: process.uptime(),
            memoryUsage: latestSystem ? (latestSystem.memoryUsage.heapUsed / latestSystem.memoryUsage.heapTotal) * 100 : 0,
            cpuUsage: latestSystem ? latestSystem.cpuUsage : 0,
            activeAlerts,
            lastCheck: new Date()
        };
    }
    // Performance analytics
    getPerformanceStats() {
        if (this.metrics.length === 0) {
            return {
                avgResponseTime: 0,
                p95ResponseTime: 0,
                errorRate: 0,
                requestRate: 0,
                topEndpoints: []
            };
        }
        const responseTimes = this.metrics.map(m => m.responseTime).sort((a, b) => a - b);
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
        const errors = this.metrics.filter(m => m.statusCode >= 400).length;
        const errorRate = (errors / this.metrics.length) * 100;
        const requestRate = this.calculateRequestRate();
        // Top endpoints
        const endpointStats = new Map();
        this.metrics.forEach(m => {
            const key = `${m.method} ${m.path}`;
            const existing = endpointStats.get(key) || { count: 0, totalTime: 0 };
            endpointStats.set(key, {
                count: existing.count + 1,
                totalTime: existing.totalTime + m.responseTime
            });
        });
        const topEndpoints = Array.from(endpointStats.entries())
            .map(([path, stats]) => ({
            path,
            count: stats.count,
            avgTime: stats.totalTime / stats.count
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            avgResponseTime,
            p95ResponseTime,
            errorRate,
            requestRate,
            topEndpoints
        };
    }
}
exports.MonitoringService = MonitoringService;
// Export singleton instance
exports.monitoring = MonitoringService.getInstance();
//# sourceMappingURL=MonitoringService.js.map