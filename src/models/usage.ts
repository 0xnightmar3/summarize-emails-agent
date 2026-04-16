export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
};

export const emptyUsage = (): TokenUsage => ({
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
});

export const accumulateUsage = (acc: TokenUsage, next: TokenUsage): TokenUsage => ({
    inputTokens: acc.inputTokens + next.inputTokens,
    outputTokens: acc.outputTokens + next.outputTokens,
    cacheReadTokens: acc.cacheReadTokens + next.cacheReadTokens,
    cacheWriteTokens: acc.cacheWriteTokens + next.cacheWriteTokens,
});
