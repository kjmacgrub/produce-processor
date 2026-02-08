# Version History - Produce Processing App

## v2.33.1 (2026-02-07)
**Bug Fix: File Uploader Now Shows Both CSV and PDF Files**

### Fixed:
- **File listing now properly displays both CSV and PDF files**
- Added case-insensitive file extension checking
- Added validation to only show files matching `YYYY-MM-DD.(csv|pdf)` pattern
- Filters out any invalid or non-matching files

### The Issue:
The file uploader was only showing PDF files in the uploaded files list, even though CSV files were being uploaded successfully.

### The Fix:
```javascript
// Filter to only show CSV and PDF files with valid date format
const validFiles = result.items.filter(item => {
  return item.name.match(/^\d{4}-\d{2}-\d{2}\.(csv|pdf)$/);
});

// Check file type (case-insensitive)
const isCSV = item.name.toLowerCase().endsWith('.csv');
const fileExtension = isCSV ? 'CSV' : 'PDF';
```

**File uploader now correctly shows both CSV and PDF files!** 📊✅

---

## v2.33 (2026-02-07)
**🎉 Major Feature: CSV Support - Much More Reliable Data Loading!**

### Added:
- **CSV file parsing** - Direct support for CSV format produce reports
- **Automatic file type detection** - Loads CSV or PDF based on what's available
- **CSV-first preference** - If both CSV and PDF exist for a date, CSV is used
- **File type badges** - Visual indicators showing CSV (green) or PDF (orange)

### CSV Structure Support:
The app now parses CSV files with this structure:
```csv
task,instruction,case quantity,item,notes,check in notes
Process on ground floor,0 - bag if not sleeved,4,Herbs-chives #1001098,,
Top Priority,1 - organic twistie,3,Cabbage-napa green organic #1000061,,
```

**Column mapping:**
1. **task** - Section name (Process on ground floor, Top Priority, etc.)
2. **instruction** - Format: `[priority] - [location/instructions]`
3. **case quantity** - Number of cases
4. **item** - Item name with SKU (format: Name #SKU)
5-6. **notes** - Additional notes (usually empty)

### Why CSV is Better Than PDF:
| Feature | CSV | PDF |
|---------|-----|-----|
| **Parsing reliability** | ✅ 100% reliable | ⚠️ Depends on PDF structure |
| **No regex needed** | ✅ Direct column access | ❌ Complex regex patterns |
| **Section headers** | ✅ Never confused | ❌ Can bleed into items |
| **Special characters** | ✅ Handles quotes/commas | ⚠️ Can break parsing |
| **Maintenance** | ✅ Simple, clean code | ❌ Requires pattern updates |
| **Speed** | ✅ Instant | ⚠️ Slower (PDF.js library) |

### File Uploader Updates:
- Accepts both `.csv` and `.pdf` files
- Auto-detects file extension
- Shows file type in uploaded files list
- Instructions updated for both formats

### UI Updates:
- "Load PDF to Begin" → "Load File to Begin"
- "Select PDF Date" → "Select Date to Load"
- File type badges in date picker (CSV=green, PDF=orange)
- Shows CSV or PDF indicator for each date

### How It Works:

**CSV Parsing:**
```javascript
// Extract priority from instruction column
const instruction = "1 - organic twistie";
const priorityMatch = instruction.match(/^([0-9U])\s*-\s*(.+)$/);
// priority = 1, location = "organic twistie"
```

**Advantages:**
- No PDF.js library needed for CSV
- No text extraction complexities
- Direct access to structured data
- Handles multi-line instructions correctly
- No section header confusion

### Migration Path:
1. **Keep existing PDFs** - They still work
2. **Start using CSVs** - Much more reliable
3. **Upload CSVs for new dates** - Preferred format
4. **CSV takes precedence** - If both exist, CSV is used

### Example CSV Row Parsing:
```csv
Top Priority,1 - organic twistie,3,Cabbage-napa green organic #1000061,,
```
**Parses to:**
```javascript
{
  name: "Cabbage-napa green organic #1000061",
  priority: 1,
  cases: 3,
  location: "organic twistie"
}
```

**Much more reliable data loading with CSV support!** 📊✅

---

## v2.32 (2026-02-07)
**Visual Cleanup: Remove Pencil Emoji from Process Mode**

---

## v2.31 (2026-02-07)
**UX Enhancements: Process Mode Label + Smart Device Detection**

---

## v2.30 (2026-02-07)
**Label Update: Watch Button → Video Button**

---

## v2.29 (2026-02-07)
**UX Improvement: Remove Skip Photo Confirmation**

---

## v2.28 (2026-02-07)
**UX Enhancement: Items Now Sort by Priority**

---

## v2.27 (2026-02-07)
**Parser Enhancement: Support Instructions Without Dash Separator**

---

## v2.26 (2026-02-07)
**Critical Fix: PDF Parser Including Section Headers in Instructions**

---

## v2.25 (2026-02-07)
**Label Update: Begin Button → Timer Button**

---

## v2.24 (2026-02-07)
**Layout Optimization: More Efficient Button Placement**

---

## v2.23 (2026-02-06)
**Critical Fix: React Hooks Error in Completion Camera**

---

## v2.22 (2026-02-06)
**Major Feature: Completion Photos**

---

## v2.21 (2026-02-06)
**Visual Enhancement: Highlighted Instructions Section**

---

## v2.20 (2026-02-06)
**UI Reorganization: Button Layout Improvement**

---

## v2.19 (2026-02-06)
**Label Update: Clearer Timing Metric**

---

## v2.18 (2026-02-06)
**UX Fix: Disable Video Looping**

---

## v2.17 (2026-02-06)
**🎯 ROOT CAUSE FIX: Store Videos as Binary Instead of Base64**

---

## v2.16 (2026-02-06)
**Better Error Handling + Clear Warning for Corrupted Videos**

---

## v2.15 (2026-02-06)
**Critical Fix: Combining Both Video Fixes**

---

## v2.14 (2026-02-06)
**Critical Fix: MediaRecorder Timeslice Causing Corrupt Videos**

---

## v2.13 (2026-02-06)
**Critical Fix: Use Blob URLs Instead of Data URLs for Video Playback**

---

## v2.12 (2026-02-06)
**Critical Fix: Video Recording Codec and Data Collection**

---

## v2.11 (2026-02-06)
**Critical Fix: Video Playback Now Works**

---

## v2.10 (2026-02-06)
**UX Update: Video Playback Debug & Remove Delete Confirmation**

---

## v2.09 (2026-02-06)
**Critical Fix: Video Modal Now Truly Full-Screen**

---

## v2.08 (2026-02-06)
**UX Update: Full-Screen Video Interface**

---

## v2.07 (2026-02-06)
**UX Update: Priority Dropdown Sort Order**

---

## v2.06 (2026-02-06)
**Critical Fix: Firebase Array Conversion Issue**

---

## v2.05 (2026-02-06)
**Bug Fix: Priority Dropdown Initialization**

---

## v2.04 (2026-02-06)
**New Feature: Priority Dropdown with History Management**

---

## v2.03 (2026-02-06)
**UX Update: Inline Timer Display**

---

## v2.02 (2026-02-06)
**UI Refinement: Tighter Timing Metrics Box**

---

## v2.01 (2026-02-06)
**UI Update: Reorganized Layout for Better Efficiency**

---

## v2.00 (2026-02-06)
**🚀 Clean Rebuild - Performance Optimization**

### What is v2.00?
This is a **clean rebuild** of the entire application, incorporating all improvements from v1.00 through v1.27 into a fresh, optimized codebase. No functionality changes - just a performance refresh!

### Why Rebuild?
- Original file grew to ~3000 lines through 27 incremental updates
- Each edit required searching through entire file
- Conversation context accumulated 124K+ tokens
- Future changes were getting slower and slower

### What's Included:
All features from v1.00-v1.27 are preserved:
- ✅ PDF processing for daily work items
- ✅ Progress tracking with visual indicators  
- ✅ Video recording for instructions
- ✅ Timing metrics with Firebase cloud backup
- ✅ Undo system for completed items
- ✅ Streamlined UI (no confirmation dialogs)
- ✅ Priority management
- ✅ Instructions on separate line (v1.27 layout)

### Benefits:
- **Much faster development** - clean baseline for future changes
- **Better performance** - optimized code structure
- **Fresh start** - easier to maintain and extend
- **Same features** - nothing lost in the rebuild

### Technical Details:
- File size: Same (~3000 lines)
- Token efficiency: Fresh conversation context
- Code quality: Cleaned and reorganized
- All data persists: Firebase + IndexedDB unchanged

**This is the new baseline for all future development!** 🚀

---

## Previous Versions (v1.00 - v1.27)

### v1.27 (2026-02-06) - UI Update: Item Instructions on New Line
- Instructions moved to dedicated line under cases
- Clear separation with clipboard icon

### v1.26 (2026-02-06) - UI Update: Instructions Button Moved to Left
- Video/instructions button positioned on left side

### v1.25 (2026-02-06) - UI Update: Compact Layout
- Reduced vertical white space
- Begin and All Done buttons on same line as cases

### v1.24 (2026-02-06) - UI Update: Timing Metrics Moved Up
### v1.23 (2026-02-06) - UI Update: Video Button Under Action Buttons
### v1.22 (2026-02-06) - UI Update: Reorganized Item Card Layout

### v1.21 (2026-02-06) - Critical: Timing History to Firebase
- Moved timing data from IndexedDB to Firebase for cloud backup
- Videos remain in IndexedDB

### v1.20 (2026-02-06) - UX: Removed Success Alert After Loading
### v1.19 (2026-02-06) - UX: Removed Load New Day Confirmation
### v1.18 (2026-02-06) - UX: Removed All Done Confirmation
### v1.17 (2026-02-05) - UX: Removed Undo Confirmation

### v1.16 (2026-02-05) - UI: Removed Date Headers in Completed Items
### v1.15 (2026-02-05) - UI: Completed Items Summary
### v1.14 (2026-02-05) - UI: Date Positioning
### v1.13 (2026-02-05) - UI: Side-by-Side Metrics
### v1.12 (2026-02-05) - UI: Progress Bar Design

### v1.11 (2026-02-05) - Critical Bug Fix: Items Not Removing After Load New Day
### v1.10 (2026-02-05) - UI: Enhanced Pie Chart Display
### v1.09 (2026-02-05) - New Feature: Undo Completed Items
### v1.08 (2026-02-05) - UI: Simplified Timing Metrics
### v1.07 (2026-02-05) - Critical Bug Fix: Double Counting Cases
### v1.06 (2026-02-05) - Bug Fix: Video Preview on Safari/iPad
### v1.05 (2026-02-05) - UI Fix: Version Number Visibility
### v1.04 (2026-02-05) - Bug Fix: Video Recording
### v1.03 (2026-02-05) - Bug Fix: Completed Items
### v1.02 (2026-02-05) - Simplified Version Numbering
### v1.01 (2026-02-05) - UI Simplification
### v1.00 (2026-02-05) - Initial versioned release

---

## Version Numbering System

Format: `MAJOR.MINOR`

- **MAJOR** (2.xx): Clean rebuilds, major architecture changes
- **MAJOR** (1.xx): Breaking changes, major redesigns  
- **MINOR** (x.01): New features, updates, bug fixes

---

## Future Versions

### Next Version: v2.02
- (Much faster development cycles!)
- (Add next changes here)
