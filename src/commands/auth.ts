import { createServer } from "http";
import { exec } from "child_process";

import { google } from "googleapis";

import { config } from "../config";
import { saveTokens } from "../gmail/token-store";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export const auth = (): Promise<void> =>
    new Promise((resolve, reject) => {
        const client = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri,
        );

        const authUrl = client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
            prompt: "consent",
        });

        console.log("Opening browser for authentication...");
        exec(`xdg-open "${authUrl}"`);
        console.log("If thje browser did not open, visit:\n", authUrl);

        const server = createServer(async (req, res) => {
            try {
                const url = new URL(req.url!, "http://localhost:3000");
                const code = url.searchParams.get("code");

                if (!code) {
                    res.writeHead(400);
                    res.end("Missing authorization code.");
                    return;
                };

                const { tokens } = await client.getToken(code);
                await saveTokens(tokens);

                res.writeHead(200);
                res.end("Authorization successful. You can close this tab.");
                server.close();
                resolve();
            } catch (error) {
                res.writeHead(500);
                res.end("Authentication failed.");
                server.close();
                reject(error);
            };
        });

        server.listen(3000, () => {
            console.log("Waiting for callback on http://localhost:3000...");
        });
    });
