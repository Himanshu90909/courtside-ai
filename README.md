# CourtSide Arena

**Fire TV + Alexa+ sports companion with an AI commentator, an agentic A/B Insight Lab, and a business entity-matching engine.** Built for the *Build, Ship, Shape: Amazon Developer Hackathon* (Fire TV track).

**Live demo:** https://himanshu90909.github.io/courtside-ai/

This project merges three earlier repos into one responsive, working web app:

| Module | What it does | Origin |
|---|---|---|
| **Live Arena** | Multi-game live rail, D-pad (Fire TV remote) navigation, 3-persona AI commentator, text-to-speech, Ask-the-game, Alexa+ intent simulator | [courtside-tv](https://github.com/Himanshu90909/courtside-tv) |
| **Insight Lab** | Planner / Analyst / Writer / Verifier agents produce an experiment decision memo; deterministic auditor traces every number to a tool call; SRM guard refuses broken experiments | [experiment-analyst-agent](https://github.com/Himanshu90909/experiment-analyst-agent) |
| **Entity Match** | Normalize, block (composite keys), fuzzy-score and cluster business records, live in the browser | [Amazon-ML-Challenge](https://github.com/Himanshu90909/Amazon-ML-Challenge) |

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 6 unit tests
npm run build    # static site in dist/
```
Deployed to GitHub Pages from the `gh-pages` branch (built `dist/`). An optional Actions workflow is in `docs/deploy-workflow.yml.example`.

## Design
- Responsive from phone to 1080p TV: bottom tab bar on mobile, top tabs on desktop, scaled type on large screens.
- TV-first input: spatial D-pad focus engine (`src/lib/dpad.js`) with visible focus rings; all controls are also touch and mouse friendly.
- Works with no backend and no API key. Optionally paste an OpenAI-compatible key (Grok, OpenAI, Bedrock gateway) in Arena settings for real LLM commentary; it stays in memory only.

## Putting it on a Fire TV
Wrap the deployed URL with Amazon's Web App Starter Kit (or an Android TV WebView shell) and sideload with `adb install`, or submit via the Amazon Developer Console.

## Alexa+ skill
`src/lib/alexa.js` implements the intent handlers (`ScoreIntent`, `SwitchGameIntent`, `ExplainIntent`, `ClockIntent`) with the same JSON contract as a custom skill. To go live, host the handler behind HTTPS and register it as the skill endpoint (add request signature verification).

## Honest limitations
- Game data is simulated; the feed is isolated in `src/lib/games.js` so a real sports API can replace it.
- Insight Lab replays recorded runs of the Python agent (see its repo); it does not run Python in the browser.
- Entity Match runs a compact JS port on small samples; the full pipeline (DuckDB, millions of records) lives in the Amazon-ML-Challenge repo.
- Alexa+ is simulated locally; Fire TV packaging and skill certification are not done.
