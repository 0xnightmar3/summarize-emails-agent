#!/usr/bin/env node

import { Anthropic } from "@anthropic-ai/sdk";

import { config } from "./config";
import { auth } from "./commands/auth";
import { AgentLoop } from "./agent/agent";
import { GmailClient } from "./gmail/gmail-client";
import { SummarizeEmailsWorkflow } from "./workflows/summarize-emails";
import { FileRunRepository } from "./repositories/file/file-run-repository";
import { FileEmailSummaryRepository } from "./repositories/file/file-email-summary-repository";

const main = async () => {
    const [command, ...args] = process.argv.slice(2);

    if (command === "auth") {
        await auth();
        return;
    };

    if (command === "summarize") {
        const client = new Anthropic({ apiKey: config.apiKey });
        const gmail = new GmailClient(config.google);
        const repository = new FileEmailSummaryRepository(config.dataDir);
        const workflow = new SummarizeEmailsWorkflow(client, repository, config);

        await gmail.initialize();
        const emails = await gmail.fetchUnread(config.emailBatchSize);
        await workflow.run(emails);
        return;
    };

    if (command) {
        const client = new Anthropic({ apiKey: config.apiKey });
        const repository = new FileRunRepository(config.dataDir);
        const agent = new AgentLoop(client, repository, config);
        await agent.run([command, ...args].join(" "));
        return;
    };

    console.error("Usage:");
    console.error(" learning auth");
    console.error(" learning summarize");
    console.error(" learning <prompt>");
    process.exit(1);
};

main();
