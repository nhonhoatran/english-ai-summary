# Phase 04 — Tab Summary UI

**Effort:** 1h | **Priority:** P2 | **Status:** completed  
**Depends on:** Phase 02 (`summary` field in DB + ingest pipeline)  
**Blocks:** Phase 07

---

## Goal

Add a "Summary" tab to the lesson page. Content is the AI-generated `summary` string already stored in `Lesson.summary`.  
**Zero AI calls** — pure DB read.

---

## Step 1: Create `src/components/lesson/tab-summary.tsx` (NEW FILE)

```tsx
// path/to/src/components/lesson/tab-summary.tsx

import { BookText, GraduationCap, Brain } from "lucide-react";

interface TabSummaryProps {
  summary: string;
  title: string;
  description: string | null;
}

export function TabSummary({ summary, title, description }: TabSummaryProps) {
  if (!summary) {
    return (
      <div className="p-8 text-center text-zinc-500 rounded-xl bg-zinc-900/50 border border-zinc-800">
        Summary not available for this lesson.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="p-6 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Brain className="w-5 h-5" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">AI Summary</h3>
        </div>
        <p className="text-zinc-200 leading-relaxed">{summary}</p>
      </div>

      {/* Description card (the 1-sentence elllo description) */}
      {description && (
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/60 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <BookText className="w-5 h-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">About this lesson</h3>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Step 2: Update `lesson-tabs.tsx`

### Add `"summary"` to `VALID_TABS`:
```typescript
const VALID_TABS = ["summary", "script", "dialogue", "grammar", "quiz", "vocab"] as const;
```

### Add `summaryTab` prop:
```typescript
interface LessonTabsProps {
  summaryTab: ReactNode;  // NEW
  scriptTab: ReactNode;
  // ...rest unchanged
}
```

### Add trigger (first tab in list):
```tsx
<TabsTrigger value="summary" ...>
  <Brain className="w-4 h-4" />
  <span>Summary</span>
</TabsTrigger>
```

### Add content:
```tsx
<TabsContent value="summary" className="mt-4 focus-visible:outline-none">
  {summaryTab}
</TabsContent>
```

### Make `"summary"` the default active tab (or keep `"script"` — anh quyết):
```typescript
const [activeTab, setActiveTab] = useState<TabValue>("summary");
```

---

## Step 3: Update `src/app/lessons/[id]/page.tsx`

Add `writingPrompts` and `summary` to the DB query:
```typescript
const lesson = await db.lesson.findFirst({
  where: { id, userId: session.userId },
  include: {
    // ...existing includes...
    writingPrompts: { orderBy: { orderIndex: "asc" } },  // NEW for Phase 05
  },
});
```

Pass `summaryTab` to `LessonTabs`:
```tsx
<LessonTabs
  summaryTab={
    <TabSummary
      summary={lesson.summary ?? ""}
      title={lesson.title}
      description={lesson.description}
    />
  }
  scriptTab={...}
  // ...rest
/>
```

---

## Verification checklist

- [x] New `TabSummary` component renders correctly for a lesson with `summary` field
- [x] Tab appears first in the tab list
- [x] Hash routing works: `#summary` sets active tab
- [x] Graceful empty state when `summary` is null (older lessons)
- [x] `npx tsc --noEmit` passes
- [x] File size: `tab-summary.tsx` < 80 lines (37 lines)

---

## Risk

**VERY LOW** — pure UI, no new API calls, no schema changes in this phase.
