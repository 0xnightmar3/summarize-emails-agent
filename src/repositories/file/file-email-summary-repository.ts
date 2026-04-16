import { dirname, resolve } from "path";
import { appendFile, mkdir } from "fs/promises";

import type { EmailSummary } from "../../models/email-summary";
// import type { IEmailSummaryRepository } from "../email-summary-repository";

// type Serialized = Omit<EmailSummary, "timestamp" | "emailDate"> & {
//     timestamp: string;
//     emailDate: string;
// };

const serialize = (s: EmailSummary): string =>
    JSON.stringify({
        ...s,
        timeStamp: s.timestamp.toISOString(),
        emailDate: s.emailDate.toISOString(),
    });

// const deserialize = (line: string): EmailSummary => {
//     const raw = JSON.parse(line) as Serialized;
//     return {
//         ...raw,
//         timestamp: new Date(raw.timestamp),
//         emailDate: new Date(raw.emailDate),
//     };
// };

export class FileEmailSummaryRepository implements FileEmailSummaryRepository {
    private readonly filePath: string;

    constructor(dataDir: string) {
        this.filePath = resolve(dataDir, "email-summaries.jsonl");
    };

    async save(summary: EmailSummary): Promise<void> {
        await mkdir(dirname(this.filePath), { recursive: true });
        await appendFile(this.filePath, serialize(summary));
    };
};
