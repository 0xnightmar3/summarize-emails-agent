import { dirname, resolve } from "path";
import { appendFile, mkdir, readFile } from "fs/promises";

import type { Run } from "../../models/run";
import type { IRunRepository } from "../run-repository";

type SerializedRun = Omit<Run, "timestamp"> & { timestamp: string };

const serialize = (run: Run): string =>
    JSON.stringify({ ...run, timestamp: run.timestamp.toISOString() });

const deserialize = (line: string): Run => {
    const raw = JSON.parse(line) as SerializedRun;
    return { ...raw, timestamp: new Date(raw.timestamp) };
};

export class FileRunRepository implements IRunRepository {
    private readonly filePath: string;

    constructor(dataDir: string) {
        this.filePath = resolve(dataDir, "runs.jsonl");
    };

    async save(run: Run): Promise<void> {
        await mkdir(dirname(this.filePath), { recursive: true });
        await appendFile(this.filePath, serialize(run) + "\n", "utf-8");
    };

    private async readAll(): Promise<Run[]> {
        let content: string;
        try {
            content = await readFile(this.filePath, "utf-8");
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
            throw err;
        };

        return content
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(deserialize);
    };

    async findRecent(n: number): Promise<Run[]> {
        const runs = await this.readAll();
        return runs.slice(-n);
    };
}
