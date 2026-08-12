# DIY Project Estimator

## What this is

A side project to get hands-on experience integrating the Claude API into a
real app. It's also intended as a portfolio piece for job interviews (Senior
/ Staff / Principal Software Engineer roles).

The app: a user describes a DIY project they want to do. Claude breaks it
down into cost/approach options and the app attaches real YouTube tutorial
videos to each option.

## Core flow

1. User submits a **project description** (required) and an optional **budget**.
2. Claude generates a structured plan (see schemas below).
3. For each option in the plan, the app searches the **YouTube Data API v3**
   using the `video_search_queries` Claude provides, and attaches real
   video results (id, title, channel).
4. Combined result (Claude's plan + real video links) is returned to the
   frontend.

**Important:** Claude does NOT generate YouTube URLs directly — it only
generates search queries. Video links must always come from a real API call
to avoid hallucinated URLs.

## Input modes

### Mode A — No budget given

Return three cost tiers: low, medium, high.

```json
{
  "project": "Build a deck railing",
  "tiers": [
    {
      "tier": "low",
      "cost_range": "$150-300",
      "materials": ["pressure-treated 2x4s", "deck screws", "basic balusters"],
      "time_estimate": "1 weekend",
      "video_search_queries": ["budget deck railing DIY pressure treated"]
    },
    { "tier": "medium", "...": "..." },
    { "tier": "high", "...": "..." }
  ]
}
```

### Mode B — Budget given, and it's realistic

Return the best plan achievable at that budget, plus a stretch option (what
you'd gain by going ~20% over) and a savings option (what you'd cut to go
~20% under).

```json
{
  "project": "Build a deck railing",
  "budget": 400,
  "realistic": true,
  "withinBudget": {
    "cost_range": "$350-400",
    "materials": ["..."],
    "trade_offs": "Standard pressure-treated wood instead of composite",
    "video_search_queries": ["..."]
  },
  "stretchOption": {
    "cost_range": "$450-500",
    "what_you_gain": "Composite balusters, no repainting needed"
  },
  "savingsOption": {
    "cost_range": "$250-300",
    "what_you_cut": "Simpler baluster spacing, fewer decorative posts"
  }
}
```

### Mode C — Budget given, but unrealistic

Don't force a fit or quietly cut safety corners. Say so explicitly and
suggest the real minimum.

```json
{
  "project": "Rewire a bathroom outlet",
  "budget": 50,
  "realistic": false,
  "reason": "Electrical work requires GFCI-rated components and, in most areas, a permit. $50 doesn't cover safe materials, let alone tools.",
  "minRealisticBudget": 180,
  "whatThatGetsYou": {
    "materials": ["GFCI outlet", "wire, box, cover plate", "permit fee (varies by area)"],
    "video_search_queries": ["install GFCI outlet bathroom code"]
  }
}
```

## Safety rule (applies to all modes)

For safety-relevant project categories (electrical, structural, gas lines,
etc.), Claude should flag typical permit/licensed-professional requirements
even when the budget is realistic — not only when rejecting a budget as
unrealistic. This should be a standing instruction in the prompt, not
conditional logic.

## Build order

1. Project skeleton + a single API route: project description in, tier JSON
   out (Mode A only). No YouTube integration yet — validate the Claude
   output first.
2. Add budget handling (Modes B and C).
3. Wire in YouTube Data API search per option, using the
   `video_search_queries` from Claude's response.
4. Frontend: simple form (description + optional budget) and result cards.

## Tech choices

- Hosting/runtime: Next.js (TypeScript) — API routes and frontend live in
  one app, one deploy target. Matches the build order: steps 1-3 only touch
  `app/api/`, step 4 adds the frontend in the same project.
- Claude API: standard Messages API, structured output enforced via
  tool-use (define the Mode A/B/C schemas as a tool and force Claude to
  call it) rather than prompt-only JSON instructions. Avoids markdown-fence
  stripping and malformed-output retries.
- YouTube: YouTube Data API v3, `search` endpoint.
- Persistence: none for v1 — fully stateless per-request, no database, no
  accounts. Revisit only if a future task explicitly scopes history/saved
  estimates.

## Working conventions for Claude Code

- Propose a plan / repo structure before writing files — don't scaffold
  silently.
- Keep API keys (`ANTHROPIC_API_KEY`, YouTube API key) in `.env`, never
  hardcoded. Make sure `.gitignore` excludes `.env`.
- Build and test one mode at a time per the build order above, rather than
  implementing all three response modes before anything is verified working.
- This repo is a portfolio piece — keep the README current as features land
  (what it does, architecture, how to run it).
