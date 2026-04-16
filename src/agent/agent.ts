import { randomUUID } from "crypto";

import { Anthropic } from "@anthropic-ai/sdk";
import type { Anthropic as AnthropicTypes } from "@anthropic-ai/sdk";

import type { Config } from "../config";
import type { Run } from "../models/run";
import { accumulateUsage, emptyUsage } from "../models/usage";
import type { IRunRepository } from "../repositories/run-repository";

export class AgentLoop {
    constructor(
        private readonly client: Anthropic,
        private readonly repository: IRunRepository,
        private readonly config: Config,
    ) {};

    async run(prompt: string): Promise<void> {
        const id = randomUUID();
        const timestamp = new Date();
        const startTime = Date.now();
        const messages: AnthropicTypes.MessageParam[] = [
            { role: "user", content: prompt },
        ];

        try {
            const response = await this.client.messages.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                messages,
            });

            const responseText = response.content
                .filter(b => b.type === "text")
                .map(b => b.text)
                .join("");

            const usage = accumulateUsage(emptyUsage(), {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
                cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
            });

            const run: Run = {
                id,
                timestamp,
                prompt,
                model: this.config.model,
                messages: [...messages, { role: "assistant", content: response.content }],
                response: responseText,
                usage,
                durationMs: Date.now() - startTime,
                status: "success",
            };

            await this.repository.save(run);
        } catch (error) {
            const run: Run = {
                id,
                timestamp,
                prompt,
                model: this.config.model,
                messages,
                response: "",
                usage: emptyUsage(),
                durationMs: Date.now() - startTime,
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            };

            await this.repository.save(run);
            throw error;
        };
    };
};
