import { Anthropic } from "@anthropic-ai/sdk";

import { config } from "../config";
import { AgentLoop } from "../agent/agent";
import { FileRunRepository } from "../repositories/file/file-run-repository";

import type { Command } from "./command";

export class AgentCommand implements Command {
    name = "agent";

    matches(_: string): boolean {
        // Fallback: matches any unrecognized command and treats it as a prompt
        return true;
    }

    async execute(args: string[]): Promise<void> {
        const client = new Anthropic({ apiKey: config.apiKey });
        const repository = new FileRunRepository(config.dataDir);
        const agent = new AgentLoop(client, repository, config);
        await agent.run(args.join(" "));
    }
}
