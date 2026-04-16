import { auth } from "./auth";
import type { Command } from "./command";

export class AuthCommand implements Command {
    name = "auth";

    matches(cmd: string): boolean {
        return cmd === "auth";
    }

    async execute(_: string[]): Promise<void> {
        await auth();
    }
}
