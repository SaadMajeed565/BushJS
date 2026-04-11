import { Request, Response } from 'express';
export interface MetricsData {
    timestamp: Date;
    responseTime: number;
    statusCode: number;
    method: string;
    path: string;
    ip: string;
    userAgent?: string;
    userId?: string;
}
export interface SystemMetrics {
    timestamp: Date;
    cpuUsage: number;
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    uptime: number;
    activeConnections: number;
    requestRate: number;
}
export declare class MonitoringService {
    private static instance;
    private metrics;
    private systemMetrics;
    private alerts;
    private maxMetricsHistory;
    private maxSystemMetricsHistory;
    private highMemoryThreshold;
    private criticalMemoryThreshold;
    private criticalHeapUsedBytes;
    private sustainedMemorySamples;
    private sustainedCriticalSamples;
    private memoryGrowthWindow;
    private memoryGrowthPercentThreshold;
    private memoryWarmupMs;
    private alertCooldownMs;
    private lastAlertTimes;
    private constructor();
    static getInstance(): MonitoringService;
    recordRequest(req: Request, res: Response, responseTime: number, userId?: string): void;
    private startSystemMetricsCollection;
    private collectSystemMetrics;
    private calculateRequestRate;
    private checkPerformanceAlerts;
    private checkSystemAlerts;
    private shouldSuppressWarmupAlert;
    private shouldAlertHighMemory;
    private hasSustainedHighHeapUsage;
    private hasRapidHeapGrowth;
    private isAlertThrottled;
    private createAlert;
    private generateAlertId;
    getMetrics(timeRange?: {
        start: Date;
        end: Date;
    }): MetricsData[];
    getSystemMetrics(): SystemMetrics[];
    getAlerts(acknowledged?: boolean): Alert[];
    acknowledgeAlert(alertId: string): boolean;
    getHealthStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        uptime: number;
        memoryUsage: number;
        cpuUsage: number;
        activeAlerts: number;
        lastCheck: Date;
    };
    getPerformanceStats(): {
        avgResponseTime: number;
        p95ResponseTime: number;
        errorRate: number;
        requestRate: number;
        topEndpoints: Array<{
            path: string;
            count: number;
            avgTime: number;
        }>;
    };
}
interface Alert {
    id: string;
    type: string;
    message: string;
    data: any;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
    acknowledged: boolean;
}
export declare const monitoring: MonitoringService;
export {};
//# sourceMappingURL=MonitoringService.d.ts.map