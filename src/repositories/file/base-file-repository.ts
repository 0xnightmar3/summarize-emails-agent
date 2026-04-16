import { dirname } from "path";
import { appendFile, mkdir, readFile } from "fs/promises";

export abstract class BaseFileRepository<T> {
    constructor(protected readonly filePath: string) {}

    protected abstract serialize(record: T): string;
    protected abstract deserialize(line: string): T;

    async save(record: T): Promise<void> {
        await mkdir(dirname(this.filePath), { recursive: true });
        await appendFile(this.filePath, this.serialize(record) + "\n", "utf-8");
    }

    protected async readAll(): Promise<T[]> {
        let content: string;
        try {
            content = await readFile(this.filePath, "utf-8");
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
            throw err;
        }

        return content
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => this.deserialize(line));
    }

    async findRecent(n: number): Promise<T[]> {
        const records = await this.readAll();
        return records.slice(-n);
    }
}
