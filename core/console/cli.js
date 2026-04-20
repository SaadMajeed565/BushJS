#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const Application_1 = require("../Foundation/Application");
async function main() {
    const app = new Application_1.Application({ basePath: process.cwd() });
    await app.runConsole(process.argv);
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map