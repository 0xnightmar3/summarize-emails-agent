import { Anthropic } from "@anthropic-ai/sdk";
import type { Anthropic as AnthropicTypes } from "@anthropic-ai/sdk";

import type { Config } from "../config";
import { track } from "../claude/track";
import type { Run } from "../models/run";
import { callClaude } from "../claude/call";
import { emptyUsage } from "../models/usage";
import type { IRunRepository } from "../repositories/run-repository";

export class AgentLoop {
    constructor(
        private readonly client: Anthropic,
        private readonly repository: IRunRepository,
        private readonly config: Config,
    ) {};

    async run(prompt: string): Promise<void> {
        const messages: AnthropicTypes.MessageParam[] = [
            { role: "user", content: prompt },
        ];

        const outcome = await track(async ({ id, timestamp }) => {
            const { text, usage, rawContent } = await callClaude(this.client, this.config, messages);
            return { text, usage, rawContent, id, timestamp };
        });

        const run: Run = outcome.status === "success"
            ? {
                id: outcome.id,
                timestamp: outcome.timestamp,
                prompt,
                model: this.config.model,
                messages: [...messages, { role: "assistant", content: outcome.result.rawContent }],
                response: outcome.result.text,
                usage: outcome.result.usage,
                durationMs: outcome.durationMs,
                status: "success",
            }
            : {
                id: outcome.id,
                timestamp: outcome.timestamp,
                prompt,
                model: this.config.model,
                messages,
                response: "",
                usage: emptyUsage(),
                durationMs: outcome.durationMs,
                status: "error",
                error: outcome.error,
            };

        await this.repository.save(run);

        if (outcome.status === "error") throw new Error(outcome.error);
    };
};
