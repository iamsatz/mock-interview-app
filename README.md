# Mock Interview

A personal mock-interview coach. Upload your resume, pick a round, answer questions in text, and get an honest score with tips after every answer. Everything you do is saved in your browser.

| Round | What it feels like |
|---|---|
| Screening | Recruiter call: your story, motivation, fit |
| Technical | Hiring manager: depth in your craft and past work |
| Behavioral | Real situations, answered with STAR |

## What you need

- [Node.js](https://nodejs.org) 20 or newer (check with `node -v`)
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com/settings/keys)

## Setup (5 minutes)

1. Download the code and open the folder in Terminal.
2. Install:
   ```sh
   npm install
   ```
3. Create your settings file:
   ```sh
   cp .env.example .env
   ```
4. Open `.env` and paste your key after `ANTHROPIC_API_KEY=`.
5. Start the app:
   ```sh
   npm run dev
   ```
6. Open **http://localhost:5173**.

To run the built version instead: `npm run build` then `npm start`, and open http://localhost:8787.

## How it works

```
Browser (React, port 5173)  ──/api──▶  Small server (Express, port 8787)  ──▶  Claude API
        │                                        │
   localStorage                            Tavus API (optional)
 (profile, sessions)
```

- **Resume** goes to Claude once. Claude returns a short profile (name, skills, highlights, suggested roles). Only that profile is stored, in your browser.
- **Questions** are generated per round from that profile and your target role.
- **Scoring** gives 1 to 10, what worked, what to improve, and a stronger model answer.
- Your API key stays on the server and is never sent to the browser.

| File | What's inside |
|---|---|
| `server/index.ts` | The 4 API routes |
| `server/prompts.ts` | Interviewer and scoring instructions. Edit these to change tone or difficulty |
| `server/claude.ts` | The Claude call (structured JSON output) |
| `server/tavus.ts` | Video interviewer integration point |
| `src/screens/` | One file per screen: Setup, Home, Interview, Summary, History |
| `src/styles.css` | All colours and spacing as tokens at the top. Light and dark mode |

## Video interviewer (Tavus CVI), optional

The **Video interviewer** button stays disabled until you add these to `.env` and restart:

```
TAVUS_API_KEY=...
TAVUS_REPLICA_ID=...
TAVUS_PERSONA_ID=...   # optional
```

When on, the app writes questions with Claude, creates a Tavus conversation with those questions as context, and opens the video call inside the page. Video answers are not scored yet. That's the next step: pull the transcript from Tavus and send each answer to `/api/score`.

## Settings

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Required |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Any Claude model ID |
| `PORT` | `8787` | API server port |

Requests use Claude's server-side refusal fallback (`fallbacks: "default"`), so if a request is declined it is retried on a fallback model automatically.

## Privacy

- Resume text is sent to the Anthropic API to build your profile. Nothing else leaves your machine except API calls.
- **History → Reset everything** wipes your profile and all sessions from the browser.
