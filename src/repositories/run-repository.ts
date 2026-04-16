import type { Run } from "../models/run";

export interface IRunRepository {
    save(run: Run): Promise<void>;
    // findAll(): Promise<Run[]>;
    // findById(id: string): Promise<Run | null>;
    findRecent(n: number): Promise<Run[]>;
};
