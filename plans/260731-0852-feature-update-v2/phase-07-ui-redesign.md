# Phase 07 — Full UI/UX Redesign

**Effort:** 10h | **Priority:** P2 | **Status:** completed  
**Depends on:** Phase 01–06 (all features must exist before redesigning around them)  
**Blocks:** nothing (final phase)

---

## Goal

Full visual overhaul. Keep dark theme (zinc-950 base). Elevate every surface with:
- Premium dark glassmorphism aesthetic
- Smooth micro-animations
- Better visual hierarchy
- New hero/landing section
- Redesigned lesson cards, tabs, and vocabulary cards
- 7-tab layout with clear iconography

---

## Design system tokens (establish FIRST in `globals.css`)

```css
/* globals.css additions */

:root {
  /* Brand colors — cool blue-purple gradient palette */
  --brand-primary: #3b82f6;    /* blue-500 */
  --brand-accent: #8b5cf6;     /* violet-500 */
  --brand-glow: rgba(59,130,246,0.15);

  /* Surface layers */
  --surface-0: #09090b;        /* zinc-950 — page bg */
  --surface-1: #18181b;        /* zinc-900 — card bg */
  --surface-2: #27272a;        /* zinc-800 — elevated card */
  --surface-border: rgba(63,63,70,0.6); /* zinc-700/60 */

  /* Text */
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;   /* zinc-400 */
  --text-muted: #71717a;       /* zinc-500 */

  /* Animations */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

Add utility classes:
```css
.glass-card {
  background: rgba(24, 24, 27, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(63, 63, 70, 0.5);
  border-radius: 1rem;
}

.gradient-text {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glow-border {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1);
}
```

---

## Page by page changes

### 1. Landing page `src/app/page.tsx` — Full redesign

**Current:** Simple form centered on page.  
**New:**
- Animated hero section with gradient headline
- Feature highlights (3 cards: Summary, Practice, Vocabulary)
- Lesson list with new card design (see below)
- Stats bar (lesson count, vocab count)

```tsx
// Hero section concept
<section className="relative py-20 px-4 overflow-hidden">
  {/* Background gradient blob */}
  <div className="absolute inset-0 -z-10">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
  </div>

  <div className="max-w-3xl mx-auto text-center space-y-6">
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
      <Sparkles className="w-4 h-4" />
      AI-powered language learning
    </div>
    <h1 className="text-4xl sm:text-6xl font-bold gradient-text leading-tight">
      Learn from videos.<br />Never forget a word.
    </h1>
    <p className="text-zinc-400 text-lg">
      Paste a YouTube URL. Get a full lesson with grammar, quiz, vocabulary, and practice exercises — instantly.
    </p>
    {/* AddLessonForm here */}
  </div>
</section>
```

### 2. Lesson list cards `lesson-list-card.tsx` — Redesign

**New card design:**
- Left border accent (blue gradient)
- Language badge (🇺🇸 / 🇨🇳)
- Metadata row: date, tab count, vocab count
- Hover: card lifts + subtle glow
- Delete button: hidden until hover (desktop) / always visible (mobile)

```tsx
// Concept
<div className="glass-card p-5 hover:glow-border transition-all duration-250 group cursor-pointer">
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-2 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-xs">{lesson.targetLanguage === "chinese" ? "🇨🇳" : "🇺🇸"}</span>
        <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
          {lesson.title}
        </h3>
      </div>
      {lesson.description && (
        <p className="text-sm text-zinc-400 line-clamp-2">{lesson.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>{formatDate(lesson.createdAt)}</span>
        <span>·</span>
        <span>{lesson.vocabCount} vocab</span>
      </div>
    </div>
    <DeleteLessonButton ... className="opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
</div>
```

### 3. Lesson page `[id]/page.tsx` + header — Redesign

- Sticky header with lesson title + back button
- Video player area with rounded corners + shadow
- Status panel redesign (cleaner loading/error states)

### 4. Tab bar `lesson-tabs.tsx` — Redesign

**New tab bar:** Horizontal pill-style tabs with scroll on mobile

7 tabs in order:
```
[Summary] [Script] [Dialogue] [Grammar] [Quiz] [Vocabulary] [Practice]
```

Icons: Brain, FileText, MessageSquare, BookOpen, HelpCircle, BookMarked, PenLine

```tsx
// Tab bar: scrollable on mobile, full-width on desktop
<TabsList className="flex gap-1 p-1 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl overflow-x-auto no-scrollbar">
  {/* Each tab trigger */}
  <TabsTrigger
    value={tab.value}
    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
               text-zinc-400 transition-all duration-150
               data-[state=active]:bg-blue-600 data-[state=active]:text-white
               data-[state=active]:shadow-[0_0_12px_rgba(59,130,246,0.4)]
               hover:text-white hover:bg-zinc-800"
  >
    <tab.Icon className="w-4 h-4" />
    {tab.label}
  </TabsTrigger>
</TabsList>
```

### 5. Vocabulary tab `tab-vocabulary.tsx` — Redesign

**New vocab card:**
```tsx
<div className="glass-card p-5 hover:glow-border transition-all group">
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-2 flex-1">
      {/* Term + IPA row */}
      <div className="flex items-center gap-3">
        <h4 className="text-lg font-bold text-white">{item.term}</h4>
        {item.ipa && (
          <span className="font-mono text-sm text-blue-400/70 bg-blue-950/30 px-2 py-0.5 rounded-md">
            {item.ipa}
          </span>
        )}
      </div>
      {/* Meaning */}
      <p className="text-zinc-300 text-sm font-medium">{item.meaning}</p>
      {/* Example */}
      <blockquote className="text-xs text-zinc-400 italic border-l-2 border-zinc-700 pl-3">
        {item.example}
      </blockquote>
    </div>
    {/* Save button */}
    <SaveButton ... />
  </div>
</div>
```

### 6. Summary tab `tab-summary.tsx` — Redesign

Already new in Phase 04 — apply glassmorphism tokens.

### 7. Writing Practice tab `tab-writing-practice.tsx` — Redesign

Already new in Phase 05 — apply glassmorphism tokens.

Design:
- Large Vietnamese meaning in gradient text
- Textarea with glowing focus border
- Progress bar at top
- Result card: green (correct) / red (wrong) with animation (scale-in)

### 8. Grammar tab `tab-grammar.tsx` — Polish

- Theme badge with gradient
- Grammar points as numbered cards
- Examples in code-style blocks

### 9. Quiz tab `tab-quiz.tsx` — Polish

- Radio-style option buttons (replace plain options)
- Correct answer highlight animation
- Score summary at end

### 10. `add-lesson-form.tsx` — Redesign

- Language toggle as pill buttons (from Phase 06)
- URL input with larger font, glow on focus
- Generate button with gradient + loading shimmer
- Custom options panel with better layout

---

## Implementation order within Phase 07

1. `globals.css` — design tokens + utility classes
2. `src/app/page.tsx` — hero + landing
3. `lesson-list-card.tsx` — new card
4. `lesson-tabs.tsx` — 7-tab bar
5. `tab-vocabulary.tsx` — vocab cards with IPA
6. `tab-summary.tsx` — apply tokens
7. `tab-writing-practice.tsx` — apply tokens
8. `tab-grammar.tsx` + `tab-quiz.tsx` — polish
9. `lesson page [id]/page.tsx` — header + layout
10. `add-lesson-form.tsx` — redesign

---

## Animations to add

| Element | Animation |
|---|---|
| Page load | `animate-fade-in` (opacity 0→1, 300ms) |
| Cards | `hover:scale-[1.01] transition-transform` |
| Tab switch | Smooth content transition (shadcn Tabs already has this) |
| Quiz result | `animate-scale-in` (scale 0.95→1 + opacity) |
| Writing result | Slide up from bottom |
| Hero blobs | Slow pulse via CSS `animate-pulse` |

Add to `globals.css`:
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out both;
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-in {
  animation: scale-in 0.2s ease-out both;
}
```

---

## Verification checklist

- [x] Landing page hero renders with gradient + blobs
- [x] Lesson cards have hover effect + glow
- [x] 7 tabs visible and scrollable on mobile (375px viewport)
- [x] Vocabulary cards show IPA in mono font (English) / Pinyin (Chinese)
- [x] Summary tab renders properly
- [x] Writing practice tab animations work
- [x] Quiz tab options are clear and show correct/wrong state
- [x] Grammar tab theme badge renders
- [x] No layout overflow on mobile
- [x] Dark mode is consistent (no white flashes)
- [x] `npx tsc --noEmit` passes
- [x] Lighthouse score maintained (no regression)

---

## Risk

**MEDIUM** — Scope is large but purely cosmetic. No API/DB changes. Risk is time overrun.  
**Mitigation:** Implement in component order above; can ship Phase 07 incrementally.
