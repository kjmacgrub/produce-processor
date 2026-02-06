# Version History - Produce Processing App

## v1.16 (2026-02-05)
**UI Update: Removed Date Headers in Completed Items**

### Changed:
- Removed date section headers in completed items list
- Previously items were grouped by date with headers
- Now just a simple list of completed items
- All items will be from same day, so date headers were redundant

### Before:
```
Completed Items
50 cases completed of 100 total cases

  2/5/2026          ← Date header
  ✓ Bananas #1234
  ✓ Apples #5678
```

### After:
```
Completed Items
50 cases completed of 100 total cases

  ✓ Bananas #1234   ← No date header
  ✓ Apples #5678
```

### Impact:
- Cleaner look
- Less clutter
- Simpler code (removed date grouping logic)
- Since all processing is same-day, date headers weren't needed

---

## v1.15 (2026-02-05)
**UI Update: Completed Items Summary**

### Changed:
- Completed items summary now shows cases out of total cases
- Previously showed "cases completed of X items"

---

## v1.14 (2026-02-05)
**UI Update: Date Positioning**

### Changed:
- Moved date display above "Produce Processing" title

---

## v1.13 (2026-02-05)
**UI Update: Side-by-Side Metrics**

---

## v1.12 (2026-02-05)
**UI Update: Progress Bar Design**

---

## v1.11 (2026-02-05)
**Critical Bug Fix: Items Not Removing After Load New Day**

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

### Next Version: v1.17
- (To be filled with next changes)
