# Version History - Produce Processing App

## v1.13 (2026-02-05)
**UI Update: Side-by-Side Metrics**

### Changed:
- Cases and items now display side by side instead of stacked
- Saves vertical space
- Both numbers same size (3.5rem) for consistency
- Labels below each number

### Before (Stacked):
```
      REMAINING
         50
       cases
      5 items
```

### After (Side by Side):
```
      REMAINING
   50        5
  cases    items
```

### Layout:
- "REMAINING" label at top (centered)
- Two columns below:
  - Left: Cases number + "cases" label
  - Right: Items number + "items" label
- 3rem gap between columns
- Flexbox with wrap for mobile responsiveness

### Impact:
- Saves ~50px of vertical space
- More compact, efficient layout
- Both metrics equally prominent

---

## v1.12 (2026-02-05)
**UI Update: Progress Bar Design**

### Changed:
- Replaced circular pie chart with horizontal progress bar
- Bar fills from left to right showing completion percentage
- Made remaining text and numbers significantly larger

---

## v1.11 (2026-02-05)
**Critical Bug Fix: Items Not Removing After Load New Day**

### Fixed:
- "All Done" button not removing items from active list after loading new day

---

## v1.10 (2026-02-05)
**UI Update: Enhanced Pie Chart Display**

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

### Next Version: v1.14
- (To be filled with next changes)
