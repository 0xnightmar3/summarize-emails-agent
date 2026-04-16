#!/usr/bin/env node

import "dotenv/config";

import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const main = async () => {
    const params: Anthropic.MessageCreateParams = {
        "max_tokens": 1024,
        "messages": [{ role: "user", content: "Hello, Claude!" }],
        model: "claude-opus-4-7",
    };

    const message: Anthropic.Message = await client.messages.create(params);
    console.log(message.usage);
};

main();
