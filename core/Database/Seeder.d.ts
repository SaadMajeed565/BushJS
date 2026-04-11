export interface Seeder {
    run(): Promise<void> | void;
}
export declare abstract class BaseSeeder implements Seeder {
    abstract run(): Promise<void> | void;
}
export declare class SeederRunner {
    private seeders;
    add(seeder: Seeder): this;
    run(): Promise<void>;
}
//# sourceMappingURL=Seeder.d.ts.map