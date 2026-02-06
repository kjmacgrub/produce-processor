# Version History - Produce Processing App

## v1.11 (2026-02-05)
**Critical Bug Fix: Items Not Removing After Load New Day**

### Fixed:
- "All Done" button not removing items from active list after loading new day
- Items would move to completed but stay in active list until page refresh
- Firebase data structure mismatch causing state sync issues

### The Problem:
When loading new data from PDF:
1. Items were saved to Firebase as an ARRAY: `[{id: "item-1",...}, {id: "item-2",...}]`
2. When marking complete, code tried to remove by ID: `items/item-1`
3. But Firebase stores arrays with numeric keys: `items/0`, `items/1`, etc.
4. So the remove command failed silently
5. Item stayed in active list until page refresh forced proper sync

### The Solution:
- Changed data loading to save items as OBJECT with IDs as keys
- Format: `{item-1: {...}, item-2: {...}}` instead of array
- Now `items/item-1` path exists and can be removed
- Removed manual state updates after loading (let Firebase listeners handle it)
- Added else clause to items listener to handle empty state

### Technical Changes:
```javascript
// Before (BROKEN):
await db.ref('items').set([...itemsArray]);  // Array

// After (FIXED):
const itemsObject = {};
items.forEach(item => itemsObject[item.id] = item);
await db.ref('items').set(itemsObject);  // Object
```

### Impact:
- "All Done" now works immediately after loading new day
- No page refresh needed
- Consistent behavior throughout the day

---

## v1.10 (2026-02-05)
**UI Update: Enhanced Pie Chart Display**

### Changed:
- Pie chart now shows both cases AND items remaining
- More informative at a glance

---

## v1.09 (2026-02-05)
**New Feature: Undo Completed Items**

### Added:
- "Undo" button on each completed item
- Allows moving items back to active list

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

### Next Version: v1.12
- (To be filled with next changes)
