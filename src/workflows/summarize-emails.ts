import { randomUUID } from "crypto";

import type { Anthropic } from "@anthropic-ai/sdk";

import type { Config } from "../config";
import { track } from "../claude/track";
import { callClaude } from "../claude/call";
import type { Email } from "../gmail/gmail-client";
import { emptyUsage, type TokenUsage } from "../models/usage";
import type { IEmailSummaryRepository } from "../repositories/email-summary-repository";

// Cached system prompt — instructs Claude once for the whole batch.
// Caching kicks in at ≥2048 tokens for Haiku, ≥1024 for Sonnet/Opus.
const SYSTEM_PROMPT = `You are a concise email summarizer.

You will receive one or more emails. For EACH email, write a 2-4 sentence summary covering the sender's main point and any action required.

CRITICAL RULES:
1. You MUST return a result for every email ID listed in the prompt — no omissions.
2. The "emailId" field MUST be copied EXACTLY from the "BEGIN EMAIL <id>" marker — do not alter, guess, or substitute IDs.
3. Respond with ONLY a raw JSON array — no markdown, no explanation.

Each array element must have exactly two fields:
- "emailId": the exact ID string from the input marker
- "summary": your summary text`;

// ~1500 tokens worth of body per email. Keeps large HTML-heavy marketing
// emails from dominating the prompt even after plain-text extraction.
const BODY_CHAR_LIMIT = 6000;

const truncateBody = (body: string): string =>
    body.length > BODY_CHAR_LIMIT
        ? `${body.slice(0, BODY_CHAR_LIMIT)}\n[truncated]`
        : body;

const buildEmailBlock = (email: Email): string =>
    `BEGIN EMAIL ${email.emailId}
From: ${email.sender}
Subject: ${email.subject}
Date: ${email.date.toISOString()}

${truncateBody(email.body)}
END EMAIL ${email.emailId}`;

const buildBatchPrompt = (emails: Email[]): string => {
    const idList = emails.map(e => `- ${e.emailId}`).join("\n");
    const blocks = emails.map(e => buildEmailBlock(e)).join("\n\n");
    return `Summarize the following ${emails.length} email(s). Required IDs to return:\n${idList}\n\n${blocks}`;
};

interface BatchResult {
    emailId: string;
    summary: string;
}

const parseBatchResponse = (text: string): BatchResult[] => {
    // Strip optional markdown code fences Claude may add
    const json = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    return JSON.parse(json) as BatchResult[];
};

const validateBatchResults = (
    results: BatchResult[],
    expected: Email[],
): { valid: BatchResult[]; needsRetry: Email[] } => {
    const expectedIds = new Set(expected.map(e => e.emailId));
    const returnedIds = new Set(results.map(r => r.emailId));

    // Only keep results whose ID was actually in the input
    const valid = results.filter(r => expectedIds.has(r.emailId));

    // Retry any expected email that wasn't returned (or returned with a wrong ID)
    const needsRetry = expected.filter(e => !returnedIds.has(e.emailId));

    return { valid, needsRetry };
};

const distributeUsage = (total: TokenUsage, count: number): TokenUsage => ({
    inputTokens: Math.round(total.inputTokens / count),
    outputTokens: Math.round(total.outputTokens / count),
    cacheReadTokens: Math.round(total.cacheReadTokens / count),
    cacheWriteTokens: Math.round(total.cacheWriteTokens / count),
});

export class SummarizeEmailsWorkflow {
    constructor(
        private readonly client: Anthropic,
        private readonly repository: IEmailSummaryRepository,
        private readonly config: Config,
    ) {}

    async run(emails: Email[]): Promise<void> {
        const alreadySummarized = await this.repository.findSummarizedEmailIds();
        const unseen = emails.filter(e => !alreadySummarized.has(e.emailId));

        if (unseen.length === 0) {
            console.log("No new emails to summarize.");
            return;
        }

        console.log(`Summarizing ${unseen.length} new email(s), skipping ${emails.length - unseen.length} already done.`);

        const batchOutcome = await track(async () => {
            const { text, usage } = await callClaude(
                this.client,
                this.config,
                [{ role: "user", content: buildBatchPrompt(unseen) }],
                {
                    system: SYSTEM_PROMPT,
                    // Scale output budget with batch size — each summary ~200 tokens
                    maxTokens: Math.max(this.config.maxTokens, unseen.length * 200),
                },
            );
            return { summaries: parseBatchResponse(text), usage };
        });

        if (batchOutcome.status === "error") {
            await Promise.all(unseen.map(email =>
                this.repository.save({
                    id: randomUUID(),
                    emailId: email.emailId,
                    timestamp: batchOutcome.timestamp,
                    emailDate: email.date,
                    sender: email.sender,
                    subject: email.subject,
                    summary: "",
                    usage: emptyUsage(),
                    durationMs: batchOutcome.durationMs,
                    status: "error",
                    error: batchOutcome.error,
                }),
            ));
            throw new Error(batchOutcome.error);
        }

        const { valid, needsRetry } = validateBatchResults(batchOutcome.result.summaries, unseen);

        if (needsRetry.length > 0) {
            console.warn(`Batch response missing ${needsRetry.length} email(s) — retrying individually: ${needsRetry.map(e => e.emailId).join(", ")}`);
        }

        const summaryMap = new Map(valid.map(r => [r.emailId, r.summary]));
        const perEmailUsage = distributeUsage(batchOutcome.result.usage, unseen.length);

        // Retry missing emails individually and merge results into the map
        await Promise.all(needsRetry.map(async email => {
            const retryOutcome = await track(async () => {
                const { text, usage } = await callClaude(
                    this.client,
                    this.config,
                    [{ role: "user", content: buildEmailBlock(email) }],
                    { system: SYSTEM_PROMPT },
                );
                // Individual call: response is plain text, not JSON
                return { text, usage };
            });

            if (retryOutcome.status === "success") {
                summaryMap.set(email.emailId, retryOutcome.result.text);
            }

            await this.repository.save(
                retryOutcome.status === "success"
                    ? {
                        id: randomUUID(),
                        emailId: email.emailId,
                        timestamp: retryOutcome.timestamp,
                        emailDate: email.date,
                        sender: email.sender,
                        subject: email.subject,
                        summary: retryOutcome.result.text,
                        usage: retryOutcome.result.usage,
                        durationMs: retryOutcome.durationMs,
                        status: "success",
                    }
                    : {
                        id: randomUUID(),
                        emailId: email.emailId,
                        timestamp: retryOutcome.timestamp,
                        emailDate: email.date,
                        sender: email.sender,
                        subject: email.subject,
                        summary: "",
                        usage: emptyUsage(),
                        durationMs: retryOutcome.durationMs,
                        status: "error",
                        error: retryOutcome.error,
                    },
            );
        }));

        // Save batch results for emails that were handled correctly
        const batchEmails = unseen.filter(e => summaryMap.has(e.emailId) && !needsRetry.includes(e));
        await Promise.all(batchEmails.map(email =>
            this.repository.save({
                id: randomUUID(),
                emailId: email.emailId,
                timestamp: batchOutcome.timestamp,
                emailDate: email.date,
                sender: email.sender,
                subject: email.subject,
                summary: summaryMap.get(email.emailId)!,
                usage: perEmailUsage,
                durationMs: batchOutcome.durationMs,
                status: "success",
            }),
        ));
    }
}
