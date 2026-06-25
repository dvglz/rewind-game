# NBA Question Bank Expansion Design

## Goal

Extend Rewind's active NBA-first question bank with enough content for 10 more daily puzzles, Days 11-20. The new batch should feel like a mix of modern NBA history, universal fan-memory moments, and occasional "I did not know that" twists.

## Scope

- Add new `RewindQuestion` entries to `src/data/questionBank.ts`.
- Reshuffle and lock `src/data/dayDefinitions.ts` so Days 11-20 are playable.
- Keep the current five-round daily shape: easy, easy, medium, hard, hard.
- Keep the main playable pool NBA-first: NBA, NBA-adjacent, Olympic basketball, and college moments only when they are directly NBA-cultural.

Out of scope:

- New UI.
- Backend question-management changes.
- A broader NFL / MLB / NHL American sports pool.

## Content Direction

The batch should be mostly 2010-current, but not overfocused on 2023-2026. Use a small number of older iconic exceptions when they add real texture, such as SuperSonics history, Paul Pierce's Finals folklore, Spoelstra taking over Miami, or a 90s franchise-defining moment.

Question titles should sound like Rewind prompts, not article headlines. They should name the concrete event:

- Good: `The NBA allows sponsor patches on regular-season jerseys`
- Good: `Pat Riley moves upstairs and Spoelstra takes over Miami`
- Avoid: vague era summaries like `The Spurs win with beautiful-game basketball`
- Avoid: duplicate-adjacent sub-events when the current bank already covers the core moment

Regular-season MVP questions are allowed when they are worded as award moments, for example `Harden is named MVP after his 30-point Rockets season`. Do not use vague "MVP season" wording.

## Approved Candidate Bench

These candidates should be added or used as the first-pass bench for Days 11-20:

| Question | Year | Lane |
|---|---:|---|
| Draymond is suspended after the LeBron flagrant kick in the Finals | 2016 | Finals drama |
| Dillon Brooks pokes the bear before the Lakers send Memphis home | 2023 | Quote / consequence |
| Ja Morant's Instagram Live fallout leads to a 25-game suspension | 2023 | Drama |
| The Suns owner investigation pushes Robert Sarver to sell | 2022 | League drama |
| Mark Cuban gets a $600K fine for talking openly about tanking | 2018 | Owner drama |
| Curry debuts the night-night gesture during Golden State's title run | 2022 | Gesture |
| Lance blows in LeBron's ear during the playoffs | 2014 | Weird meme |
| JR Smith forgets the score in Game 1 of the Finals | 2018 | Finals meme |
| Zion's shoe explodes during Duke-UNC | 2019 | NBA-adjacent |
| Paul Pierce's wheelchair game becomes NBA Finals folklore | 2008 | Finals folklore |
| The NBA allows sponsor patches on regular-season jerseys | 2016 | Business / rulebook |
| The NBA gives coaches a replay challenge | 2019 | Rulebook |
| The NBA makes the play-in tournament part of the postseason | 2021 | Format change |
| The NBA launches its first in-season tournament | 2023 | Format change |
| Pat Riley moves upstairs and Spoelstra takes over Miami | 2008 | Coach / front office |
| Steve Kerr takes over Golden State before the title run | 2014 | Coach |
| Sam Hinkie resigns before The Process finally pays off | 2016 | Front office |
| Derrick Rose tears his ACL in Chicago's playoff opener | 2012 | Career-turning injury |
| Paul George suffers his Team USA leg injury in Las Vegas | 2014 | Career-turning injury |
| The SuperSonics move to Oklahoma City and become the Thunder | 2008 | Franchise move |
| Kevin Durant wins Rookie of the Year in Seattle's final NBA season | 2008 | Sonics / KD |
| The Clippers blow a 3-1 lead to Houston | 2015 | Collapse |
| The Clippers blow another 3-1 lead, this time to Denver | 2020 | Collapse |
| The Kings end the NBA's longest 16-year playoff drought | 2023 | Drought |
| The Sixers hit rock bottom with a 10-win Process season | 2016 | Team era |
| The Spurs miss the playoffs for the first time since Duncan arrived | 2020 | Streak |
| Brunson leads the Knicks to their first playoff series win in a decade | 2023 | Knicks / drought |

Additional existing draft candidates may be used if needed for difficulty balance, but avoid overusing Rookie of the Year, draft, and trade questions. Drop the Clippers-Mavs DeAndre emoji saga from the main batch unless a hard-slot shortage requires one internet-era free-agency oddity.

## Scheduling Approach

Use a hybrid approach:

1. Add a bench of vetted question objects with accurate dates, reveals, metadata, and difficulty.
2. Generate candidate day definitions with the existing builder so no day repeats a primary team or player and each day follows easy, easy, medium, hard, hard.
3. Manually review Days 11-20 and adjust the final order for editorial flow.

Day 11 should include a Giannis-based question, preferably:

`Milwaukee drafts Giannis with the 15th pick out of Greece`

This avoids duplicating the existing Giannis title question while adding an origin-story twist.

## Duplicate Avoidance

Avoid repeating current-bank events even if the wording changes. Known duplicate risks:

- The Decision
- KD joining the Warriors
- Kawhi's Game 7 bounce
- Giannis 50-point title game
- Cavs 3-1 comeback
- Wembanyama drafted first overall
- Jokic leading Denver to its first title
- Ray Allen Game 6
- Linsanity as a broad event
- Luka / Trae draft-night swap
- Raptors trading DeRozan for Kawhi

Sub-events can be considered only if the prompt creates a clearly different memory and does not feel like a reworded duplicate.

## Data Flow

The implementation should keep the current content pipeline:

- `REWIND_QUESTION_BANK` remains the source of truth.
- `DAY_DEFINITIONS` references question ids.
- `src/data/puzzles.ts` resolves day ids through the bank.
- Existing tests continue to validate ids, difficulty order, dates, reveals, and day constraints.

## Error Handling

Content validation should catch:

- Duplicate ids.
- Titles that leak a year.
- Invalid enum values.
- Reveal text that does not include the answer year.
- Day definitions that reference unknown or ineligible ids.
- Repeated primary team or player within a day.

If the generated schedule cannot satisfy constraints, adjust question difficulty, priority, primary team/player metadata, or manual day placement rather than weakening runtime rules.

## Testing

Run focused validation:

- `npm test -- src/data/questionBank.test.ts src/data/puzzles.test.ts scripts/buildDayDefinitions.test.ts`

Run broader verification if the content changes touch shared puzzle behavior:

- `npm test`
- `npm run build`

## Open Editorial Checks

Before final implementation, verify exact dates and facts for 2022-2025 items from reliable sources. Recent items are allowed, but 2023-2026 should not dominate the final Days 11-20 mix.
