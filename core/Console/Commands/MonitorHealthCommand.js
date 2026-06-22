"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorHealthCommand = void 0;
const Command_1 = require("../Command");
const MonitoringService_1 = require("../../Foundation/MonitoringService");
class MonitorHealthCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'monitor:health';
        this.description = 'Show current health status as JSON.';
        this.app = app;
    }
    async handle() {
        const health = MonitoringService_1.monitoring.getHealthStatus();
        console.log(JSON.stringify(health, null, 2));
    }
}
exports.MonitorHealthCommand = MonitorHealthCommand;
//# sourceMappingURL=MonitorHealthCommand.js.map