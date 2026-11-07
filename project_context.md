# Easy-Link — Project Context

Snapshot for anyone (human or AI) picking this project up cold. `README.md` and `FEATURES.md`
describe the *pitch*; this file describes what's actually in the repo right now, including work
in progress that hasn't been committed yet.

## What this is

Easy-Link turns a public-service web page URL into a short, warm, plain-Korean guide for
senior (70+) readers, with high-contrast UI, adjustable font size, and TTS playback. Paste a
URL → backend crawls the page → OpenRouter LLM rewrites it → frontend renders a checklist the
user can listen to instead of read.

Repo root for code is `EasyLink/` (this file's directory). The parent `C:\easylink\` also holds
`claude.md`, which is the original Korean planning prompt used to generate `README.md` — not a
coding-convention file, despite the name.

## Architecture

```
Frontend (React 18 + Vite + TS + Tailwind, :5173)
   │ POST /api/guide { url }
   ▼
Backend (Node + Express + TS, :4000)
   │ crawler.service.ts  → axios + cheerio, SSRF-guarded fetch + text/poster-image extraction
   │ openrouter.service.ts → structured prompt → OpenRouter chat completion → validated JSON
   ▼
OpenRouter (free-tier text model, + a vision model fallback for image-only notices)
```

Root `package.json` just runs backend+frontend together via `concurrently` (`npm run dev` from
`EasyLink/`).

## Current state: significant uncommitted work

`git status` shows 23 modified files (not yet committed) that move the product well past what
`README.md`/`FEATURES.md` describe. Anyone continuing this work should read the working tree,
not just the docs. Key shifts:

### 1. Guide shape changed from rigid 3-step to a flexible checklist
- Old: `{ summary, steps: [{ step, title, description }] }`, always exactly 3 steps.
- New (`backend/src/types/index.ts`, `openrouter.service.ts`): `{ headline, description, items: [{ icon, label, detail }] }`, 3–6 items.
- `icon` is a closed set of 10 emoji (💰📅👤📍📞📄⚠️🚫✅ℹ️), `label` is a closed set of 6 Korean
  category nouns (신청 방법/지원 대상/지원 금액/알아둘 점/주의사항/문의처), each must be unique per guide.
- Rationale baked into the system prompt: info-only notices (announcements, warnings) don't fit
  a 3-step "do this, then this" shape as well as application forms do: see
  `backend/src/services/openrouter.service.ts` comments for the full reasoning and the very
  detailed tone/content rules (banned words, mandatory phone-number fallback sentence, grounding
  rule against hallucination, administrative-metadata exclusion, etc). That prompt is long and
  specific — read it in full before touching guide generation, don't skim.

### 2. Vision-model fallback for image-only notices
- Many Korean gov bulletin-board pages have almost no body text — the actual notice is a
  poster image. `crawler.service.ts` now detects this (`IMAGE_FALLBACK_TEXT_THRESHOLD = 800`
  chars, tuned against a real NPS 공지사항 page), picks a plausible content image (filters
  logos/icons, prefers CMS viewer endpoints like `imageView.do`), downloads it server-side, and
  embeds it as a base64 data URI (remote image URLs proved unreliable with free vision models).
- `OPENROUTER_VISION_MODEL` env var (default `qwen/qwen3.8-27b:free`). An earlier candidate
  (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`) reliably failed against a real poster
  (empty completions, then timeouts) — current model is untested-but-better; re-verify if it
  also proves flaky, per the comment in `backend/.env.example`.

### 3. Timeout raised 60s → 120s
`OPENROUTER_TIMEOUT_MS` — free-tier models queue behind paid traffic; 60s was observed to be too
tight under provider queueing.

### 4. Frontend restructured around routing + a sidebar
`App.tsx` and `Sidebar.tsx` were rewritten for multi-page navigation. New pages beyond the
original single-page flow:
- `pages/MainPage.tsx` — the core URL→guide flow (what used to be the whole app)
- `pages/ArchivePage.tsx` + `hooks/usePolicyArchive.ts` — saved/past guides
- `pages/QuickLinksPage.tsx` — shortcuts to common public services
- `pages/SettingsPage.tsx` — font size / contrast / TTS rate preferences
- `pages/HelpPage.tsx` — usage help for senior users

Supporting additions: `hooks/useContrastMode.ts`, `hooks/useFontScale.ts`, `hooks/useTtsRate.ts`,
`hooks/useKakaoShare.ts` + `components/KakaoShareButton.tsx` (share a guide via Kakao),
`types/archive.ts`, `types/navigation.ts`.

## Security notes already in place
- `crawler.service.ts` blocks SSRF: rejects `localhost`/`0.0.0.0`/non-public hostnames before and
  after redirects (`assertPublicHost`), caps redirects, caps response size, and now also
  re-validates the resolved image host before downloading a poster image.
- Image downloads are capped at `MAX_IMAGE_BYTES = 5MB`.

## Known loose ends / things to verify before relying on them
- `OPENROUTER_VISION_MODEL` default is **unverified against a real poster image** per the
  comment in `openrouter.service.ts` — the prior model choice is confirmed broken, the current
  one is just "tried next," not confirmed working.
- The large uncommitted diff has not been through its own test pass in this session — don't
  assume it's merge-ready without running the app end-to-end first (see `README.md`
  "Getting Started" for `npm run dev` from `EasyLink/`).

## Conventions to follow (from `C:\easylink\claude.md`)
- Accessibility-first persona: every frontend component defaults to high-contrast, large-font,
  senior-friendly UI.
- Strong error handling around crawling (CORS/blocked-access cases) and OpenRouter calls
  (timeout handling, structured prompts).
- TTS code must check Web Speech API browser support before using it.
- Code comments in English; explanations/status updates to the developer in Korean.
