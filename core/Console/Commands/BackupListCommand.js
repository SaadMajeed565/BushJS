"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupListCommand = void 0;
const Command_1 = require("../Command");
const BackupService_1 = require("../../Foundation/BackupService");
class BackupListCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'backup:list';
        this.description = 'List available backups.';
        this.app = app;
    }
    async handle() {
        console.table(BackupService_1.backupService.listBackups());
    }
}
exports.BackupListCommand = BackupListCommand;
//# sourceMappingURL=BackupListCommand.js.map