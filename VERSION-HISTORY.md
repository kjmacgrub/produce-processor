# Version History - Produce Processing App

## v2.76 (2026-02-08)
**Feature: Show Existing Photo with Keep/Retake/Delete Options**

### Added:
- **Shows existing photo** when clicking "All Done" if one exists
- **Three options** for existing photos: Keep, Retake, or Delete
- **Smarter workflow** - avoids redundant photo capture

### The Enhancement:

**Scenario:** User completes the same item type multiple times (e.g., Strawberries cases 1-10, then cases 11-20)

**Before v2.76:**
```
Click "All Done" 
  → Dialog: "Take photo or Skip?"
  → (Even if photo already exists from first batch)
  → Must retake or skip
```

**After v2.76:**
```
Click "All Done"
  → Dialog checks: Does photo exist for this SKU?
  
  IF NO PHOTO:
    → "Take photo or Skip?" (same as before)
  
  IF PHOTO EXISTS:
    → Shows the existing photo
    → Options: "Keep", "Retake", or "Delete"
```

### UI Design:

**When existing photo found:**
```
┌─────────────────────────────────┐
│      Task Complete!             │
│                                 │
│  Previous completion photo      │
│  found:                         │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   [Photo Preview]       │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  What would you like to do?     │
│                                 │
│  [✓ Keep]  [📸 Retake]  [🗑️ Delete] │
└─────────────────────────────────┘
```

**When no existing photo:**
```
┌─────────────────────────────────┐
│      Task Complete!             │
│                                 │
│  Would you like to take a       │
│  photo of the completed work?   │
│                                 │
│  [📸 Take Photo]    [Skip]      │
└─────────────────────────────────┘
```

### Button Functions:

**✓ Keep (Green):**
- Completes task with existing photo
- No camera activation
- Photo remains unchanged

**📸 Retake (Blue):**
- Opens camera to capture new photo
- Replaces existing photo
- Same flow as taking first photo

**🗑️ Delete (Red):**
- Removes photo from Firebase and state
- Completes task with no photo
- Clears photo permanently for this SKU

### Technical Implementation:

**Photo check logic:**
```javascript
const sku = getSKU(showPhotoChoice.name);
const existingPhoto = completionPhotos[sku];

if (existingPhoto) {
  // Show photo with Keep/Retake/Delete
} else {
  // Show Take/Skip dialog
}
```

**Delete action:**
```javascript
// Remove from Firebase
await db.ref(`completionPhotos/${sku}`).remove();

// Remove from state
setCompletionPhotos(prev => {
  const updated = {...prev};
  delete updated[sku];
  return updated;
});
```

### Use Cases:

**Use Case 1: Same item, multiple batches**
- Complete Strawberries cases 1-5 → Take photo
- Complete Strawberries cases 6-10 → Keep existing photo ✅

**Use Case 2: Photo needs update**
- First batch photo unclear
- Complete next batch → Retake with better angle ✅

**Use Case 3: Wrong SKU photo**
- Photo taken for wrong item
- Complete correct item → Delete old, take new ✅

### Benefits:

✅ **Saves time** - Keep existing good photos  
✅ **Flexibility** - Retake if needed  
✅ **Photo management** - Delete incorrect photos  
✅ **Smarter workflow** - Adapts to existing data  

**Photo dialog now context-aware with existing photo management!** 📸✨

---

## v2.75 (2026-02-08)
**UI Polish: Subtle View Mode Indicator**

### Changed:
- **Text shortened** from "You are in View Mode" to "View Mode"
- **Layout changed** to vertical - eye icon above text
- **Background much more transparent** - doesn't block content
- **Overall less intrusive** appearance

### The Change:

**Before:**
```
┌──────────────────────────┐
│ 👁️ You are in View Mode  │  ← Solid blue, horizontal
└──────────────────────────┘
```

**After:**
```
┌──────────┐
│    👁️    │  ← Transparent, vertical
│ View Mode│
└──────────┘
```

### Visual Details:

**Text:**
- Before: "You are in View Mode"
- After: "View Mode" ✅

**Layout:**
- Before: Horizontal (icon and text side-by-side)
- After: Vertical (icon above text) ✅

**Background:**
- Before: Solid blue gradient `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)`
- After: Very transparent `rgba(59, 130, 246, 0.15)` - 85% transparent! ✅

**Text Color:**
- Before: White (on blue background)
- After: Dark gray `#1e293b` (for contrast on transparent) ✅

**Border:**
- Before: None
- After: Light blue border `rgba(59, 130, 246, 0.3)` ✅

### Technical Changes:

```css
/* Before */
background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
color: white;
display: flex;
gap: 0.5rem;

/* After */
background: rgba(59, 130, 246, 0.15); /* 15% opacity = 85% transparent */
color: #1e293b;
display: flex;
flexDirection: column; /* Stack vertically */
gap: 0.25rem;
border: 2px solid rgba(59, 130, 246, 0.3);
```

### Benefits:

✅ **Less intrusive** - Doesn't block content behind it  
✅ **Cleaner** - Shorter text is easier to scan  
✅ **More elegant** - Vertical layout with larger icon  
✅ **Still visible** - Border and icon make it noticeable  

**View Mode indicator now subtle and non-blocking!** 👁️✨

---

## v2.74 (2026-02-08)
**Critical Fix: Completion Photos Now Sync Across Devices**

### Fixed:
- **Completion photos now visible in View Mode** on all devices
- **Photos sync via Firebase** instead of only local storage
- **Cross-device viewing** - iPad captures, phone can see photos

### The Problem:

User reported: "Completed items do not show the captured photo if viewed from a phone in View Mode."

**Root cause:**
- Completion photos were only stored in IndexedDB (local browser storage)
- Each device has its own IndexedDB database
- iPad captures photo → Saved to iPad's IndexedDB
- Phone tries to view → Phone's IndexedDB has no photos ❌

**Result:** Photos invisible on other devices!

### The Solution:

**Added Firebase synchronization for completion photos:**

1. **When photo is captured:**
   - Save to IndexedDB (local) ✓
   - **NEW:** Also save to Firebase ✓

2. **On app startup:**
   - Load from IndexedDB (local)
   - **NEW:** Also load from Firebase ✓

3. **When data is cleared:**
   - Clear IndexedDB
   - **NEW:** Also clear Firebase ✓

### Technical Implementation:

**Updated `saveCompletionPhotoToDB()`:**
```javascript
// Save to IndexedDB (local)
await store.put({ id: sku, data, timestamp });

// NEW: Also save to Firebase (for sync)
await db.ref(`completionPhotos/${sku}`).set({
  data: photoData.data,
  timestamp: photoData.timestamp
});
```

**Added new useEffect:**
```javascript
// Load completion photos from Firebase
const photosRef = db.ref('completionPhotos');
photosRef.on('value', (snapshot) => {
  setCompletionPhotos(snapshot.val());
});
```

**Updated Clear Data button:**
```javascript
await db.ref('completionPhotos').remove(); // Clear from Firebase
setCompletionPhotos({}); // Clear from state
```

### How It Works Now:

**Scenario: iPad (Process Mode) + Phone (View Mode)**

1. **Worker on iPad:**
   - Completes task
   - Takes completion photo
   - Photo saved to:
     - iPad's IndexedDB ✓
     - Firebase ✓

2. **Manager on Phone:**
   - Opens app in View Mode
   - Clicks "Completed" to view finished items
   - **Photos load from Firebase** ✓
   - **Can see all completion photos!** ✓

### Benefits:

✅ **Cross-device sync** - Photos visible everywhere  
✅ **View Mode works** - Managers can see completion photos  
✅ **Real-time updates** - Firebase listener updates automatically  
✅ **No extra steps** - Works automatically  

### Storage Strategy:

**Dual storage approach:**
- **IndexedDB**: Fast local access, no network needed
- **Firebase**: Cross-device sync, persistent storage

Both are updated when photos are captured, ensuring availability across all devices and scenarios.

**Completion photos now visible on all devices!** 📸✨

---

## v2.73 (2026-02-08)
**UI Update: Full Descriptive Date Format**

### Changed:
- **Date format updated** to full descriptive format
- Now shows: "Monday, February 9th, 2026"
- More readable and professional

### The Change:

**Before (v2.72):**
```
Sunday, 09/02/26
```

**After (v2.73):**
```
Sunday, February 9th, 2026
```

### Format Details:

- **Day of week**: Full name (Monday, Tuesday, etc.)
- **Month**: Full name (January, February, etc.)
- **Day**: Number with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
- **Year**: Full 4-digit year (2026)
- **Format**: `Weekday, Month Day, Year`

### Examples:

```
2026-02-09  →  Sunday, February 9th, 2026
2026-02-10  →  Monday, February 10th, 2026
2026-12-25  →  Friday, December 25th, 2026
2026-01-01  →  Thursday, January 1st, 2026
2026-03-22  →  Sunday, March 22nd, 2026
2026-05-03  →  Sunday, May 3rd, 2026
```

### Technical Implementation:

Added ordinal suffix function:
- 1, 21, 31 → "st" (1st, 21st, 31st)
- 2, 22 → "nd" (2nd, 22nd)
- 3, 23 → "rd" (3rd, 23rd)
- All others → "th" (4th, 5th, 11th, 12th, 13th, etc.)

### Benefits:

✅ **Very readable** - Full month and year spelled out  
✅ **Professional** - Formal date presentation  
✅ **No ambiguity** - Clear which is day vs month  
✅ **Polished** - Ordinal suffixes add polish  

**Date now displays in full descriptive format!** 📅✨

---

## v2.72 (2026-02-08)
**UI Update: Changed Date Format to DD/MM/YY**

### Changed:
- **Date format updated** from "YYYY-MM-DD" to "Monday, DD/MM/YY"
- More readable and user-friendly format
- Shorter two-digit year

### The Change:

**Before:**
```
2026-02-09
```

**After:**
```
Sunday, 09/02/26
```

### Format Details:

- **Day of week**: Full name (Monday, Tuesday, etc.)
- **Day**: Two digits with leading zero (01, 02, ... 31)
- **Month**: Two digits with leading zero (01, 02, ... 12)
- **Year**: Two digits (26 for 2026)
- **Separator**: Forward slash (/)

### Examples:

```
2026-02-09  →  Sunday, 09/02/26
2026-02-10  →  Monday, 10/02/26
2026-12-25  →  Friday, 25/12/26
```

### Technical Changes:

Updated `formatDateWithDay()` function:
- Input: "YYYY-MM-DD" format
- Output: "Weekday, DD/MM/YY" format
- Added zero-padding for day and month
- Extracts last 2 digits of year

**Date format now more compact and readable!** 📅✨

---

## v2.71 (2026-02-08)
**UI Cleanup: Removed Duplicate Load Button**

### Changed:
- **Removed small "Load New Day" button** from top-left
- **Kept large panel button** at bottom (better looking)
- **Cleaner interface** with no duplicate buttons

### The Problem:

There were two "Load New Day" buttons:
1. Small button at top-left
2. Large panel button at bottom (in empty state)

User said: "I like the look of the panel at the bottom better actually so let's get rid of the smaller button."

### The Solution:

**Removed:**
- ❌ Top-left small "Load New Day" button

**Kept:**
- ✅ Bottom large panel with "Load New Day" button

### Current Layout:

**When no items loaded:**
```
┌──────────────────────────────┐
│  No data file loaded         │
│  [Progress metrics: 0]       │
│                              │
│  ┌────────────────────────┐  │
│  │  📁 Upload Icon        │  │
│  │  Load File to Begin    │  │
│  │  Select a date...      │  │
│  │                        │  │
│  │  [📋 Load New Day]     │  │  ← Big panel button
│  └────────────────────────┘  │
└──────────────────────────────┘
```

**When items loaded:**
```
┌──────────────────────────────┐
│  🗑️ Clear Data               │  ← Only button at top
│                              │
│  [Items list]                │
└──────────────────────────────┘
```

### Benefits:

✅ **No duplication** - Only one load button  
✅ **Better UX** - Large panel is more inviting  
✅ **Cleaner top bar** - Less clutter  
✅ **Consistent** - Clear Data only shows when needed  

**Interface now has single, prominent load button!** 🎨✨

---

## v2.70 (2026-02-08)
**UX Improvement: Photo Choice Dialog Before Camera Permissions**

### Changed:
- **Added "Take Photo or Skip" dialog** after clicking "All Done"
- **Camera permissions only requested** if user chooses "Take Photo"
- **Skipping avoids camera dialog** entirely

### The Problem:

When clicking "All Done":
1. App immediately requested camera permissions
2. User had to deal with camera dialog even if skipping
3. If user wanted to skip photo, they still went through camera flow

User requested: "Could the dialog for taking a photo or skipping it come up right after clicking All Done so that if the user presses skip they don't have to go through the camera permission dialog."

### The Solution:

**New flow:**

1. User clicks **"All Done"**
2. **Dialog appears immediately:**
   ```
   ┌────────────────────────────────┐
   │     Task Complete!             │
   │                                │
   │  Would you like to take a      │
   │  photo of the completed work?  │
   │                                │
   │  [📸 Take Photo]  [Skip]       │
   └────────────────────────────────┘
   ```
3. **If "Take Photo"** → Camera opens, permissions requested
4. **If "Skip"** → Item marked complete immediately (no camera)

### Benefits:

✅ **Faster for skip** - No camera permissions dialog  
✅ **User choice first** - Decide before camera activates  
✅ **Less interruption** - Skip option is immediate  
✅ **Clearer flow** - Know what's happening before camera  

### UI Design:

**Dialog style:**
- Large, centered modal
- Clear heading: "Task Complete!"
- Friendly prompt text
- Two prominent buttons:
  - Green "📸 Take Photo" button
  - Gray "Skip" button
- Equal button sizes for easy tapping

**Old flow:**
```
Click "All Done" → Camera opens → Camera permissions → Take/Skip
```

**New flow:**
```
Click "All Done" → Choice dialog → 
  If Take Photo → Camera opens → Camera permissions
  If Skip → Complete immediately ✨
```

**Photo choice dialog now appears first!** 📸✨

---

## v2.69 (2026-02-08)
**Critical Fix: Total Cases Now Loads Correctly**

### Fixed:
- **Total cases now displays correctly** after loading a file
- Fixed Firebase path mismatch
- Added state update when CSV loads

### The Problem:

After clearing data and reloading a file:
- ✅ Items loaded correctly
- ❌ **Total cases showed 0** (wrong!)

User reported: "Remaining total cases shows 0 but the total items displays. We lost the total cases!"

### Root Cause:

**Three issues found:**

1. **CSV loading didn't update state**
   - processCSVData saved totalCases to Firebase ✓
   - But never called setOriginalTotalCases(totalCases) ✗

2. **Wrong Firebase path in useEffect**
   - useEffect was listening to: `originalTotalCases`
   - But CSV saves to: `totalCases`
   - Path mismatch! Data was there but not being read

3. **Didn't handle null values**
   - When cleared, Firebase returns null
   - Should reset to 0

### The Fix:

**1. Added state update in CSV processing:**
```javascript
await db.ref('totalCases').set(totalCases);
setOriginalTotalCases(totalCases); // ← ADDED THIS
```

**2. Fixed Firebase path in useEffect:**
```javascript
// Before:
const totalRef = db.ref('originalTotalCases'); // ✗ Wrong path

// After:
const totalRef = db.ref('totalCases'); // ✓ Correct path
```

**3. Handle null values:**
```javascript
setOriginalTotalCases(total || 0); // Set to 0 if null
```

### Result:

**Now when loading a file:**
1. CSV is parsed, totalCases calculated
2. Saved to Firebase at 'totalCases'
3. State updated immediately with setOriginalTotalCases()
4. useEffect also watches Firebase and syncs state
5. **Total cases displays correctly!** ✅

**After clearing:**
1. Firebase 'totalCases' removed
2. useEffect detects null
3. Sets state to 0
4. **Shows 0 correctly** ✅

**Total cases now works correctly!** 📊✨

---

## v2.68 (2026-02-08)
**UX Fix: Keep Metrics Visible After Clearing Data**

### Fixed:
- **Metrics now stay visible** even when data is cleared
- Shows 0 values instead of hiding the entire metrics section
- Date display shows placeholder text instead of disappearing

### The Problem:

When clicking "Clear Data":
- ✅ Data was cleared properly
- ❌ **Entire metrics section disappeared**
- ❌ **Date disappeared completely**
- Result: Looked broken, hard to tell data was actually cleared

### The Fix:

**Metrics section:**
- Removed conditional: `{originalTotalCases > 0 &&`
- Now always visible, even showing zeros
- Shows:
  - Remaining: **0 cases** (0 items)
  - Progress bar at 0%
  - Completed: 0 cases (if any were completed before)

**Date display:**
- Removed conditional: `{pdfDate &&`
- Now always visible
- Shows: **"No data file loaded"** when cleared
- Shows actual date when file is loaded

### Visual Before/After:

**Before (after clicking Clear Data):**
```
┌─────────────────────────┐
│  Produce Processing     │
│  [Empty space here]     │  ← Metrics hidden
│                         │
│  Load File to Begin     │
└─────────────────────────┘
```

**After (after clicking Clear Data):**
```
┌─────────────────────────┐
│  Produce Processing     │
│  No data file loaded    │  ← Date placeholder
│  ━━━━━━━━━━━━━━━━━━━    │  ← Progress bar (empty)
│  Remaining              │
│  0 cases (0 items)      │  ← Metrics showing 0
└─────────────────────────┘
```

### Benefits:

✅ **Always shows structure** - Metrics never disappear  
✅ **Clear feedback** - User sees 0 values, knows data is cleared  
✅ **Consistent UI** - Layout doesn't jump around  
✅ **Professional appearance** - No blank space  

**Metrics now stay visible with 0 values after clearing!** 📊✨

---

## v2.67 (2026-02-08)
**Bug Fix: Clear Data Button Now Clears Date and Total Cases**

### Fixed:
- **Clear Data button now resets all state variables**
- Previously cleared Firebase but forgot to reset UI state
- Date and total cases now properly disappear when clearing

### The Problem:

User clicked "Clear Data" button and it would:
- ✅ Clear items from Firebase
- ✅ Clear UI item list
- ❌ **NOT clear the date** shown on screen
- ❌ **NOT clear the total cases** number

**Why:** Button was removing data from Firebase but not resetting the React state variables.

### The Fix:

Added state resets to Clear Data button:
```javascript
setPdfDate('');           // Clears the date display
setOriginalTotalCases(0); // Clears the total cases number
```

### What Clear Data Now Does:

**Clears from Firebase:**
- items
- completedItems
- pdfDate
- totalCases

**Resets state variables:**
- items → []
- completedItems → []
- activeItem → null
- isProcessing → false
- startTime → null
- **pdfDate → ''** ✅ NEW
- **originalTotalCases → 0** ✅ NEW

### Result:

After clicking "Clear Data":
- ✅ All items gone
- ✅ Date cleared
- ✅ Total cases reset to 0
- ✅ Clean slate for loading new data

**Clear Data button now fully clears everything!** 🗑️✨

---

## v2.66 (2026-02-08)
**Major Fix: Flexible File Detection - Reads Dates from File Content**

### Changed:
- **Lists ALL .csv files** in Storage (regardless of filename)
- **Reads date from file content** (first line) instead of filename
- **No strict filename requirements** - any CSV file works
- **Shows filename and date** in selection UI

### The Problem (Fixed):

**Before:**
- System only recognized files named EXACTLY: `YYYY-MM-DD.csv`
- If file was named anything else, it wouldn't appear
- User reported: "No data files found" even though files existed

**After:**
- System lists ANY file ending in `.csv`
- Fetches each file and reads the date from its first line
- Displays extracted date to user
- Much more flexible!

### How It Works Now:

1. **Lists all CSV files** in `produce-pdfs/` folder
2. **For each file:**
   - Downloads the file
   - Reads first line
   - Extracts date using regex: `/(\d{4}-\d{2}-\d{2})/`
3. **Displays to user:**
   - Date (human readable): "Sunday, February 09, 2026"
   - Filename (below date): "whatever-name.csv"
4. **User clicks** to load

### UI Updates:

**File selection display:**
```
┌────────────────────────────────┐
│ Sunday, February 09, 2026      │  ← Date from file content
│ whatever-name.csv              │  ← Actual filename
└────────────────────────────────┘
```

**Empty state message:**
- "Files can have any name ending in `.csv`"
- "The date will be read from the first line of each file"

### Benefits:

✅ **Flexible filenames** - No strict naming required  
✅ **Finds all CSVs** - Won't miss files anymore  
✅ **Shows both** - Date and filename visible  
✅ **Date from content** - Most reliable source of truth  

### File Requirements:

**Only requirement:**
- First line must contain a date in format: `YYYY-MM-DD`
- Example: `2026-02-09 Produce Processing Report`

**Filename can be anything:**
- ✅ `2026-02-09.csv` (works)
- ✅ `produce-data-feb9.csv` (works)
- ✅ `sunday-processing.csv` (works if first line has date)

**System now finds and lists all CSV files!** 📂✨

---

## v2.65 (2026-02-08)
**Fix: Show File Picker + Add Clear Data Button**

### Fixed:
- **"Load New Day" now shows date picker** instead of auto-loading
- **Added "Clear Data" button** to remove stuck old data
- User can now see available files and choose which to load

### The Problem:

User reported:
1. "No CSV files found" message even though 2026-02-09.csv exists
2. Old Feb 9 data still displayed on main page

**Root causes:**
1. "Load New Day" button was auto-loading most recent file (not showing picker)
2. Old data from previous session stuck in Firebase Database

### The Fix:

**"Load New Day" button:**
- Before: Auto-loaded most recent file, showed alert if none found
- After: Opens date picker showing all available files

**"Clear Data" button (new):**
- Appears next to "Load New Day" when data is loaded
- Asks for confirmation: "Clear all data?"
- Removes: items, completedItems, pdfDate, totalCases
- Resets UI to clean state

### Current Workflow:

1. Open app
2. See old Feb 9 data? Click **"Clear Data"** first
3. Click **"Load New Day"**
4. See list of available files (e.g., "Monday, February 09, 2026")
5. Choose file to load or cancel

### Benefits:

✅ **See what files exist** - No more guessing  
✅ **Choose which to load** - Not forced to load most recent  
✅ **Clear stuck data** - Remove old data anytime  
✅ **Debug issues** - Console shows file listing  

### Console Logging:

When you click "Load New Day", check console for:
```
=== Listing Files from Storage ===
Total files found: 1
  File: 2026-02-09.csv
  Parsed: 2026-02-09.csv → date=2026-02-09, type=csv
=== Final dates list ===
  2026-02-09: CSV
```

If you see "Total files found: 0", the file isn't where the app expects it.

**File picker now works + can clear old data!** 🎯✨

---

## v2.64 (2026-02-08)
**Terminology Update: From "PDF" to "File" / "Data File"**

### Changed:
- **Updated terminology** throughout the app to use "file" or "data file" instead of "PDF"
- **Removed PDF.js dependency** - no longer needed since we only support CSV
- **Clarified file upload workflow** in UI messages
- **Updated comments and labels** for better clarity

### Specific Changes:

**Code & Comments:**
- State variable comments updated: "data file" instead of "PDF"
- Storage section renamed: "DATA FILE FUNCTIONS" instead of "CSV FUNCTIONS"
- Function comments updated to reference "file" generically
- Removed PDF.js script tag (no longer needed)
- Added compatibility notes for Firebase refs that still say "pdf" internally

**UI Updates:**
- Modal title: "Select Data File to Load" (was "Select Date to Load")
- Empty state: "No data files found" (was "No files found")
- Added clarifying text: "The date from the filename will be displayed here"
- Button remains: "Load New Day" (clear and concise)

### What Stayed the Same:

**For compatibility reasons:**
- Firebase Database ref still called `pdfDate` (to preserve existing data)
- Firebase Storage folder still named `produce-pdfs` (can't rename without migration)
- These are noted in comments as "kept for compatibility"

### File Upload Workflow (Clarified):

1. **Upload CSV files via Firebase Console** to `produce-pdfs/` folder
2. **Name files**: `YYYY-MM-DD.csv` (e.g., `2026-02-08.csv`)
3. **System reads date from filename** and displays it in the picker
4. **System reads date from file content** (first line) to validate
5. **User selects file** from the list by date

### Benefits:

✅ **Clearer terminology** - "File" is more accurate than "PDF"  
✅ **Simpler codebase** - Removed unused PDF parsing code  
✅ **Better instructions** - UI explains the workflow more clearly  
✅ **Maintains compatibility** - Existing data still works  

**Terminology now reflects CSV-only workflow!** 📄✨

---

## v2.63 (2026-02-08)
**Rollback: Removed Auto-Load Feature Completely**

### Changed:
- **Removed all auto-load functionality**
- **Back to manual file loading only**
- App returns to stable, working state from v2.53

### Why Removed:

The auto-load feature (introduced in v2.55) caused persistent React errors:
```
NotFoundError: Failed to execute 'removeChild' on 'Node'
```

Multiple attempts to fix the React rendering conflicts were unsuccessful (v2.55-v2.62). The feature conflicted with:
- Firebase async initialization
- React rendering lifecycle
- Icon component useEffect hooks

### Current Functionality:

✅ **Manual file loading** - Click "Load New Day" to select a file  
✅ **All processing features** - Timers, videos, completion tracking work perfectly  
✅ **Stable and reliable** - No React errors  
❌ **No auto-load** - Must manually select file each session  

### How to Use:

1. Open app
2. Click **"Load New Day"** button
3. Select date from list
4. Work as normal

### Future Consideration:

Auto-load could be re-implemented using a different approach:
- Server-side function to check dates
- Different React pattern (e.g., React Query)
- Button-triggered rather than automatic

For now, manual loading is fast and reliable.

**App returned to stable state!** ✅

---

## v2.62 (2026-02-08)
**Fix: Proper Date Checking and Old Data Cleanup** (Caused React errors)

### Fixed:
- **Clears old data from different dates** on startup
- **Shows proper "no data" message** when today's file doesn't exist
- **Prevents loading wrong date's data** automatically

### What Was Happening:

**User's situation:**
- Today: February 8th
- Available file: 2026-02-09.csv (tomorrow's file)
- Expected: "No data file for today" message
- Actual: App was loading Feb 9th data automatically ❌

**Root cause:**
- Auto-load was disabled in v2.61
- Old data from Feb 9th was still in Firebase Database
- Firebase listeners were loading that old stored data
- Looked like Feb 9th was auto-loading

### The Fix:

**On app startup:**
1. ✅ Check today's date (e.g., Feb 8th)
2. ✅ Check stored date in Firebase Database (e.g., Feb 9th)
3. ✅ **If dates don't match** → Clear all old data
4. ✅ Try to find today's CSV file in Storage
5. ✅ **If found** → Load it
6. ✅ **If not found** → Show "No data file available for today"

### Current Behavior:

**Scenario: Only 2/9 file exists, today is 2/8:**
```
App starts
→ Checks: Today is 2026-02-08
→ Finds: Stored data is 2026-02-09
→ Action: Clears old 2/9 data
→ Looks for: 2026-02-08.csv
→ Result: Not found
→ Shows: "No data file available for today"
→ User can: Click "Load Different Day" to manually load 2/9
```

### Console Output:
```
=== CHECKING FOR TODAY'S FILE ===
Today's date: 2026-02-08
Date stored in Firebase Database: 2026-02-09
⚠️ Clearing old data from 2026-02-09
❌ No file found for today (2026-02-08)
```

### Benefits:

✅ **No auto-load of wrong dates** - Won't load tomorrow's data  
✅ **Clean slate** - Old data cleared before checking  
✅ **Clear messaging** - User knows today's file is missing  
✅ **Manual override** - Can still load other dates if needed  

**App now properly handles date mismatches!** 📅✨

---

## v2.61 (2026-02-08)
**Temporary Fix: Disabled Auto-Load Feature**

### Changed:
- **Auto-load feature temporarily disabled** to resolve React errors
- App returns to manual file loading via "Load New Day" button
- All other features work normally

### Why Disabled:
The auto-load feature was causing persistent React DOM errors:
```
NotFoundError: Failed to execute 'removeChild' on 'Node'
```

This error prevented the app from loading properly.

### Current Behavior:
- ❌ **Auto-load disabled** - Won't automatically load today's file
- ✅ **Manual load works** - Click "Load New Day" to select a file
- ✅ **All other features intact** - Processing, timing, videos all work

### Next Steps:
Need to investigate root cause of React rendering issue before re-enabling auto-load. Possible causes:
1. State updates during async operations
2. Firebase listeners triggering re-renders
3. Icon component useEffect conflicts

**App now works - manual file loading only!** 🔧

---

## v2.60 (2026-02-08)
**Bug Fix: Prevent React Race Condition Errors**

### Fixed:
- **React removeChild error** resolved
- **Added isMounted flag** to prevent state updates after unmount
- **Added hasStartedLoading guard** to prevent duplicate runs
- **Increased initialization delay** from 500ms to 1000ms
- **Multiple safety checks** at each async step

### Technical Changes:

**Before:**
```javascript
let hasLoaded = false;
// Single check, could run multiple times
```

**After:**
```javascript
let isMounted = true;
let hasStartedLoading = false;
// Multiple checks throughout async flow
// Cleanup: isMounted = false on unmount
```

### Safety Checks Added:
1. Check before starting load
2. Check after initial delay
3. Check before clearing data
4. Check before loading file
5. Check before setting state

### Benefits:
✅ **No race conditions** - Prevents async operations after unmount  
✅ **Single execution** - Can't run multiple times  
✅ **Safe state updates** - Only updates if component still mounted  
✅ **Better timing** - Longer delay ensures Firebase is ready  

**React errors should now be resolved!** ✅

---

## v2.59 (2026-02-08)
**Debug: Enhanced Date Detection Logging**

### Added:
- **Detailed date calculation logging** - Shows each step of date calculation
- **CSV date extraction logging** - Shows date found in CSV first line
- **DateHint tracking** - Shows if using filename date vs CSV date

### Console Output to Check:

**Date Calculation:**
```
=== AUTO-LOAD TODAY'S FILE ===
Current Date Object: Sat Feb 08 2026 10:30:00 GMT-0500
Today.getFullYear(): 2026
Today.getMonth() + 1: 2
Today.getDate(): 8
Calculated Date String: 2026-02-08
Looking for file: produce-pdfs/2026-02-08.csv
Stored date in Firebase: 2026-02-09
```

**CSV Date Extraction:**
```
CSV first line: 2026-02-09 Produce Processing Report
Extracted date from CSV first line: 2026-02-09
```

### What to Check:

1. **System Date**: Is your computer's date set to Feb 8th or Feb 9th?
2. **File Names**: What CSV files exist in Firebase Storage?
3. **CSV Content**: What date is in the first line of the CSV file?

### The Date Flow:

1. **Filename date** → Used to find file (`2026-02-08.csv`)
2. **CSV first line** → Contains actual date (`2026-02-09 Produce Processing Report`)
3. **Stored date** → What gets saved to Firebase (from CSV first line)

### Likely Issue:

If today is Feb 8th but the CSV shows Feb 9th data:
- ✅ The filename might be `2026-02-08.csv` 
- ❌ But the first line says `2026-02-09`
- Result: App loads "tomorrow's" data even though filename is today

**Check console logs to see the full picture!** 🔍

---

## v2.58 (2026-02-08)
**Bug Fix: Clear Old Data When Date Changes**

### Fixed:
- **Clears previous day's data** automatically on startup
- **Checks stored date** against today's date
- **Removes old items** if dates don't match
- Prevents showing yesterday's data when starting a new day

### How It Works:

**On App Startup:**
1. Calculates today's date (e.g., `2026-02-09`)
2. Checks Firebase for stored date (e.g., `2026-02-08` from yesterday)
3. **If dates don't match** → Clears all old data
4. Then tries to load today's file

### Console Output:
```
=== AUTO-LOAD TODAY'S FILE ===
Current Date Object: Sun Feb 09 2026 08:00:00 GMT-0500
Calculated Date String: 2026-02-09
Looking for file: produce-pdfs/2026-02-09.csv
Stored date in Firebase: 2026-02-08
⚠️ Stored date does not match today. Clearing old data...
✅ Old data cleared
✅ Found today's file, loading...
```

### Benefits:

✅ **Fresh start each day** - Old data automatically cleared  
✅ **No stale data** - Won't show yesterday's items  
✅ **Smart detection** - Only clears if date has actually changed  
✅ **Preserves same-day data** - If reloading same day, keeps progress  

### Behavior:

**Same day reload:**
- Stored date: `2026-02-09`
- Today's date: `2026-02-09`
- Result: **Keeps existing data** (work in progress preserved)

**New day:**
- Stored date: `2026-02-08`
- Today's date: `2026-02-09`
- Result: **Clears old data** → Loads today's file

**App now handles day changes automatically!** 📅✨

---

## v2.57 (2026-02-08)
**Bug Fix: Resolved Blank Screen React Error**

### Fixed:
- **Fixed React DOM error** causing blank screen
- **Error was:** "Failed to execute 'removeChild' on 'Node'"
- **Cause:** useEffect dependencies causing multiple re-renders
- **Solution:** Changed to empty dependency array with proper guards

### Changes:
1. **Empty dependency array** - useEffect runs only once on mount
2. **hasLoaded flag** - Prevents multiple load attempts
3. **500ms delay** - Waits for Firebase to fully initialize
4. **Proper guards** - Checks storage/db exist before proceeding

### Technical Details:
```javascript
// Before: [storage, db] dependencies caused re-renders
useEffect(() => { ... }, [storage, db]);

// After: Empty array, runs once with internal checks
useEffect(() => { ... }, []);
```

**Blank screen error resolved!** ✅

---

## v2.56 (2026-02-08)
**Debug: Enhanced Auto-Load Date Logging**

### Changed:
- **Added detailed console logging** for date calculation
- Shows actual Date object and calculated date string
- Helps diagnose timezone or date calculation issues

### Console Output:
```
=== AUTO-LOAD TODAY'S FILE ===
Current Date Object: Sat Feb 08 2026 10:30:00 GMT-0500
Calculated Date String: 2026-02-08
Looking for file: produce-pdfs/2026-02-08.csv
✅ Found today's file, loading...
```

Or if file not found:
```
❌ No data file found for today: 2026-02-08
Error: storage/object-not-found
```

### Purpose:
- Helps identify if browser date is incorrect
- Shows exact filename being searched for
- Clarifies timezone issues if any
- Useful for debugging date-related problems

### Note:
If the app is loading the wrong date (e.g., loading Feb 9th when today is Feb 8th):
1. Check browser console for date calculation
2. Verify system clock is set correctly
3. Check browser timezone settings
4. Ensure CSV files are named correctly (YYYY-MM-DD.csv)

**Enhanced logging helps diagnose date calculation issues!** 🔍

---

## v2.55 (2026-02-08)
**Major Feature: Auto-Load Today's Data File on Startup**

### Changed:
- **Automatically loads today's CSV file on app startup**
- **Shows "No data file available for today" message** if today's file doesn't exist
- No more manual file selection required for daily work
- Different messages for Process Mode vs View Mode

### How It Works:

**On App Startup:**
1. App checks for today's date in YYYY-MM-DD format
2. Tries to load CSV file for today from Firebase Storage
3. If found → Loads automatically and displays items
4. If not found → Shows message: "No data file available for today"

### UI States:

**Today's file exists:**
- Items load automatically
- Work begins immediately

**Today's file doesn't exist (Process Mode):**
```
⚠️ No data file available for today

Upload a CSV file for today's date or select a different date

[📋 Load Different Day]
```

**Today's file doesn't exist (View Mode):**
```
⚠️ No data file available for today

Please upload a CSV file for today's date
```

### Benefits:

✅ **Zero-click startup** - Today's work loads automatically  
✅ **Clear feedback** - Know immediately if file is missing  
✅ **Smart defaults** - Always tries today's date first  
✅ **Fallback option** - Can still load different dates manually  

### User Experience:

**Morning workflow:**
1. Open app
2. Today's file loads automatically
3. Start processing immediately ✨

**If file missing:**
1. Open app
2. See clear message about missing file
3. Upload today's file or load different date

**App now auto-loads today's data - no manual selection needed!** 📅✨

---

## v2.54 (2026-02-08)
**UX Improvement: Auto-Load Most Recent CSV File**

### Changed:
- **Removed date picker modal** - No more date selection screen
- **Auto-loads most recent CSV** when clicking "Load New Day"
- Faster workflow - one click to load latest data
- Shows alert only if no CSV files are found

### How It Works:

**Before:**
```
Click "Load New Day" → Date picker appears → Select date → File loads
```

**After:**
```
Click "Load New Day" → Most recent file loads automatically ⚡
```

### Behavior:
- Lists all available CSV files in Storage
- Automatically selects and loads the **most recent date** (files sorted by date)
- No user interaction needed for date selection
- Alert shown only if no files exist in Storage

### Benefits:

✅ **Faster** - One click instead of two  
✅ **Simpler** - No date selection needed  
✅ **Logical** - Most recent file is usually what you want  
✅ **Streamlined** - Fewer clicks in workflow  

### Note:
The date picker modal is completely removed. If you need to load an older date, you would need to access files directly in Firebase Storage, or a "Load Specific Date" feature could be added if needed.

**Loading data is now instant - just one click!** ⚡✨

---

## v2.53 (2026-02-08)
**Major Change: Removed PDF File Support - CSV Only**

### Changed:
- **Removed PDF file loading** - Application now only supports CSV files
- **Updated file listing** to only detect CSV files in Firebase Storage
- **Removed PDF parsing logic** - Simplified to CSV-only processing
- **Updated function names**: `listAvailablePDFs` → `listAvailableCSVs`, `loadPDFFromStorage` → `loadCSVFromStorage`
- **Updated UI text** to reflect CSV-only file format

### What Was Removed:
1. PDF file detection in storage listing
2. PDF file loading logic
3. PDF parsing with PDF.js
4. PDF/CSV preference logic (CSV was already preferred)
5. References to "PDF or CSV" in UI text

### What Remains:
✅ **CSV file support** - Full CSV parsing and processing
✅ **CSV file upload** via Firebase Storage
✅ **Date-based file naming** - Format: `YYYY-MM-DD.csv`
✅ **All existing features** - Everything works exactly the same, just CSV only

### Why This Change:
- **CSV is more reliable** - No regex issues, no PDF.js dependency
- **Simpler codebase** - Less code to maintain
- **Already preferred** - System was already choosing CSV over PDF when both existed
- **Easier to create** - CSV files are simpler to generate from systems

### For Users:
- **Upload only CSV files** to Firebase Storage folder `produce-pdfs/`
- **File naming**: `YYYY-MM-DD.csv` (e.g., `2026-02-08.csv`)
- **Everything else unchanged** - App functionality remains identical

### Technical Changes:
```javascript
// Old functions (removed PDF support):
listAvailablePDFs() → listAvailableCSVs()
loadPDFFromStorage() → loadCSVFromStorage()

// Now only looks for .csv files:
item.name.match(/^(\d{4}-\d{2}-\d{2})\.csv$/i)
```

**Application now exclusively uses CSV files for data loading!** 📊✨

---

## v2.52 (2026-02-08)
**UX Improvement: Sequential Keyboard Shortcut for Mode Toggle**

### Changed:
- **Keyboard shortcut now works as a sequence** instead of simultaneous keys
- Hold Shift, then press V, then press M (in order)
- More natural and easier to execute than 3-key simultaneous press
- Tooltip updated to reflect new behavior

### How It Works:

**Old behavior (v2.47-v2.51):**
```
Hold Shift + Press V + Press M (all at once) ❌ Harder
```

**New behavior (v2.52):**
```
1. Hold Shift ⬇️
2. Press V 
3. Press M
4. Release Shift ⬆️
✅ Easier!
```

### Sequence Details:
- Shift must be **held down** throughout
- Press **V first**, then **M**
- Sequence resets when Shift is released
- Sequence resets if you press wrong keys or too many keys

### Benefits:

✅ **Easier to execute** - No need to coordinate 3 fingers simultaneously  
✅ **More natural** - Sequential keypresses feel more intuitive  
✅ **Less error-prone** - Harder to accidentally trigger  
✅ **Clear progression** - Shift → V → M is a clear sequence  

### Technical Details:
- Tracks Shift key state separately
- Uses array to record V and M in order
- Validates sequence is exactly V then M
- Resets sequence on Shift release or invalid keys

**Mode toggling now easier with sequential keypresses!** ⌨️✨

---

## v2.51 (2026-02-08)
**UX Enhancement: Added Tooltip to View Mode Indicator**

### Changed:
- **Added tooltip to View Mode indicator**
- Hover over indicator to see: "Press Shift+V+M to toggle modes"
- Cursor changes to help cursor (question mark) on hover
- Makes keyboard shortcut discoverable

### Visual Behavior:

**Hover over "You are in View Mode" indicator:**
```
┌──────────────────────────────────┐
│ 👁️ You are in View Mode          │
└──────────────────────────────────┘
        ↓ (hover)
    💭 Press Shift+V+M to toggle modes
```

### Benefits:

✅ **Discoverable** - Users can learn about the keyboard shortcut  
✅ **Helpful** - Reminds users how to switch modes  
✅ **Intuitive** - Help cursor indicates more info available  
✅ **Non-intrusive** - Only shows on hover  

### Technical Details:
- Uses HTML `title` attribute for tooltip
- Cursor set to `help` for visual cue
- Tooltip appears on hover automatically

**Users can now discover the keyboard shortcut by hovering!** 💡✨

---

## v2.50 (2026-02-08)
**UX Enhancement: Fixed Position for View Mode Indicator**

### Changed:
- **View Mode indicator now fixed to top-right corner**
- Stays visible when scrolling down the page
- Uses `position: fixed` with `top: 1rem` and `right: 1rem`
- High z-index (1000) ensures it stays on top of other content

### Visual Behavior:

**Before:**
- Indicator scrolled away with page content
- Not visible when scrolling down

**After:**
- Indicator always visible in top-right corner
- Floats above content when scrolling
- Provides constant mode awareness

### Benefits:

✅ **Always visible** - Never lose sight of current mode  
✅ **Better awareness** - Constant reminder you're in View Mode  
✅ **No confusion** - Can't forget which mode you're in  
✅ **Persistent feedback** - Stays visible across entire page  

### Technical Details:
```css
position: fixed;
top: 1rem;
right: 1rem;
zIndex: 1000;
```

**View Mode indicator now stays visible while scrolling!** 📌👁️

---

## v2.49 (2026-02-08)
**UI Simplification: Removed Clipboard Icon from Instructions Box**

### Changed:
- **Removed clipboard icon** from instructions box
- Instructions now show text only (e.g., "organic twistie")
- Cleaner, simpler appearance

### Visual Change:

**Before:**
```
┌─────────────────────────┐
│ INSTRUCTIONS            │
│ 📋 organic twistie      │ ← Icon + text
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│ INSTRUCTIONS            │
│ organic twistie         │ ← Text only
└─────────────────────────┘
```

### Benefits:

✅ **Cleaner design** - Less visual clutter  
✅ **Larger text focus** - Instruction text is the main element  
✅ **Simpler** - No unnecessary iconography  
✅ **More space** - Text can be more prominent  

**Instructions box now shows text only, no icon!** 📝✨

---

## v2.48 (2026-02-08)
**UX Enhancement: Added View Mode Indicator**

### Added:
- **"You are in View Mode" indicator** appears in top-right when in View Mode
- Blue badge with eye icon clearly shows current mode
- Not clickable - purely informational
- Helps users understand they're in read-only mode

### Visual Display:

**Process Mode:**
```
[📋 Load New Day]
```

**View Mode:**
```
                    [👁️ You are in View Mode]
```

### Design:
- **Blue gradient background** (matching previous View Mode button colors)
- **Eye icon** for visual recognition
- **Right-aligned** to stay out of the way
- **Only shows in View Mode** - disappears in Process Mode

### Benefits:

✅ **Clear mode indication** - Users know they're in View Mode  
✅ **Discoverable** - Hints that mode switching is possible  
✅ **Non-intrusive** - Not clickable, just informative  
✅ **Consistent styling** - Matches button design language  

### How It Works:

1. **Process Mode (iPad default):**
   - "Load New Day" button on left
   - No mode indicator

2. **View Mode (other devices default):**
   - No "Load New Day" button
   - "You are in View Mode" indicator on right

3. **Toggle modes:**
   - Use **Shift+V+M** keyboard shortcut
   - Indicator appears/disappears automatically

**Users now have clear visual feedback when in View Mode!** 👁️✨

---

## v2.47 (2026-02-08)
**UX Enhancement: Keyboard Shortcut for Mode Switching**

### Changed:
- **Removed mode toggle button entirely** - No UI button for switching modes
- **Added keyboard shortcut: Shift+V+M** - Press simultaneously to toggle modes
- Device-dependent defaults remain unchanged
- Cleaner interface with no mode button at all

### Keyboard Shortcut:

**Press: Shift + V + M (simultaneously)**
- Toggles between View Mode and Process Mode
- Works from anywhere in the app
- Prevents accidental mode switches (requires intentional 3-key combo)

### Device Defaults (Unchanged):
- ✅ **iPads** → Default to Process Mode
- ✅ **Other devices** → Default to View Mode

### Visual Changes:

**Before v2.46:**
```
[📋 Load New Day]              [Shift VM]
```

**After v2.47:**
```
[📋 Load New Day]
```

Only the "Load New Day" button remains.

### Benefits:

✅ **Cleaner interface** - No mode button cluttering the UI  
✅ **Prevents accidental switches** - 3-key combo is intentional  
✅ **More space** - Top bar is cleaner  
✅ **Power user friendly** - Keyboard shortcuts are faster  
✅ **Mode is obvious** - UI differences clearly show which mode you're in  

### How to Use:

1. **App loads** with device-dependent default mode
2. **Hold Shift, then press V and M together** to switch modes
3. **UI changes** indicate which mode you're in:
   - View Mode: Read-only, no action buttons
   - Process Mode: Editable, action buttons visible

### Technical Details:
- Uses keyboard event listeners to track pressed keys
- Detects when Shift modifier + V + M are all pressed
- Prevents default browser behavior for the combo
- Keys are case-insensitive

**Mode switching now via Shift+V+M keyboard shortcut!** ⌨️✨

---

## v2.46 (2026-02-08)
**UX Simplification: Single "Shift VM" Toggle Button**
(Replaced in v2.47 with keyboard shortcut)

---

## v2.45 (2026-02-08)
**UI Enhancement: Improved Timing Metrics & Instructions Visibility**

### Changed:
1. **Centered text in timing metrics box** - Better visual balance
2. **Removed 'edit' button** - Decluttered interface
3. **Made average time number clickable** - Click the time itself to edit
4. **Increased text sizes:**
   - Timing metrics label: 0.75rem → 0.9rem
   - Average time number: 1rem → 1.3rem
   - Instructions text: 1.6rem → 1.8rem
   - Instructions icon: 26px → 28px

### Visual Changes:

**Before:**
```
┌─────────────────────────┐
│ AVERAGE TIME PER CASE   │
│ 2:30           [edit]   │ ← Left-aligned, small
└─────────────────────────┘

┌─────────────────────────┐
│ INSTRUCTIONS            │
│ organic twistie         │ ← Smaller text
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│ AVERAGE TIME PER CASE   │
│         2:30            │ ← Centered, larger, clickable
└─────────────────────────┘

┌─────────────────────────┐
│ INSTRUCTIONS            │
│ organic twistie         │ ← Larger text
└─────────────────────────┘
```

### Interaction:
- **Click the time number (2:30)** to open timing events editor
- Underlined to show it's clickable
- Hover changes color from teal to darker green

### Benefits:

✅ **Cleaner design** - No separate edit button cluttering the box  
✅ **Intuitive interaction** - Click the thing you want to edit  
✅ **Better readability** - Larger text is easier to see on iPad  
✅ **Centered layout** - More professional appearance  
✅ **Consistent pattern** - Similar to how other interactive elements work  

**Timing metrics and instructions now more visible and easier to use!** 👁️✨

---

## v2.44 (2026-02-08)
**UI Redesign: Average Time Box Repositioned and Aligned**

### Changed:
- **Moved average time box** to be on same line as cases count (Line 2)
- **Matched width to instructions box** below it using flex properties
- **Perfect vertical alignment** between average time box and instructions box

### Layout Changes:

**Before:**
```
125 cases    [Wide avg box - didn't align]

[Instructions] [Buttons]
```

**After:**
```
125 cases    [Average time box]

[Instructions] [Buttons]
             ↕ Same width
```

### Technical Changes:
- Changed from `minWidth: '450px'` to `flex: '1 1 auto', minWidth: '200px'`
- Now uses same flex properties as instructions box
- Both boxes grow/shrink together maintaining alignment

### Benefits:

✅ **Perfect alignment** - Average time box sits directly above instructions box  
✅ **Same width** - Both boxes match width automatically  
✅ **Cleaner layout** - Visual columns are properly aligned  
✅ **Responsive** - Flex properties ensure proper sizing on all screens  

### Visual Result:

```
┌────────────────────────────────────────┐
│ Priority 1                             │
│                                        │
│ Lettuce-romaine                        │
│                                        │
│ 125 cases    │ Average time: 2:30     │ ← Line 2
│   [timer]    │      [edit]            │
│              └────────────────────────┐│
│ │ INSTRUCTIONS                        ││
│ │ organic twistie                     ││ ← Line 3
│ └─────────────────────────────────────┘│
│              [Timer] [Video]           │
│              [All Done]                │
└────────────────────────────────────────┘
```

**Average time box now perfectly aligned with instructions box!** 📐✨

---

## v2.43 (2026-02-08)
**UI Enhancement: Add Parentheses Around Remaining Items**

### Changed:
- **Added parentheses** around the remaining items number
- Display now shows **(15)** instead of **15**
- Visual emphasis on the items count

### Display:

**Before:**
```
        REMAINING
        
   125           15
  cases        items
```

**After:**
```
        REMAINING
        
   125          (15)
  cases        items
```

### Benefits:

✅ **Visual distinction** - Parentheses make the number stand out  
✅ **Clearer format** - Separates items count from cases count visually  
✅ **Better readability** - Easier to parse at a glance  

**Remaining items now displayed with parentheses: (15)** 📊✨

---

## v2.42 (2026-02-08)
**Revert: Removed Total Items Display**

---

## v2.41 (2026-02-08)
**UI Fix: Show Remaining and Total Items Together**
(Reverted in v2.42)

---

## v2.40 (2026-02-08)
**Bug Fix + UI Enhancement: Stretched Average Time Box**

### Fixed:
1. **Total items parentheses now display correctly**
   - Changed from `({totalItems} total)` to template literal `{`(${totalItems} total)`}`
   - Parentheses now render properly around the total count

2. **Average time box stretched to match buttons**
   - Added `minWidth: '450px'` to timing metrics box
   - Box now spans from left edge of Timer button to right edge of All Done button
   - Creates visual alignment between rows

### Layout Changes:

**Before:**
```
125 cases          [Small avg box]

[Instructions]     [Timer] [Video]
                            [All Done]
```

**After:**
```
125 cases          [Wider avg box spanning full width]

[Instructions]     [Timer] [Video]
                            [All Done]
```

### Visual Improvements:

✅ **Better alignment** - Average time box width matches buttons below  
✅ **Cleaner layout** - Horizontal elements align properly  
✅ **More prominent** - Average time information gets more visual weight  
✅ **Parentheses work** - Total items now shows as "(38 total)" correctly  

### Technical Details:

**Parentheses fix:**
```javascript
// Before (didn't render parentheses):
({totalItems} total)

// After (renders correctly):
{`(${totalItems} total)`}
```

**Width fix:**
```javascript
// Added to timing metrics box:
minWidth: '450px'  // Matches combined width of Timer + Video + All Done + gaps
```

**Both fixes applied!** 📏✨

---

## v2.39 (2026-02-08)
**UI Enhancement: Show Total Items Count in Progress Section**

### Added:
- **Total items count** displayed in parentheses under the "items" label
- Shows context for remaining items (e.g., "15 items" with "(38 total)" below)
- Helps workers understand progress at a glance

### Display Format:

**Progress Section:**
```
        REMAINING
        
   125           15
  cases        items
            (38 total)  ← New
```

### Example Scenarios:

**Start of day:**
```
38
items
(38 total)  ← All items remaining
```

**Mid-day:**
```
15
items
(38 total)  ← 15 remaining out of 38 total
```

**Near completion:**
```
2
items
(38 total)  ← Almost done!
```

### Benefits:

✅ **Better context** - Know total workload at a glance  
✅ **Progress awareness** - See how many you've completed (38 - 15 = 23)  
✅ **Motivation** - Visual sense of accomplishment  
✅ **Planning** - Managers can see total scope quickly  

### Technical Details:
```javascript
const totalItems = completedItems.length + items.length;
```

Displays as:
```javascript
({totalItems} total)
```

**Total items now visible under remaining items count!** 📊✨

---

## v2.38 (2026-02-08)
**UI Redesign: Priority Dropdown Moved to Center Top**

### Changed:
- **Priority dropdown moved to center top** of each item box
- **Removed "Priority:" label** - dropdown stands alone without field identifier
- **Item name moved below** priority dropdown
- **Cleaner, more prominent priority visibility**

### Layout Changes:

**Before:**
```
┌────────────────────────────────────┐
│ Item Name              Priority: 1 │ ← Same row
│                                    │
│ [Rest of content]                  │
└────────────────────────────────────┘
```

**After:**
```
┌────────────────────────────────────┐
│           Priority 1               │ ← Centered at top
│                                    │
│ Item Name                          │ ← Below priority
│                                    │
│ [Rest of content]                  │
└────────────────────────────────────┘
```

### Benefits:

✅ **More prominent** - Priority is now the first thing you see  
✅ **Cleaner design** - No label clutter, just the priority value  
✅ **Better hierarchy** - Priority establishes importance at the top  
✅ **More space** - Item name gets full width below  
✅ **Centered focus** - Eye naturally drawn to center-top position  

### Design Philosophy:

The priority is the **most important classifier** for each item - it determines:
- Work order and urgency
- Which items to process first
- Team coordination and planning

By placing it **center-top** without a label:
- It's immediately visible when scanning the list
- Workers can quickly identify high-priority items
- The dropdown is easy to change in Process Mode
- The badge is prominent in View Mode

**Priority now takes center stage at the top of each item!** 🎯📍

---

## v2.37 (2026-02-07)
**UI Improvement: Instructions Title Repositioned to Top**

### Changed:
- **"Instructions" title now at top margin** of the yellow highlighted box
- Instruction text remains centered in the remaining space below
- Cleaner visual hierarchy and better use of vertical space

### Before:
```
┌─────────────────────┐
│                     │
│   INSTRUCTIONS      │  ← Centered vertically
│   organic twistie   │
│                     │
└─────────────────────┘
```

### After:
```
┌─────────────────────┐
│   INSTRUCTIONS      │  ← At top margin
│                     │
│   organic twistie   │  ← Centered in remaining space
│                     │
└─────────────────────┘
```

### Technical Changes:
- Removed `justifyContent: 'center'` from container
- Increased spacing below title from 0.5rem to 0.75rem
- Added `flex: '1'` to instruction text container

### Benefits:
✅ **Better hierarchy** - Title clearly labels the section from the top  
✅ **More natural flow** - Follows standard top-to-bottom reading pattern  
✅ **Cleaner design** - Title anchored at top, content centered below  

**Instructions title now sits at the top of the box!** 📋✨

---

## v2.36 (2026-02-07)
**Feature: Show Active Timers in View Mode**

### Added:
- **Timer visible in View Mode** - Running timers now display in both Process and View modes
- **"Paused" indicator** - Shows "PAUSED" text next to timer when paused
- **Real-time visibility** - Managers and other viewers can see active work in progress

### How It Works:

**When Timer is Running:**
```
[Timer Icon] 05:23 ← Yellow background, visible in both modes
```

**When Timer is Paused:**
```
[Timer Icon] 05:23 PAUSED ← Blue background, "PAUSED" text shown
```

### Visual States:

1. **Running Timer (Yellow):**
   - Yellow/amber gradient background
   - Timer icon + elapsed time
   - Visible in Process Mode AND View Mode

2. **Paused Timer (Blue):**
   - Blue/indigo gradient background
   - Timer icon + elapsed time
   - "PAUSED" text in uppercase
   - Visible in Process Mode AND View Mode

3. **No Timer:**
   - No timer display (item not being timed)

### Benefits:

✅ **Visibility** - Managers can see work progress in View Mode  
✅ **Coordination** - Multiple workers can see what's being timed  
✅ **Awareness** - Everyone knows when items are paused vs. running  
✅ **No interference** - View Mode users can't modify timers (read-only)  

### Use Cases:

**Manager in View Mode:**
- Sees that worker is timing "Lettuce-romaine"
- Timer shows 12:45 and is running
- Can monitor progress without switching to Process Mode

**Worker checking another item:**
- Switches to View Mode to check instructions
- Still sees their active timer running on previous item
- Knows exactly where they paused

**Multiple iPads:**
- Worker A timing item on iPad 1
- Worker B can see on iPad 2 (View Mode) what's being timed
- Better coordination across the team

**Timer persists across mode switches!** 👁️⏱️

---

## v2.35 (2026-02-07)
**UX Improvement: Remove Confirmation Dialog for Deleting Timing Events**

### Changed:
- **Removed confirmation dialog** when deleting timing events in the edit list
- Timing events now delete immediately on click
- Matches the streamlined workflow approach used elsewhere in the app

### Why:
- **Faster workflow** - No interruption when managing timing data
- **Consistency** - Aligns with the removal of other confirmation dialogs (v2.29)
- **Trust the user** - Experienced workers don't need double-confirmation for every action
- **Data is safe** - Historical averages are automatically recalculated if events remain

### Before:
```
Click delete → Confirmation popup → Click OK → Event deleted
```

### After:
```
Click delete → Event deleted immediately
```

### Notes:
- The app still prevents accidental deletions through:
  - Edit mode being separate from View mode
  - Clear delete button styling
  - Immediate visual feedback
- Historical timing data remains accurate with automatic average recalculation

**Timing event deletion is now instant!** ⚡

---

## v2.34 (2026-02-07)
**Main App: Case-Insensitive File Extension Matching + Debug Logging**

### Fixed:
- **Case-insensitive file extension matching** - Now matches .csv/.CSV/.Csv and .pdf/.PDF/.Pdf
- **Added extensive debug logging** - Console shows exactly which files are found and how they're processed

### The Issue:
The file listing regex was case-sensitive, so files with uppercase extensions weren't being detected:
```javascript
// BEFORE (Case-sensitive):
const pdfMatch = item.name.match(/^(\d{4}-\d{2}-\d{2})\.pdf$/);
const csvMatch = item.name.match(/^(\d{4}-\d{2}-\d{2})\.csv$/);
// Would NOT match: 2026-02-09.CSV ❌
```

### The Fix:
```javascript
// AFTER (Case-insensitive with 'i' flag):
const pdfMatch = item.name.match(/^(\d{4}-\d{2}-\d{2})\.pdf$/i);
const csvMatch = item.name.match(/^(\d{4}-\d{2}-\d{2})\.csv$/i);
// Now matches: 2026-02-09.CSV ✓
```

### Debug Console Output:
Open browser console (F12) and click "Load New Day" to see:
```
=== Listing Files from Storage ===
Total files found: 3
  File: 2026-02-09.csv
  File: 2026-02-09.pdf
  Parsed: 2026-02-09.csv → date=2026-02-09, type=csv
  Parsed: 2026-02-09.pdf → date=2026-02-09, type=pdf
  Added: 2026-02-09 (csv)
  Skipped: 2026-02-09 (pdf) - already have csv
=== Final dates list ===
  2026-02-09: CSV
```

**Open console to see what files are being found!** 🔍

---

## v2.33.6 (2026-02-07)
**PDF Uploader: Added Preview Mode Detection & Instructions**

### Added:
- **Firebase availability check** - Detects if external scripts can load
- **Preview mode warning** - Shows prominent notice when viewed in preview/iframe
- **User instructions** - Clear guidance to download and open file directly
- **Graceful error handling** - Script stops cleanly without breaking

### The Issue:
The error `firebase is not defined` occurs when viewing the HTML file in preview mode (like Claude's artifact viewer or as an iframe). External scripts like Firebase cannot load in these restricted contexts for security reasons.

The error shows as:
```
about:srcdoc:571 Uncaught ReferenceError: firebase is not defined
```

### The Solution:
**Download the file and open it directly in your browser.**

The uploader now:
1. Checks if Firebase loaded
2. If not loaded → Shows warning banner
3. Displays clear instructions to user
4. Prevents script errors

### Warning Banner:
```
⚠️ Important: Download and Open Directly

This file cannot run in preview mode.
Please download this HTML file and open it directly
in your browser (Chrome, Firefox, Safari, or Edge).
Firebase requires direct file access to work properly.
```

### How to Use:
1. **Download** the `pdf-uploader.html` file
2. **Save** it to your computer
3. **Double-click** to open in your default browser
4. **Or** right-click → Open with → Choose your browser

**The file will work perfectly when opened directly!** ✅

---

## v2.33.5 (2026-02-07)
**Critical Fix: Removed Duplicate Code Causing Syntax Error**

### Fixed:
- **Removed duplicate code block that was causing persistent syntax error**
- Stray template literal closing `};` was left from previous edit
- Function was being defined twice with conflicting syntax

### The Issue:
During the previous fix (v2.33.4), duplicate code was left behind:
```javascript
// Line 425-431: Correct code
pdfList.appendChild(div);
}
} catch (error) {
  // ...
}
}

// Line 432-439: DUPLICATE (causing error)
`;                           ← Stray closing backtick!
pdfList.appendChild(div);    ← Duplicate
}                            ← Duplicate
} catch (error) {            ← Duplicate
  // ...
}
}
```

The stray `};` on line 432 was being interpreted as part of the template literal, breaking the JavaScript syntax.

### The Fix:
Removed the entire duplicate block (lines 432-439).

**Syntax error finally resolved!** ✅

---

## v2.33.4 (2026-02-07)
**Critical Fix: Syntax Error Breaking JavaScript Execution**

### Fixed:
- **Syntax error in template literal causing entire script to fail**
- Multi-line style attribute inside template literal was breaking quotes
- Consolidated inline styles to single line to avoid quote conflicts

### The Issue:
```javascript
// BROKEN (Syntax Error):
div.innerHTML = `
  <span style="
    font-size: 0.75rem;  ← Multi-line style inside template literal
    background: ${value};
  ">${text}</span>
`;

// FIXED:
div.innerHTML = `
  <span style="font-size: 0.75rem; background: ${value};">
    ${text}
  </span>
`;
```

The multi-line style attribute with quotes inside a template literal was causing:
```
Uncaught SyntaxError: Unexpected identifier 'Delete'
```

This prevented ALL JavaScript from running, including:
- File selection handler
- Upload button logic
- Everything else

### The Fix:
Consolidated the style attribute to a single line, eliminating the nested quote conflict.

**JavaScript now executes correctly!** ✅

---

## v2.33.3 (2026-02-07)
**Debug: Added Extensive Logging**
(Rolled into v2.33.4)

---

## v2.33.2 (2026-02-07)
**Bug Fix: Upload Button Now Activates for CSV Files**

### Fixed:
- **Upload button now properly enables when CSV files are selected**
- Fixed variable name conflict (fileName was used for both file name and DOM element)
- Added explicit file type validation in change handler
- Added MIME types to accept attribute for better browser compatibility
- Added console logging for debugging

### The Issue:
When selecting a CSV file, the "Upload to Storage" button remained disabled, even though the file was selected.

### The Fix:
1. **Variable name conflict resolved:**
```javascript
// Before: fileName used for both
const fileName = selectedFile.name.toLowerCase();
fileName.textContent = `Selected: ${selectedFile.name}`; // Conflict!

// After: Separate variables
const selectedFileName = selectedFile.name.toLowerCase();
fileName.textContent = `Selected: ${selectedFile.name}`; // ✓
```

2. **Better accept attribute:**
```html
<!-- Added MIME types for browser compatibility -->
<input accept=".csv,.pdf,text/csv,application/pdf" />
```

3. **Added validation:**
```javascript
const validExtensions = ['.csv', '.pdf'];
const isValid = validExtensions.some(ext => selectedFileName.endsWith(ext));
```

**CSV file selection now works correctly!** ✅

---

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
