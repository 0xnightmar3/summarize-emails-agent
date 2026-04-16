import { resolve } from "path";

import type { EmailSummary } from "../../models/email-summary";
import type { IEmailSummaryRepository } from "../email-summary-repository";

import { BaseFileRepository } from "./base-file-repository";

type SerializedEmailSummary = Omit<EmailSummary, "timestamp" | "emailDate"> & {
    timestamp: string;
    emailDate: string;
};

export class FileEmailSummaryRepository extends BaseFileRepository<EmailSummary> implements IEmailSummaryRepository {
    constructor(dataDir: string) {
        super(resolve(dataDir, "email-summaries.jsonl"));
    }

    protected serialize(s: EmailSummary): string {
        return JSON.stringify({
            ...s,
            timestamp: s.timestamp.toISOString(),
            emailDate: s.emailDate.toISOString(),
        });
    }

    protected deserialize(line: string): EmailSummary {
        const raw = JSON.parse(line) as SerializedEmailSummary;
        return {
            ...raw,
            timestamp: new Date(raw.timestamp),
            emailDate: new Date(raw.emailDate),
        };
    }

    async findSummarizedEmailIds(): Promise<Set<string>> {
        const summaries = await this.readAll();
        return new Set(summaries.filter(s => s.status === "success").map(s => s.emailId));
    }
}
