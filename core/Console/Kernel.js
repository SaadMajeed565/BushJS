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
const MigrateCommand_1 = require("./Commands/MigrateCommand");
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
        this.register(new MigrateCommand_1.MigrateCommand(this.app));
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
        const groups = [
            { title: 'General', matcher: (signature) => signature === 'help' },
            { title: 'Generators', matcher: (signature) => signature.startsWith('make:') },
            { title: 'Database', matcher: (signature) => signature === 'schema' || signature === 'seed' || signature === 'migrate' },
        ];
        const commands = Array.from(this.commands.values());
        const assigned = new Set();
        console.log('Available commands:\n');
        for (const group of groups) {
            const inGroup = commands
                .filter((command) => group.matcher(command.signature))
                .sort((a, b) => a.signature.localeCompare(b.signature));
            if (inGroup.length === 0) {
                continue;
            }
            console.log(`${group.title}:`);
            for (const command of inGroup) {
                assigned.add(command.signature);
                console.log(`  ${command.signature.padEnd(20)} ${command.description}`);
            }
            console.log('');
        }
        const other = commands
            .filter((command) => !assigned.has(command.signature))
            .sort((a, b) => a.signature.localeCompare(b.signature));
        if (other.length > 0) {
            console.log('Other:');
            for (const command of other) {
                console.log(`  ${command.signature.padEnd(20)} ${command.description}`);
            }
        }
    }
}
exports.ConsoleKernel = ConsoleKernel;
//# sourceMappingURL=Kernel.js.map