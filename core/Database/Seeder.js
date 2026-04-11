"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederRunner = exports.BaseSeeder = void 0;
class BaseSeeder {
}
exports.BaseSeeder = BaseSeeder;
class SeederRunner {
    constructor() {
        this.seeders = [];
    }
    add(seeder) {
        this.seeders.push(seeder);
        return this;
    }
    async run() {
        console.log('Running seeders...');
        for (const seeder of this.seeders) {
            await seeder.run();
        }
        console.log('Seeders completed successfully.');
    }
}
exports.SeederRunner = SeederRunner;
//# sourceMappingURL=Seeder.js.map