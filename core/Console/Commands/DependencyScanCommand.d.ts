#!/usr/bin/env node
export interface VulnerabilityReport {
    timestamp: Date;
    totalVulnerabilities: number;
    highSeverity: number;
    moderateSeverity: number;
    lowSeverity: number;
    criticalSeverity: number;
    vulnerabilities: Array<{
        package: string;
        severity: string;
        title: string;
        url?: string;
        recommendation?: string;
    }>;
    scanDuration: number;
}
export declare class DependencyScanner {
    private static instance;
    private constructor();
    static getInstance(): DependencyScanner;
    /**
     * Run npm audit to check for vulnerabilities
     */
    scanDependencies(): Promise<VulnerabilityReport>;
    /**
     * Parse npm audit JSON output
     */
    private parseAuditResults;
    /**
     * Get recommendation for vulnerability
     */
    private getRecommendation;
    /**
     * Log scan results
     */
    private logScanResults;
    /**
     * Save report to file
     */
    private saveReport;
    /**
     * Get latest report
     */
    getLatestReport(): VulnerabilityReport | null;
    /**
     * Check if there are critical vulnerabilities
     */
    hasCriticalVulnerabilities(): boolean;
    /**
     * Auto-fix vulnerabilities
     */
    autoFixVulnerabilities(): Promise<{
        success: boolean;
        fixed: number;
        errors: string[];
    }>;
}
export declare const dependencyScanner: DependencyScanner;
//# sourceMappingURL=DependencyScanCommand.d.ts.map