"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupCreateCommand = void 0;
const Command_1 = require("../Command");
const BackupService_1 = require("../../Foundation/BackupService");
class BackupCreateCommand extends Command_1.Command {
    constructor(app) {
        super();
        this.signature = 'backup:create';
        this.description = 'Create a full backup. Supports --no-compress, --no-db, --no-files, --no-logs.';
        this.app = app;
    }
    async handle(args) {
        const result = await BackupService_1.backupService.createFullBackup({
            database: !args.includes('--no-db'),
            files: !args.includes('--no-files'),
            logs: !args.includes('--no-logs'),
            compression: !args.includes('--no-compress'),
        });
        if (result.success) {
            console.log('Backup created:', result.path);
            return;
        }
        console.error('Backup failed:', result.error ?? 'Unknown error');
    }
}
exports.BackupCreateCommand = BackupCreateCommand;
//# sourceMappingURL=BackupCreateCommand.js.map