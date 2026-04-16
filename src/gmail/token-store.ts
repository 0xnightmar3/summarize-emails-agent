import { homedir } from "os";
import { dirname, join } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";

import type { Credentials } from "google-auth-library";

const TOKEN_PATH = join(homedir(), ".config", "astropath", "token.json");

export const saveTokens = async (credentials: Credentials): Promise<void> => {
    await mkdir(dirname(TOKEN_PATH), { recursive: true });
    await writeFile(TOKEN_PATH, JSON.stringify(credentials, null, 2), "utf-8");
};

export const loadTokens = async (): Promise<Credentials | null> => {
    try {
        const content = await readFile(TOKEN_PATH, "utf-8");
        return JSON.parse(content) as Credentials;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
    };
};
