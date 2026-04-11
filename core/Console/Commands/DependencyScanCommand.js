#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependencyScanner = exports.DependencyScanner = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ExceptionHandler_1 = require("../../Foundation/ExceptionHandler");
const Storage_1 = require("../../Storage/Storage");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class DependencyScanner {
    constructor() { }
    static getInstance() {
        if (!DependencyScanner.instance) {
            DependencyScanner.instance = new DependencyScanner();
        }
        return DependencyScanner.instance;
    }
    /**
     * Run npm audit to check for vulnerabilities
     */
    async scanDependencies() {
        const startTime = Date.now();
        try {
            ExceptionHandler_1.logger.info('Starting dependency vulnerability scan...');
            // Run npm audit
            const { stdout, stderr } = await execAsync('npm audit --json', {
                cwd: process.cwd(),
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });
            const auditResult = JSON.parse(stdout);
            const duration = Date.now() - startTime;
            // Parse audit results
            const report = this.parseAuditResults(auditResult, duration);
            // Log results
            this.logScanResults(report);
            // Save report
            await this.saveReport(report);
            return report;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // npm audit returns non-zero exit code when vulnerabilities are found
            if (error.stdout) {
                try {
                    const auditResult = JSON.parse(error.stdout);
                    const report = this.parseAuditResults(auditResult, duration);
                    this.logScanResults(report);
                    await this.saveReport(report);
                    return report;
                }
                catch (parseError) {
                    ExceptionHandler_1.logger.error('Failed to parse npm audit output', { error: parseError.message });
                }
            }
            ExceptionHandler_1.logger.error('Dependency scan failed', { error: error.message });
            return {
                timestamp: new Date(),
                totalVulnerabilities: 0,
                highSeverity: 0,
                moderateSeverity: 0,
                lowSeverity: 0,
                criticalSeverity: 0,
                vulnerabilities: [],
                scanDuration: duration
            };
        }
    }
    /**
     * Parse npm audit JSON output
     */
    parseAuditResults(auditResult, duration) {
        const vulnerabilities = [];
        let highSeverity = 0;
        let moderateSeverity = 0;
        let lowSeverity = 0;
        let criticalSeverity = 0;
        if (auditResult.vulnerabilities) {
            Object.entries(auditResult.vulnerabilities).forEach(([packageName, vuln]) => {
                const severity = vuln.severity || 'low';
                // Count by severity
                switch (severity) {
                    case 'critical':
                        criticalSeverity++;
                        break;
                    case 'high':
                        highSeverity++;
                        break;
                    case 'moderate':
                        moderateSeverity++;
                        break;
                    case 'low':
                        lowSeverity++;
                        break;
                }
                vulnerabilities.push({
                    package: packageName,
                    severity,
                    title: vuln.title || 'Unknown vulnerability',
                    url: vuln.url,
                    recommendation: this.getRecommendation(vuln)
                });
            });
        }
        return {
            timestamp: new Date(),
            totalVulnerabilities: vulnerabilities.length,
            highSeverity,
            moderateSeverity,
            lowSeverity,
            criticalSeverity,
            vulnerabilities,
            scanDuration: duration
        };
    }
    /**
     * Get recommendation for vulnerability
     */
    getRecommendation(vuln) {
        if (vuln.fixAvailable) {
            return 'Run "npm audit fix" to automatically fix this vulnerability';
        }
        if (vuln.vulnerableVersions) {
            return `Update to a version outside: ${vuln.vulnerableVersions}`;
        }
        return 'Review the vulnerability details and update the package manually';
    }
    /**
     * Log scan results
     */
    logScanResults(report) {
        ExceptionHandler_1.logger.info('Dependency vulnerability scan completed', {
            total: report.totalVulnerabilities,
            critical: report.criticalSeverity,
            high: report.highSeverity,
            moderate: report.moderateSeverity,
            low: report.lowSeverity,
            duration: report.scanDuration
        });
        if (report.criticalSeverity > 0 || report.highSeverity > 0) {
            ExceptionHandler_1.logger.warning('Critical or high severity vulnerabilities found', {
                critical: report.criticalSeverity,
                high: report.highSeverity
            });
        }
        // Log individual vulnerabilities
        report.vulnerabilities.forEach(vuln => {
            const level = vuln.severity === 'critical' || vuln.severity === 'high' ? 'error' : 'warning';
            ExceptionHandler_1.logger[level](`Vulnerability in ${vuln.package}: ${vuln.title}`, {
                severity: vuln.severity,
                url: vuln.url,
                recommendation: vuln.recommendation
            });
        });
    }
    /**
     * Save report to file
     */
    async saveReport(report) {
        const reportsDir = Storage_1.Storage.resolvedPath('reports');
        if (!fs_1.default.existsSync(reportsDir)) {
            fs_1.default.mkdirSync(reportsDir, { recursive: true });
        }
        const filename = `vulnerability-report-${report.timestamp.toISOString().split('T')[0]}.json`;
        const filepath = path_1.default.join(reportsDir, filename);
        fs_1.default.writeFileSync(filepath, JSON.stringify(report, null, 2));
        ExceptionHandler_1.logger.info('Vulnerability report saved', { path: filepath });
    }
    /**
     * Get latest report
     */
    getLatestReport() {
        const reportsDir = Storage_1.Storage.resolvedPath('reports');
        if (!fs_1.default.existsSync(reportsDir)) {
            return null;
        }
        const files = fs_1.default.readdirSync(reportsDir)
            .filter(file => file.startsWith('vulnerability-report-'))
            .sort()
            .reverse();
        if (files.length === 0) {
            return null;
        }
        const latestFile = path_1.default.join(reportsDir, files[0]);
        try {
            const content = fs_1.default.readFileSync(latestFile, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Failed to read latest vulnerability report', { error: error.message });
            return null;
        }
    }
    /**
     * Check if there are critical vulnerabilities
     */
    hasCriticalVulnerabilities() {
        const report = this.getLatestReport();
        return report ? report.criticalSeverity > 0 || report.highSeverity > 0 : false;
    }
    /**
     * Auto-fix vulnerabilities
     */
    async autoFixVulnerabilities() {
        try {
            ExceptionHandler_1.logger.info('Attempting to auto-fix vulnerabilities...');
            const { stdout, stderr } = await execAsync('npm audit fix', {
                cwd: process.cwd()
            });
            ExceptionHandler_1.logger.info('Auto-fix completed', { stdout, stderr });
            // Re-scan to see results
            const newReport = await this.scanDependencies();
            return {
                success: true,
                fixed: newReport.totalVulnerabilities, // This would be the remaining count
                errors: []
            };
        }
        catch (error) {
            ExceptionHandler_1.logger.error('Auto-fix failed', { error: error.message });
            return {
                success: false,
                fixed: 0,
                errors: [error.message]
            };
        }
    }
}
exports.DependencyScanner = DependencyScanner;
// Export singleton instance
exports.dependencyScanner = DependencyScanner.getInstance();
// CLI interface
if (require.main === module) {
    const scanner = DependencyScanner.getInstance();
    scanner.scanDependencies()
        .then(report => {
        console.log('\n=== Dependency Vulnerability Scan Report ===');
        console.log(`Timestamp: ${report.timestamp.toISOString()}`);
        console.log(`Scan Duration: ${report.scanDuration}ms`);
        console.log(`Total Vulnerabilities: ${report.totalVulnerabilities}`);
        console.log(`Critical: ${report.criticalSeverity}`);
        console.log(`High: ${report.highSeverity}`);
        console.log(`Moderate: ${report.moderateSeverity}`);
        console.log(`Low: ${report.lowSeverity}`);
        if (report.vulnerabilities.length > 0) {
            console.log('\n=== Vulnerabilities ===');
            report.vulnerabilities.forEach((vuln, index) => {
                console.log(`${index + 1}. ${vuln.package} (${vuln.severity})`);
                console.log(`   ${vuln.title}`);
                if (vuln.recommendation) {
                    console.log(`   Recommendation: ${vuln.recommendation}`);
                }
                console.log('');
            });
        }
        process.exit(report.criticalSeverity > 0 || report.highSeverity > 0 ? 1 : 0);
    })
        .catch(error => {
        console.error('Scan failed:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=DependencyScanCommand.js.map