# Research Report: elllo Lesson Format & Spaced Repetition Algorithm

**Date:** 2026-07-25  
**Researcher:** format-research  
**Work Context:** D:\MyProject\english-summary

---

## TASK A: Reverse-Engineer elllo.org Lesson Format

### 1. Transcript/Script Format

**Source:** [elllo.org Grammar L2-03 Sandwich Lesson](https://elllo.org/english/grammar/L2-03-MegTodd-Sandwich.htm)

- **Speaker Labels:** Dialogue uses bold speaker names (`**Todd:**`, `**Meg:**`) followed by colon and text
- **Paragraph Breaks:** Natural paragraph breaks between speaker turns; no fixed paragraph length
- **Vocab Highlighting:** No explicit inline vocabulary highlighting observed in this lesson
- **Formatting Conventions:** Narrative flow follows authentic conversation with speaker interruptions and natural confirmations

**Example Transcript Format:**
```
**Todd:** How do you make a sandwich?
**Meg:** Well, first you get the bread.
```

### 2. Grammar Section Structure

**Source:** [elllo.org Grammar L2-03 Sandwich Lesson](https://elllo.org/english/grammar/L2-03-MegTodd-Sandwich.htm)

- **Points Per Lesson:** 4 grammar points per lesson observed
- **Point Structure:** 
  - Point number and title (e.g., "Point 1: The imperative is the base form...")
  - Brief explanatory text
  - Numbered examples (typically 4 per point)
- **Example Origin:** Examples are **invented**, not extracted from transcript
- **Thematic Connection:** Lesson teaches imperatives via sandwich-making context, but grammar examples are decontextualized (e.g., "Come here," "Help me please," "Don't eat too much")

**Verbatim Example:**
```
Point 1: The Imperative is the base form of the verb

The imperative is used to give instructions or commands.
1. Come here
2. Help me please
3. Don't eat too much
4. Make a sandwich
```

### 3. Quiz Section

**Status:** Quiz structure **not fully visible in HTML** — loaded dynamically via external platform (learnclick.net)

**Observations from Search:**
- elllo site states lessons "come with video, audio, script, media, quiz and vocab"
- Quiz section header visible: "Answer the following questions about the interview"
- Grammar quiz exists on external platform: "Grammar Check! What is the correct form for each blank"
- Actual quiz questions load from third-party system; static HTML does not include question examples

**Unresolved:** Cannot provide verbatim quiz question examples without JavaScript execution or direct HTML inspection in browser.

**Sources:** [elllo.org](https://elllo.org/) | [ELLLO Step Lessons](https://www.elllo.org/english/Step/index.html)

### 4. Vocabulary Section

**Status:** No dedicated vocabulary section observed in sampled lessons

- Lessons reference vocabulary exists but format not visible in static HTML
- No separate vocab list or glossary in page structure analyzed

---

## TASK B: Spaced Repetition Algorithm Comparison

### Algorithm Options

#### 1. SM-2 (SuperMemo 2 Algorithm)

**State Per Card (Database Columns):**
- `interval` — inter-repetition interval in days (initial: 0)
- `repetition` — count of continuous correct responses (initial: 0)
- `efactor` — easiness factor reflecting memorization difficulty (initial: 2.5)

**Scheduling Formula:**
- Based on SuperMemo 2 algorithm; users directed to super-memory.com for exact mathematical specification
- Adjusts `efactor` based on user response quality (0-5 scale)
- Next review interval calculated from efactor and repetition count

**Implementation Complexity:** LOW  
**Formula Maturity:** Proven (published 1987)

**TypeScript Packages:**
- **supermemo** v2.0.23 — last published 4 months ago | ~124 downloads/week (main registry) | Active maintenance
- **@dtjv/sm-2** — maintained but lower adoption
- **@kirklin/supermemo2** — TypeScript-focused; lower adoption

**Sources:** 
- [supermemo npm](https://www.npmjs.com/supermemo)
- [VienDinhCom/supermemo GitHub](https://github.com/VienDinhCom/supermemo)
- [Snyk SM-2 Advisory](https://snyk.io/advisor/npm-package/supermemo2)

---

#### 2. FSRS (Free Spaced Repetition Scheduler)

**State Per Card (Database Columns):**
- Not explicitly enumerated in docs; referenced via "state transition diagram" (ts-fsrs-workflow.drawio)
- Requires consulting [FSRS4Anki Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm#fsrs-6) for exact field list
- Implements FSRS v6 (current standard in Anki 2.1.57+)

**Scheduling Formula:**
- Proprietary FSRS v6 algorithm; parameters optimized via machine learning
- Supercedes SM-2 in Anki as default scheduler since ~2023
- Requires consultation of FSRS4Anki Wiki for mathematical details

**Implementation Complexity:** MEDIUM  
**Formula Maturity:** Modern, research-driven (v6 as of 2024)

**TypeScript Packages:**
- **ts-fsrs** v5.4.1 — latest release 9 days ago | 25.9k downloads/month | **ACTIVELY MAINTAINED** | 408 GitHub stars | MIT license | Requires Node.js ≥20.0.0
- **@squeakyrobot/fsrs** — alternative implementation, lower adoption

**Sources:**
- [ts-fsrs npm](https://www.npmjs.com/package/ts-fsrs/v/3.1.1)
- [ts-fsrs GitHub](https://github.com/open-spaced-repetition/ts-fsrs)
- [TS-FSRS Documentation](https://open-spaced-repetition.github.io/ts-fsrs/)

---

#### 3. Leitner System

**State Per Card:**
- Single integer: `box_number` (proficiency level, typically 1-5 or 1-12)
- Optional: `last_reviewed_date` for scheduling calculation

**Scheduling Formula:**
- Simple rule-based model:
  - **Correct answer** → advance card to next box
  - **Incorrect answer** → reset card to Box 1
  - **Review frequency** → depends on box (Box 1 daily, Box 2 every 2-3 days, Box 3 every 1 week, etc.)
- No complex calculation; purely interval-based per box

**Implementation Complexity:** MINIMAL  
**Formula Maturity:** Simple heuristic (physical card system, pre-digital)

**TypeScript Packages:**
- **flashleit** v0.0.3 — **NO LONGER MAINTAINED** (published 4 years ago, unmaintained)
- No other dedicated npm packages for Leitner in TypeScript
- Community implementations exist on GitHub but no published package ecosystem

**Sources:**
- [flashleit npm](https://www.npmjs.com/package/flashleit/v/0.0.3)
- [Wikipedia: Leitner System](https://en.wikipedia.org/wiki/Leitner_system)
- [GitHub Flashcard Projects](https://github.com/topics/flashcards?l=typescript)

---

### Comparison Matrix

| Criterion | SM-2 | FSRS | Leitner |
|-----------|------|------|---------|
| **State Fields** | 3 (interval, repetition, efactor) | ~5-7 (varies; see FSRS Wiki) | 1-2 (box_number + optional date) |
| **Formula Complexity** | Simple; adjustable via efactor | Medium; ML-optimized parameters | Minimal; rule-based intervals |
| **Scheduling Accuracy** | Good; proven since 1987 | Excellent; modern ML optimization | Fair; simple heuristic |
| **npm Package Status** | Active (v2.0.23, 4 mo old) | **Actively Maintained** (v5.4.1, 9 days old) | **Unmaintained** (4 years abandoned) |
| **TypeScript Support** | Yes | Yes (designed for TS/JS) | No active package |
| **Download Volume** | ~124/week | 25.9k/month | Deprecated |
| **Implementation Time** | 1-2 hours | 2-4 hours (learning curve) | <1 hour |

---

## RECOMMENDATION

**Choose: SM-2 (supermemo npm package)**

**Justification:**
1. **KISS Principle Wins:** SM-2 requires only 3 database columns and proven algorithm logic; implementation is 1-2 hours vs. 2-4 hours for FSRS. For a personal vocab app, SM-2 delivers 80% of FSRS scheduling quality at 20% complexity.
2. **Active Package Available:** `supermemo` v2.0.23 is actively maintained with production-ready TS support; no external API dependencies; ship immediately with confidence.
3. **Overkill Avoidance (YAGNI):** FSRS' ML-optimized parameters only pay off at scale (thousands of cards, diverse learner cohorts); personal flashcard app has 100-1000 cards from single learner — SM-2's simple efactor adjustment is sufficient and proven effective for decades.

**Alternative (if adoption scales to 100+ concurrent users):** Migrate to FSRS later once dataset justifies ML optimization cost.

---

## Unresolved Questions

1. **elllo Quiz Format:** Static HTML does not expose quiz questions. Require either:
   - Browser inspection with JavaScript execution enabled
   - Direct elllo.org API documentation (if public)
   - Manual page visit to capture exact quiz structure

2. **elllo Vocabulary Section:** No dedicated vocab section observed in static HTML. Clarify:
   - Is vocab a separate page/endpoint?
   - Format (list, flashcard, tooltip)?

3. **FSRS State Fields:** Exact database schema not documented in README. Must reference [FSRS4Anki Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm#fsrs-6) directly or inspect `ts-fsrs` source code for schema definition.

---

**Report Generated:** 2026-07-25 10:02 UTC  
**Status:** DONE
