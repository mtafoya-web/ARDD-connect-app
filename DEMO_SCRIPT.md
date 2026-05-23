# ARDD Track 02 — Demo Script (5 minutes)

> Hero user: **Dr. Maya Chen** — Stanford, computational aging.
> Demo password for every seeded attendee: `ARDD-demo-2026!`
> Backend port assumed `8000` (the frontend defaults to `http://localhost:8000`).

## Pre-flight (run once before the demo)

```powershell
# in the backend venv
.venv/Scripts/python.exe migrate_db.py       # add ardd_meta columns (idempotent)
.venv/Scripts/python.exe seed_admin.py       # ensure admin exists
.venv/Scripts/python.exe seed_ardd.py        # 10 attendees, 15 sessions, speakers

# boot api + frontend (two terminals)
.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
# in frontend/
npm run dev
```

Confirm:
- Login page shows the three "Enter as a seeded demo attendee" buttons.
- `http://localhost:8000/health` returns `{"status":"ok"}`.
- The amber "ARDD 2026 demo build" banner is at the top of every page.

If something is wrong, re-run `python seed_ardd.py --reset` to wipe seeded rows and re-create them.

## Talking points to drop in opportunistically

- **Adapted, not rebuilt.** The base app already shipped profiles, a directory, a feed, follows, DMs, events, announcements, admin. We added an ARDD overlay on top.
- **Zero hallucination.** Every match explanation references literal fields from both profiles.
- **No external dependencies at demo time.** The Claw Bot is deterministic — no LLM call in the request path.

## The 5-minute walkthrough

### Step 1 — Landing (15s)
- Land on `/`. Hero reads "ARDD 2026 · Boston Longevity Week · Network Intelligence Tool".
- Click **Try the demo**.

### Step 2 — Sign in as Maya (10s)
- On `/login`, click the highlighted "Dr. Maya Chen" demo button.
- Lands on `/people`, on the **Top Matches** tab.

> "Maya is a computational-aging PI at Stanford. Her ARDD profile carries her role, focus tags, business goals, and availability — everything the matcher uses."

### Step 3 — Top Matches (45s)
- 5 ranked match cards. Point out:
  - **Alex Vargas** at 62 — `Academic ↔ Biotech` — three bullets including a literal availability overlap on Thursday afternoon.
  - **Rosa Alvarez** at 56 — same scenario, KOLs goal.
  - **Wen Liu** at 48 — `Academic ↔ Academic`, shared focus and explicit shared sessions.

> "Note the colored score chips, scenario badges, and the conversation starter at the bottom of each card — pre-baked, deterministic, never hallucinated."

### Step 4 — Side-by-side compare (40s)
- Click **See side-by-side** on Alex's card.
- Read the two columns aloud — same field types on each side: role, focus tags, goals, availability.
- "Why this match" reads back the same three bullets, plus a conversation starter ready to copy.

> "Every line in this explanation maps back to a literal field on one of these profiles. Whitelist guardrail. Never invents an affiliation, a paper, or a quote."

### Step 5 — Request intro (15s)
- Click **Request intro**.
- The DM composer opens with Alex selected and the conversation starter pre-filled in the input.
- Don't actually send — just show that it's ready.

### Step 6 — Program → Recommended (45s)
- Click **Program** in the nav (formerly "Events").
- Three tabs: Full Program / Recommended / My Schedule.
- Click **Recommended**. Top 8 sessions for Maya. Three reasons per session.
- Top item: "Aging Clocks: From Methylation to Multi-Omics" at 71 — matches her focus on aging clocks and computational aging biology, already starred, aligned with conference goals.

### Step 7 — Add to schedule + My Schedule (20s)
- Click **Add to my schedule** on a non-starred session (e.g. "Senescence: From Mechanism to Senolytics").
- Switch to **My Schedule** tab. New session appears alongside Maya's four pre-starred ones.

### Step 8 — Claw Bot · "what's happening now?" (30s)
- Bottom-left icon → **ARDD Claw Bot** panel opens.
- Click the **What's happening now?** chip.
- Bot responds: "Right now (Wed 11:30 UTC): 'Aging Clocks at the Bedside' in Hall A." with a clickable session card below.

> "The bot is rule-routed — six intents, all deterministic. No LLM in the demo path, no rate limits, no flaky API."

### Step 9 — Claw Bot · "what's next for me?" (15s)
- Click the **What's next for me?** chip.
- Bot pulls from Maya's starred sessions and replies with the next one — Networking Hall on Thu.

### Step 10 — Claw Bot · "where is Alex Vargas?" (15s)
- Click the **Where is a speaker?** chip OR type "where is Alex Vargas presenting?".
- Bot returns: "Alex Vargas is in 'Partial Reprogramming: In-Vivo Safety and Efficacy' at 2026-08-25 13:30, Hall B."

### Step 11 — Session pulse (20s)
- Click the **Session pulse** chip OR type "what did people think of the aging clocks panel?"
- Bot returns three pre-baked impressions tagged great / good / mixed.

### Step 12 — Submit an impression (20s)
- Type into the bot input: `loved the partial reprogramming panel — the in-vivo safety data was the clearest I've seen`
- Bot files it on Maya's most-recently-passed starred session and confirms.

> "That impression now lives in the feed and feeds the live pulse for that session — so the next attendee who asks 'how was that panel' will see it surface."

### Closing (15s)
Return to `/`. One sentence:

> "This is an existing working researcher network adapted into an ARDD-specific Network Intelligence Tool — onboarding overlay, scored matches with explanations, personalized program, and a deterministic bot. Production rollout plan and organizer access asks are in the submission."

## Fallback contingencies

| If this breaks | Do this |
|---|---|
| Backend is down | `python seed_ardd.py` then `uvicorn app.main:app --port 8000` |
| Login fails | Re-run `seed_ardd.py` to refresh the password hash |
| Match scores look wrong | Re-run `seed_ardd.py --reset` and reload `/people` |
| Bot returns 404 | Restart uvicorn (router list is bound at startup) |
| DM page won't compose | Use the inline "Request intro" CTA on the Match Card instead |
| Frontend won't build | `dist/` from the most recent `npx vite build` is already on disk |

## What we deliberately did NOT build tonight

- **ICS calendar export.** "My Schedule" view is the answer to the same question.
- **LLM-polished explanations.** Deterministic templates only — same demo, zero hallucination risk.
- **Slack/Telegram bot.** In-app bot panel only. Path A wiring documented in the submission.
- **End-of-day digest generator.** Static seed could be added in 30 minutes for the next iteration.
- **Onboarding wizard.** All demo profiles are pre-seeded; the wizard is a Phase 2 production task.
- **Archive export.** All bot events and impressions land in the existing posts table; an export endpoint is one more route.

These are explicitly called out in the submission as Phase 2 work.
