# Version History - Produce Processing App

## v1.12 (2026-02-05)
**UI Update: Progress Bar Design**

### Changed:
- Replaced circular pie chart with horizontal progress bar
- Bar fills from left to right showing completion percentage
- Moved remaining metrics below the bar
- Made remaining text and numbers significantly larger
- Cleaner, more modern look

### Before (Pie Chart):
```
    ╭─────────╮
   ╱  50 cases ╲
  │   5 items   │
   ╲           ╱
    ╰─────────╯
```

### After (Progress Bar):
```
┌────────────────────────┐
│████████░░░░░░░░░░░░░░░░│ (40% complete)
└────────────────────────┘

      REMAINING
         50
       cases
      5 items
```

### Visual Changes:
- Progress bar: 40px tall, rounded, gradient green fill
- "Remaining" label: 1.5rem, uppercase
- Cases number: 3.5rem, bold green
- "cases" text: 1.8rem
- Items count: 2rem

### Impact:
- Easier to read at a glance
- Better use of horizontal space
- Larger text more visible on iPad
- Modern, clean design

---

## v1.11 (2026-02-05)
**Critical Bug Fix: Items Not Removing After Load New Day**

### Fixed:
- "All Done" button not removing items from active list after loading new day
- Changed data loading to save items as object instead of array

---

## v1.10 (2026-02-05)
**UI Update: Enhanced Pie Chart Display**

### Changed:
- Pie chart showed both cases AND items remaining

---

## v1.09 (2026-02-05)
**New Feature: Undo Completed Items**

---

## v1.08 (2026-02-05)
**UI Update: Simplified Timing Metrics**

---

## v1.07 (2026-02-05)
**Critical Bug Fix: Double Counting Cases**

---

## v1.06 (2026-02-05)
**Bug Fix: Video Preview on Safari/iPad**

---

## v1.05 (2026-02-05)
**UI Fix: Version Number Visibility**

---

## v1.04 (2026-02-05)
**Bug Fix: Video Recording**

---

## v1.03 (2026-02-05)
**Bug Fix: Completed Items**

---

## v1.02 (2026-02-05)
**Simplified Version Numbering**

---

## v1.01 (2026-02-05)
**UI Simplification**

---

## v1.00 (2026-02-05)
**Initial versioned release**

---

## Version Numbering System

Format: `MAJOR.MINOR`

- **MAJOR** (1.xx): Breaking changes, major redesigns
- **MINOR** (x.01): New features, updates, bug fixes

---

## Future Versions

### Next Version: v1.13
- (To be filled with next changes)
