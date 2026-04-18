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

## Dashboard UI

A Streamlit web dashboard for browsing and searching your email summaries.

Reads from the same `data/email-summaries.jsonl` file and displays top-level metrics (total emails, unique senders, token usage, avg processing time), a sidebar with sender/date/search filters, and expandable cards showing each email's summary and token stats. Data auto-refreshes every 60 seconds.

### Running the dashboard

```bash
cd python_ui
pip install streamlit pandas
streamlit run app.py
```

Then open [http://localhost:8501](http://localhost:8501) in your browser.

> The dashboard expects `data/email-summaries.jsonl` to exist in the project root. Run `astropath summarize` at least once first.

## Cron

To summarize emails every day at 8am, add the following to your crontab (`crontab -e`):

```
0 8 * * * cd /path/to/astropath && /path/to/.nvm/versions/node/<version>/bin/node dist/main.js summarize >> data/cron.log 2>&1
```

> If you upgrade Node via nvm, update the path to `node` in the crontab entry.
