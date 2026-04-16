import type { Anthropic } from "@anthropic-ai/sdk";

import type { Config } from "../config";
import { accumulateUsage, emptyUsage, type TokenUsage } from "../models/usage";

export interface CallClaudeOptions {
    /** Passed as a cached system prompt. Must be ≥1024 tokens (Sonnet/Opus) or ≥2048 tokens (Haiku) to actually be cached. */
    system?: string;
    /** Override config.maxTokens for this call (e.g. batch calls need more output room). */
    maxTokens?: number;
}

export interface ClaudeResponse {
    text: string;
    usage: TokenUsage;
    rawContent: Anthropic.ContentBlock[];
}

export const callClaude = async (
    client: Anthropic,
    config: Pick<Config, "model" | "maxTokens">,
    messages: Anthropic.MessageParam[],
    options?: CallClaudeOptions,
): Promise<ClaudeResponse> => {
    const response = await client.messages.create({
        model: config.model,
        max_tokens: options?.maxTokens ?? config.maxTokens,
        ...(options?.system && {
            system: [{ type: "text", text: options.system, cache_control: { type: "ephemeral" } }],
        }),
        messages,
    });

    const text = response.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");

    const usage = accumulateUsage(emptyUsage(), {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    });

    return { text, usage, rawContent: response.content };
};
