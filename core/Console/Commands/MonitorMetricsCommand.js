"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorMetricsCommand = void 0;
const Command_1 = require("../Command");
const MonitoringService_1 = require("../../Foundation/MonitoringService");
class MonitorMetricsCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'monitor:metrics';
        this.description = 'Show performance metrics as JSON.';
        this.app = app;
    }
    async handle() {
        const stats = MonitoringService_1.monitoring.getPerformanceStats();
        console.log(JSON.stringify(stats, null, 2));
    }
}
exports.MonitorMetricsCommand = MonitorMetricsCommand;
//# sourceMappingURL=MonitorMetricsCommand.js.map