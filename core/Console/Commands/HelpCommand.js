"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpCommand = void 0;
const Command_1 = require("../Command");
class HelpCommand extends Command_1.Command {
    constructor(showHelp) {
        super();
        this.showHelp = showHelp;
        this.signature = 'help';
        this.description = 'List available commands.';
    }
    async handle() {
        this.showHelp();
    }
}
exports.HelpCommand = HelpCommand;
//# sourceMappingURL=HelpCommand.js.map