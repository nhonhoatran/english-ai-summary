# Phase 01 � DB Schema Migration

## Overview

- **Priority:** P1
- **Effort:** 2h
- **Status:** Completed
- **Depends on:** �
- **Blocks:** Phase 02, 03, 04

Th�m 5 models m?i v�o Prisma schema cho to�n b? V3 feature set.

## Requirements

- 5 models m?i: `UserPoint`, `UserStreak`, `CatState`, `Classroom`, `ClassMember`
- 1 enum m?i: `PointSource`
- Update `User` model th�m relations
- Migration t?o ra d�ng indexes
- NEVER `prisma db push`

## Architecture

### Models m?i

```prisma
model UserPoint {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime    // truncate to UTC midnight
  source    PointSource
  points    Int
  meta      Json?       // { lessonId?, quizScore?, cardId? }
  createdAt DateTime    @default(now())

  @@index([userId, date])
}

enum PointSource {
  daily_lesson
  quiz_complete
  writing_correct
  flashcard_review
  streak_bonus
}

model UserStreak {
  id             String    @id @default(cuid())
  userId         String    @unique
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  currentStreak  Int       @default(0)
  longestStreak  Int       @default(0)
  lastActiveDate DateTime?
  updatedAt      DateTime  @updatedAt
}

model CatState {
  id           String    @id @default(cuid())
  userId       String    @unique
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  happiness    Int       @default(80)
  hunger       Int       @default(0)
  cleanliness  Int       @default(100)
  petCount     Int       @default(0)
  lastFedAt    DateTime?
  lastBathedAt DateTime?
  lastPettedAt DateTime?
  updatedAt    DateTime  @updatedAt
}

model Classroom {
  id         String   @id @default(cuid())
  code       String   @unique
  hostUserId String
  host       User     @relation("HostedClassrooms", fields: [hostUserId], references: [id])
  lessonId   String?
  lesson     Lesson?  @relation(fields: [lessonId], references: [id])
  isActive   Boolean  @default(true)
  currentTab     String?
  currentSegment Int?
  lastSyncAt     DateTime?
  createdAt  DateTime    @default(now())
  members    ClassMember[]

  @@index([code, isActive])
}

model ClassMember {
  id          String    @id @default(cuid())
  classroomId String
  classroom   Classroom @relation(fields: [classroomId], references: [id], onDelete: Cascade)
  displayName String
  phone       String?
  joinedAt    DateTime  @default(now())
  lastSeenAt  DateTime  @default(now())

  @@unique([classroomId, displayName])
  @@index([classroomId, lastSeenAt])
}
```

### User model � relations c?n th�m

```prisma
userPoints   UserPoint[]
userStreak   UserStreak?
catState     CatState?
classrooms   Classroom[]  @relation("HostedClassrooms")
```

### Lesson model � relation c?n th�m

```prisma
classrooms Classroom[]
```

## Related Code Files

| File | Action | M� t? |
|------|--------|--------|
| `prisma/schema.prisma` | Modify | Th�m 5 models, 1 enum, update User + Lesson |

## Implementation Steps

1. M? `prisma/schema.prisma`
2. Th�m enum `PointSource` sau `TargetLanguage`
3. Th�m model `UserPoint` sau `ReviewLog`
4. Th�m model `UserStreak` sau `UserPoint`
5. Th�m model `CatState` sau `UserStreak`
6. Th�m model `Classroom` sau `CatState`
7. Th�m model `ClassMember` sau `Classroom`
8. Update `User` model � th�m 4 relations
9. Update `Lesson` model � th�m `classrooms Classroom[]`
10. Ch?y migration: `npx prisma migrate dev --name v3-social-gamification`
11. Ch?y: `npx prisma generate`
12. Typecheck: `npx tsc --noEmit`

## Todo

- [x] S?a `prisma/schema.prisma` � th�m enum + 5 models
- [x] Update `User` relations (4 fields m?i)
- [x] Update `Lesson` relations (1 field m?i)
- [x] `npx prisma migrate dev --name v3-social-gamification`
- [x] `npx prisma generate`
- [x] `npx tsc --noEmit` � zero errors

## Success Criteria

- Migration ch?y th�nh c�ng, kh�ng l?i
- `prisma generate` kh�ng c� warning v? relations
- `tsc --noEmit` zero errors
- DB c� d? 5 tables m?i + d�ng indexes

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Relation naming conflict | Low | D�ng named relation `"HostedClassrooms"` cho Classroom ? User |
| Index missing | Low | Verify `@@index` trong schema tru?c khi migrate |

## Security Considerations

- Kh�ng c� data sensitive trong phase n�y (schema only)
- Cascade delete d� set d�ng d? tr�nh orphan records
