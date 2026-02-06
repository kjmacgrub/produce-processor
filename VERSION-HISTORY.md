# Version History - Produce Processing App

## v1.21 (2026-02-06)
**Critical Update: Timing History Moved to Firebase (Cloud Backup)**

### Changed:
- **Timing history now stored in Firebase** instead of IndexedDB
- Historical timing averages backed up to cloud
- All timing events backed up to cloud
- Videos remain stored locally on iPad (no change)

### Problem Solved:
**Before v1.21:**
- Timing history stored only on iPad
- If iPad breaks/lost/reset → **All timing data lost forever** ❌
- Weeks or months of performance data could disappear

**After v1.21:**
- Timing history stored in Firebase cloud
- iPad breaks? → Get new iPad, open app, **all history restored** ✅
- Multi-device sync (all iPads see same averages)
- Automatic backup

### What's Backed Up:
✅ **Historical timing averages** (per SKU/product)
✅ **All timing events** (complete history)
✅ **Syncs across devices** in real-time

### What Stays Local:
📹 **Videos** (too large for Firebase, stay on iPad)

### Migration:
- **Automatic!** First time you open v1.21:
  1. App detects existing timing data in IndexedDB
  2. Copies all data to Firebase
  3. Marks migration complete
  4. Future updates save directly to Firebase

### Data Safety:
- ✅ Timing data backed up forever in cloud
- ✅ Restore to new device anytime
- ✅ No cost impact (timing data is tiny)
- ✅ All iPads stay in sync

### Technical Details:
**Firebase Structure:**
```
/historicalTimes
  ├── bananas-1234: 33  (avg seconds per case)
  ├── apples-5678: 45
  └── ...

/timingEvents
  ├── bananas-1234: [{date, cases, time}, ...]
  ├── apples-5678: [{date, cases, time}, ...]
  └── ...
```

---

## v1.20 (2026-02-06)
**UX Update: Removed Success Alert After Loading**

### Changed:
- Removed "Successfully loaded X items from PDF!" alert

---

## v1.19 (2026-02-06)
**UX Update: Removed Load New Day Confirmation**

---

## v1.18 (2026-02-06)
**UX Update: Removed All Done Confirmation**

---

## v1.17 (2026-02-05)
**UX Update: Removed Undo Confirmation**

---

## v1.16 (2026-02-05)
**UI Update: Removed Date Headers in Completed Items**

---

## v1.15 (2026-02-05)
**UI Update: Completed Items Summary**

---

## v1.14 (2026-02-05)
**UI Update: Date Positioning**

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

### Next Version: v1.22
- (To be filled with next changes)
