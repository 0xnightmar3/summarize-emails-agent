import "dotenv/config";

import Anthropic from "@anthropic-ai/sdk";

export interface Config {
    apiKey: string;
    model: Anthropic.Model;
    dataDir: string;
    maxTokens: number;
    google: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    };
    emailBatchSize: number;
};

/**
 * Helps fail early if an important env variable is missing
 */
const requiredKey = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env variable: ${key}`);
    return value;
};

export const config: Config = {
    apiKey: requiredKey("ANTHROPIC_API_KEY"),
    model: (process.env.MODEL as Anthropic.Model) ?? "claude-haiku-4-5-20251001",
    dataDir: process.env.DATA_DIR ?? "./data",
    maxTokens: parseInt(process.env.MAX_TOKENS ?? "1024", 10),
    google: {
        clientId: requiredKey("GOOGLE_CLIENT_ID"),
        clientSecret: requiredKey("GOOGLE_CLIENT_SECRET"),
        redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/oauth/callback",
    },
    emailBatchSize: parseInt(process.env.EMAIL_BATCH_SIZE ?? "10", 10),
};
