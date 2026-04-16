import { resolve } from "path";

import type { Run } from "../../models/run";
import type { IRunRepository } from "../run-repository";

import { BaseFileRepository } from "./base-file-repository";

type SerializedRun = Omit<Run, "timestamp"> & { timestamp: string };

export class FileRunRepository extends BaseFileRepository<Run> implements IRunRepository {
    constructor(dataDir: string) {
        super(resolve(dataDir, "runs.jsonl"));
    }

    protected serialize(run: Run): string {
        return JSON.stringify({ ...run, timestamp: run.timestamp.toISOString() });
    }

    protected deserialize(line: string): Run {
        const raw = JSON.parse(line) as SerializedRun;
        return { ...raw, timestamp: new Date(raw.timestamp) };
    }
}
