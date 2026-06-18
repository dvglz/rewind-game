# Rewind — Question Authoring Prompt

You are writing questions for **Rewind**, a daily game where players guess the **year**
a sports moment happened by scrolling a timeline. Generate `N` new questions as
TypeScript objects matching the `RewindQuestion` schema in `questionBank.ts`.

## Hard rules
1. The `title` must NOT contain the year (or a giveaway like "this season"). The whole
   game is guessing the year — leaking it breaks the round.
2. `reveal` starts with `"In YYYY, "` and is one self-contained sentence that confirms
   the year.
3. `title` is present-tense and concrete ("Kawhi's shot bounces in to beat Philly in
   Game 7"), not a trivia question.
4. Use real, verifiable dates. Prefer iconic, widely-known moments over obscure stat
   lines.

## Calibration (avoid "too easy" and "too nerdy")
- **easy** — a casual fan instantly knows the era within a year or two.
- **medium** — a real fan knows it; casual fans are off by 2–4 years.
- **hard** — even fans hesitate: deeper cuts, close-together dates, or "bait" moments
  that feel like a different year.
- Aim for famous *moments*, not record-book minutiae. If only a stats nerd would
  recognize it, mark `priority: 3` or drop it.

## Conventions
- `eligibleForMain: true` only for NBA / nba_adjacent / olympic_basketball that fit the
  daily game; park NFL/MLB/NHL as `false`.
- Don't duplicate an `id` or restate a moment already in the bank.
- Spread eras and themes across a batch.
- `priority`: 1 = core/iconic, 2 = good regular pool, 3 = deeper cut.

Output only the array of objects, ready to paste into `REWIND_QUESTION_BANK`.
