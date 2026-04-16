import { Anthropic } from "@anthropic-ai/sdk";

import { config } from "../config";
import { GmailClient } from "../gmail/gmail-client";
import { SummarizeEmailsWorkflow } from "../workflows/summarize-emails";
import { FileEmailSummaryRepository } from "../repositories/file/file-email-summary-repository";

import type { Command } from "./command";

export class SummarizeCommand implements Command {
    name = "summarize";

    matches(cmd: string): boolean {
        return cmd === "summarize";
    }

    async execute(_: string[]): Promise<void> {
        const client = new Anthropic({ apiKey: config.apiKey });
        const gmail = new GmailClient(config.google);
        const repository = new FileEmailSummaryRepository(config.dataDir);
        const workflow = new SummarizeEmailsWorkflow(client, repository, config);

        await gmail.initialize();
        const emails = await gmail.fetchUnread(config.emailBatchSize, config.emailQuery);
        await workflow.run(emails);
    }
}
