# Curiosity Loop — Claude Code Handover

**Project:** Personal spaced repetition learning app  
**Owner:** Margarita Kartashova (margashova)  
**Date:** May 2026  
**Status:** Schema live in Supabase, generator script ready, UI prototyped

---

## What this project is

A personal learning system with three parts:

1. **Telegram bot** — sends one fact per day on a rotating topic
2. **Anthropic API generator** — picks the next topic (round-robin), generates a fact + 3 quiz questions, stores everything in Supabase
3. **Web app (React + Vite)** — Sunday quiz UI and topic management

The idea: Claude surfaces interesting things from Margarita's interest graph throughout the week. On Sunday she does a short mixed quiz over everything she received. Topics are managed in the app (add, pause, remove, rename).

---

## What's done

### ✅ Supabase schema — LIVE
Three tables created and running in Margarita's Supabase project:

- `topics` — interest graph (name, category, paused, last_sent_at)
- `facts` — one row per daily delivery (fact_text, sent_at, quizzed)
- `quiz_questions` — 3 questions per fact (question, options jsonb, correct_index, explanation)

Two views also created:
- `this_week_quiz` — all facts + questions from the current week, for Sunday session
- `topics_with_stats` — topics with total fact count, for the management UI

Seed data inserted: 8 initial topics across wine, design, science, culture categories.

### ✅ Generator script — ready, not yet run
File: `generate-daily-fact.js`

- Picks next active topic ordered by `last_sent_at ASC NULLS FIRST` (round-robin)
- Calls `claude-sonnet-4-6` to generate fact + 3 quiz questions as JSON
- Inserts into `facts` and `quiz_questions`, updates `topics.last_sent_at`
- Returns `{ topicName, category, factText, factId }` for use by Telegram bot

Needs three env vars: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

### ✅ UI — prototyped in Claude.ai, needs implementing as real React app
Full interactive prototype exists. Two views:

**Quiz view:**
- Intro card showing week range, topic tags, fact count + start button
- Question flow: progress bar, topic pill, question in serif, 4 options
- Feedback shown after answering, next button, score screen at end
- Score screen: circle with correct/total, per-topic breakdown, retry button

**Topics view:**
- Topics grouped by category (wine, design, science, culture)
- Each topic: color stripe, name, fact count, edit/pause/resume/remove actions
- Inline name editing on click
- Add topic form at bottom: name input + category select

---

## Design system

### Palette (warm, Ethena-inspired)
```
--cream:        #FAF7F2   (canvas / page bg)
--cream2:       #F3EDE3   (card bg)
--cream3:       #EAE0D2   (nav bg, borders)
--terra:        #C4603A   (primary action, CTAs, progress)
--terra-light:  #F0D5C8   (wine category fill)
--terra-faint:  #FBF0EB   (wine category faint bg)
--blush:        #D4846A   (secondary warm)
--sage:         #7A8C6E   (science category, correct state)
--sage-light:   #DDE6D5
--sage-faint:   #F2F6EE
--amber:        #C4933A   (culture category)
--amber-light:  #F5E4C0
--plum:         #7B5EA7   (design category)
--plum-light:   #E4D8F5
--ink:          #2D2318   (primary text)
--ink2:         #5C4A36   (secondary text)
--ink3:         #9C8470   (muted text)
--ink4:         #C4B4A0   (placeholder / tertiary)
--border:       #E0D4C4
--border2:      #D0C0AC
```

### Category color map
```
wine:    terra (#C4603A)  stripe: #F0D5C8
design:  plum  (#7B5EA7)  stripe: #E4D8F5
science: sage  (#7A8C6E)  stripe: #DDE6D5
culture: amber (#C4933A)  stripe: #F5E4C0
```

### Typography
- Headings + questions: `var(--font-serif)` — adds warmth, editorial feel
- UI / body: `var(--font-sans)`
- Scale: 20px titles, 17px questions, 15px body, 14px options, 13px meta, 11px eyebrow (uppercase, tracked)

### Component style notes
- Border radius: 20px cards, 16px panels, 14px options/inputs, 12px buttons/feedback, 10px icon buttons
- Borders: `0.5px solid var(--border)` default, `var(--border2)` on hover/emphasis
- Primary button: `background: var(--terra); color: #FFF8F5; border: none`
- Nav toggle: cream3 background, active tab has cream bg + 0.5px border
- Topic item stripe: 3px wide left bar colored by category

---

## Project structure to create

```
curiosity-loop/
├── .env                        # ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
├── package.json                # "type": "module"
├── generate-daily-fact.js      # Daily cron script (done)
├── schema.sql                  # Already run in Supabase (done)
│
├── src/
│   ├── main.jsx
│   ├── App.jsx                 # Two views: quiz + topics
│   ├── lib/
│   │   └── supabase.js         # Supabase client (uses anon key for web app)
│   ├── views/
│   │   ├── QuizView.jsx        # Intro → questions → score
│   │   └── TopicsView.jsx      # Grouped list + add form
│   └── components/
│       ├── QuestionCard.jsx
│       ├── ScoreScreen.jsx
│       ├── TopicItem.jsx
│       └── AddTopicForm.jsx
│
└── telegram-bot.js             # Step 4 — not built yet
```

---

## Immediate next task: build the React app

### Setup
```bash
npm create vite@latest curiosity-loop -- --template react
cd curiosity-loop
npm install @supabase/supabase-js
```

### Supabase client (web app uses anon key, not service key)
```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Note: the generator script uses `SUPABASE_SERVICE_KEY` (server-side, never in browser). The web app uses `VITE_SUPABASE_ANON_KEY` (public, safe in browser). Get the anon key from Supabase → Project Settings → API.

### Key data fetches needed

**Quiz view — load this week's facts:**
```js
const { data } = await supabase
  .from('this_week_quiz')
  .select('*')
```

**Topics view — load topics with stats:**
```js
const { data } = await supabase
  .from('topics_with_stats')
  .select('*')
```

**Mark week as quizzed (after score screen):**
```js
await supabase
  .from('facts')
  .update({ quizzed: true })
  .gte('sent_at', startOfWeek)
```

**Topic management:**
```js
// Pause
await supabase.from('topics').update({ paused: true }).eq('id', id)

// Rename
await supabase.from('topics').update({ name: newName }).eq('id', id)

// Delete
await supabase.from('topics').delete().eq('id', id)

// Add
await supabase.from('topics').insert({ name, category, paused: false })
```

---

## After the React app: Telegram bot (step 4)

File to create: `telegram-bot.js`

It needs to:
1. Import and call `run()` from `generate-daily-fact.js`
2. Format the result into a Telegram message
3. Send via Telegram Bot API (`sendMessage`)
4. Optionally: on Sunday, also send a "Start your quiz →" button with a webview URL

Telegram message format:
```
📖 [Topic name]

[fact_text]

—
Sunday quiz coming up. All this week's topics in one session.
```

To create the bot: talk to @BotFather on Telegram, get a `TELEGRAM_BOT_TOKEN` and your own `TELEGRAM_CHAT_ID`.

---

## Scheduler (step 5, after bot)

Simplest option: **Make (formerly Integromat)**
- HTTP module → POST to a webhook that triggers `generate-daily-fact.js`
- Or: deploy the script to a small server / Railway / Render and hit it with a daily cron

Alternative if already using n8n: HTTP Request node on a daily schedule.

---

## Portfolio / Substack angle

This project is intended as a portfolio piece and potential Substack post. The interesting design story is:

- The *curation layer* — how an interest graph built from conversation history becomes a learning system
- The *quiz feel* vs generic flashcard apps — warm, personal, not gamified
- The *AI-directed workflow* — Margarita directed the design and architecture, Claude generated code, she reviewed and merged

Margarita's voice for writing about it: honest, first-person, diary-like. Not "I built a spaced repetition system" — more like "I wanted to stop learning things and immediately forgetting them."

---

## Key decisions already made

| Decision | Choice | Reason |
|---|---|---|
| Topic selection | Round-robin by last_sent_at | Fair, predictable, every topic gets airtime |
| Storage | Supabase | Cloud, queryable, easy to connect web + bot |
| Delivery | Telegram bot | Already in workflow, no new app to open |
| Quiz trigger | Sunday, weekly | One session > daily pressure |
| Categories | Fixed: wine, design, science, culture | Simple for now, can expand later |
| Quiz format | Multiple choice only | Simpler to generate and grade reliably |
| Fact generation model | claude-sonnet-4-6 | Good quality, reasonable cost for daily use |
