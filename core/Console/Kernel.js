"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleKernel = void 0;
const MakeAppCommand_1 = require("./Commands/MakeAppCommand");
const MakeControllerCommand_1 = require("./Commands/MakeControllerCommand");
const MakeModelCommand_1 = require("./Commands/MakeModelCommand");
const MakeSchemaCommand_1 = require("./Commands/MakeSchemaCommand");
const MakeSeederCommand_1 = require("./Commands/MakeSeederCommand");
const MakeMiddlewareCommand_1 = require("./Commands/MakeMiddlewareCommand");
const MakeRequestCommand_1 = require("./Commands/MakeRequestCommand");
const MakePolicyCommand_1 = require("./Commands/MakePolicyCommand");
const MakeCommandCommand_1 = require("./Commands/MakeCommandCommand");
const MakeRouteCommand_1 = require("./Commands/MakeRouteCommand");
const SeedCommand_1 = require("./Commands/SeedCommand");
const SchemaCommand_1 = require("./Commands/SchemaCommand");
const MonitorHealthCommand_1 = require("./Commands/MonitorHealthCommand");
const MonitorMetricsCommand_1 = require("./Commands/MonitorMetricsCommand");
const BackupCreateCommand_1 = require("./Commands/BackupCreateCommand");
const BackupListCommand_1 = require("./Commands/BackupListCommand");
const BackupCleanupCommand_1 = require("./Commands/BackupCleanupCommand");
const HelpCommand_1 = require("./Commands/HelpCommand");
class ConsoleKernel {
    constructor(app) {
        this.commands = new Map();
        this.app = app;
        this.registerDefaultCommands();
    }
    register(command) {
        this.commands.set(command.signature, command);
    }
    registerDefaultCommands() {
        this.register(new MakeAppCommand_1.MakeAppCommand(this.app));
        this.register(new MakeControllerCommand_1.MakeControllerCommand(this.app));
        this.register(new MakeModelCommand_1.MakeModelCommand(this.app));
        this.register(new MakeSchemaCommand_1.MakeSchemaCommand(this.app));
        this.register(new MakeSeederCommand_1.MakeSeederCommand(this.app));
        this.register(new MakeMiddlewareCommand_1.MakeMiddlewareCommand(this.app));
        this.register(new MakeRequestCommand_1.MakeRequestCommand(this.app));
        this.register(new MakePolicyCommand_1.MakePolicyCommand(this.app));
        this.register(new MakeCommandCommand_1.MakeCommandCommand(this.app));
        this.register(new MakeRouteCommand_1.MakeRouteCommand(this.app));
        this.register(new SeedCommand_1.SeedCommand(this.app));
        this.register(new SchemaCommand_1.SchemaCommand(this.app));
        this.register(new MonitorHealthCommand_1.MonitorHealthCommand(this.app));
        this.register(new MonitorMetricsCommand_1.MonitorMetricsCommand(this.app));
        this.register(new BackupCreateCommand_1.BackupCreateCommand(this.app));
        this.register(new BackupListCommand_1.BackupListCommand(this.app));
        this.register(new BackupCleanupCommand_1.BackupCleanupCommand(this.app));
        this.register(new HelpCommand_1.HelpCommand(() => this.showHelp()));
    }
    async handle(argv = []) {
        const commandName = argv[2] ?? 'help';
        const command = this.commands.get(commandName);
        const args = argv.slice(3);
        if (!command) {
            this.showHelp();
            return;
        }
        await command.handle(args);
    }
    showHelp() {
        console.log('Available commands:');
        const sorted = Array.from(this.commands.values()).sort((a, b) => a.signature.localeCompare(b.signature));
        for (const command of sorted) {
            console.log(`  ${command.signature} - ${command.description}`);
        }
    }
}
exports.ConsoleKernel = ConsoleKernel;
//# sourceMappingURL=Kernel.js.map