#!/usr/bin/env node

import type { Command } from "./commands/command";
import { AuthCommand } from "./commands/auth-command";
import { AgentCommand } from "./commands/agent-command";
import { SummarizeCommand } from "./commands/summarize-command";

const commands: Command[] = [
    new AuthCommand(),
    new SummarizeCommand(),
    new AgentCommand(), // fallback — must be last
];

const main = async () => {
    const [command, ...args] = process.argv.slice(2);

    if (!command) {
        console.error("Usage:");
        console.error(" astropath auth");
        console.error(" astropath summarize");
        console.error(" astropath <prompt>");
        process.exit(1);
    }

    const handler = commands.find(c => c.matches(command));
    await handler!.execute([command, ...args]);
};

main();
