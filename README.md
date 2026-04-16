# Astropath

*"Thought for the day: A mind without purpose will wander in dark places."*

An Astropath receives transmissions from across the void and distills them into intelligence the Imperium can act upon. This one reads your Gmail.

Fetches unread messages and summarizes each one using Claude. Summaries are persisted to a local JSONL file for later review. Designed to run on a cron schedule.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials
2. Run `npm install`
3. Run `npm run build`
4. Authenticate with Google: `astropath auth`

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | — | Anthropic API key |
| `GOOGLE_CLIENT_ID` | yes | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | yes | — | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | no | `http://localhost:3000/oauth/callback` | OAuth redirect URI |
| `MODEL` | no | `claude-opus-4-6` | Claude model to use |
| `MAX_TOKENS` | no | `1024` | Max tokens per response |
| `DATA_DIR` | no | `./data` | Directory for persisted output |
| `EMAIL_BATCH_SIZE` | no | `10` | Number of unread emails to fetch |

## Usage

```bash
# One-time Google OAuth authorization
astropath auth

# Summarize unread emails
astropath summarize

# Run agent with a prompt
astropath <prompt>
```

## Cron

To summarize emails every day at 8am, add the following to your crontab (`crontab -e`):

```
0 8 * * * cd /home/tex/Programming/Claude_API/Learning && /home/tex/.nvm/versions/node/v22.17.1/bin/node dist/main.js summarize >> data/cron.log 2>&1
```

> If you upgrade Node via nvm, update the path to `node` in the crontab entry.
