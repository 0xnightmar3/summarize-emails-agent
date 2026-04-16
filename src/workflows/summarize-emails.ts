import { randomUUID } from "crypto";

import { Anthropic } from "@anthropic-ai/sdk";

import type { Config } from "../config";
import type { Email } from "../gmail/gmail-client";
// import type { EmailSummary } from "../models/email-summary";
import { accumulateUsage, emptyUsage } from "../models/usage";
import type { IEmailSummaryRepository } from "../repositories/email-summary-repository";

const buildPrompt = (email: Email): string =>
    `Summarize the following email concisely.\n\nFrom: ${email.sender}\nSubject: ${email.subject}\nDate: ${email.date.toISOString()}\n\n${email.body}`;

export class SummarizeEmailsWorkflow {
    constructor(
        private readonly client: Anthropic,
        private readonly repository: IEmailSummaryRepository,
        private readonly config: Config,
    ) {};

    async run(emails: Email[]): Promise<void> {
        for (const email of emails) {
            await this.summarizeOne(email);
        };
    };

    private async summarizeOne(email: Email): Promise<void> {
        const id = randomUUID();
        const timestamp = new Date();
        const startTime = Date.now();

        try {
            const response = await this.client.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                messages: [{ role: "user", content: buildPrompt(email) }],
            });

            const summary = response.content
                .filter(b => b.type === "text")
                .map(b => b.text)
                .join("");

            const usage = accumulateUsage(emptyUsage(), {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
                cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
            });

            await this.repository.save({
                id,
                emailId: email.emailId,
                timestamp,
                emailDate: email.date,
                sender: email.sender,
                subject: email.subject,
                summary,
                usage,
                durationMs: Date.now() - startTime,
                status: "success",
            });
        } catch (err) {
            await this.repository.save({
                id,
                emailId: email.emailId,
                timestamp,
                emailDate: email.date,
                sender: email.sender,
                subject: email.subject,
                summary: "",
                usage: emptyUsage(),
                durationMs: Date.now() - startTime,
                status: "error",
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        };
    };
};
