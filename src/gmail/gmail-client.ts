import { google } from "googleapis";

import type { Config } from "../config";

import { loadTokens, saveTokens } from "./token-store";

export interface Email {
  emailId: string;
  date: Date;
  sender: string;
  subject: string;
  body: string;
}

interface MessagePart {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: MessagePart[] | null;
}

interface Header {
  name?: string | null;
  value?: string | null;
}

const getHeader = (headers: Header[], name: string): string =>
  headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

const extractPlainText = (part: MessagePart): string => {
  if (part.mimeType === "text/plain" && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf-8");
  }
  for (const child of part.parts ?? []) {
    const text = extractPlainText(child);
    if (text) return text;
  }
  return "";
};

export class GmailClient {
  private readonly auth;

  constructor(config: Config["google"]) {
    this.auth = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );
  }

  async initialize(): Promise<void> {
    const tokens = await loadTokens();
    if (!tokens) {
      throw new Error("No OAuth tokens found. Run `learning auth` first.");
    }
    this.auth.setCredentials(tokens);
    this.auth.on("tokens", async (refreshed) => {
      const current = await loadTokens();
      await saveTokens({ ...current, ...refreshed });
    });
  }

  async fetchUnread(n: number): Promise<Email[]> {
    const gmail = google.gmail({ version: "v1", auth: this.auth });

    const list = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: n,
    });

    const messages = list.data.messages ?? [];

    return Promise.all(
      messages.map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        });

        const payload = full.data.payload ?? {};
        const headers = (payload.headers ?? []) as Header[];

        return {
          emailId: msg.id!,
          date: new Date(parseInt(full.data.internalDate ?? "0", 10)),
          sender: getHeader(headers, "From"),
          subject: getHeader(headers, "Subject"),
          body: extractPlainText(payload as MessagePart),
        };
      }),
    );
  }
}
