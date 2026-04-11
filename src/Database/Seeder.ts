export interface Seeder {
  run(): Promise<void> | void;
}

export abstract class BaseSeeder implements Seeder {
  abstract run(): Promise<void> | void;
}

export class SeederRunner {
  private seeders: Seeder[] = [];

  add(seeder: Seeder): this {
    this.seeders.push(seeder);
    return this;
  }

  async run(): Promise<void> {
    console.log('Running seeders...');
    for (const seeder of this.seeders) {
      await seeder.run();
    }
    console.log('Seeders completed successfully.');
  }
}
