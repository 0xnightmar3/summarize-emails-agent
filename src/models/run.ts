import type { Anthropic } from "@anthropic-ai/sdk";

import type { TokenUsage } from "./usage";

export type RunStatus = "success" | "error";

export interface Run {
    id: string;
    timestamp: Date;
    prompt: string;
    model: string;
    messages: Anthropic.MessageParam[];
    response: string;
    usage: TokenUsage;
    durationMs: number;
    status: RunStatus;
    error?: string;
};
