import type { EmailSummary } from "../models/email-summary";

export interface IEmailSummaryRepository {
    save(summary: EmailSummary): Promise<void>;
};
