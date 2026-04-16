import type { TokenUsage } from "./usage";

export type EmailSummaryStatus = "success" | "error";

export interface EmailSummary {
    id: string;
    emailId: string;
    timestamp: Date;
    emailDate: Date;
    sender: string;
    subject: string;
    summary: string;
    usage: TokenUsage;
    durationMs: number;
    status: EmailSummaryStatus;
    error?: string;
};
