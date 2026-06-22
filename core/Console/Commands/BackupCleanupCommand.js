"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupCleanupCommand = void 0;
const Command_1 = require("../Command");
const BackupService_1 = require("../../Foundation/BackupService");
class BackupCleanupCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'backup:cleanup';
        this.description = 'Remove backups older than N days (default: 30).';
        this.app = app;
    }
    async handle(args) {
        const keepDays = Number.parseInt(args[0] ?? '30', 10);
        const days = Number.isFinite(keepDays) && keepDays > 0 ? keepDays : 30;
        await BackupService_1.backupService.cleanupOldBackups(days);
        console.log(`Old backups cleaned up (kept last ${days} days).`);
    }
}
exports.BackupCleanupCommand = BackupCleanupCommand;
//# sourceMappingURL=BackupCleanupCommand.js.map