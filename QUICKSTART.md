# Quick Start Guide

## Get Running in 60 Seconds

### 1. Open the Application

**Option A: Double-click `index.html`**
- Works in most browsers
- May have CORS limitations

**Option B: Use Python HTTP Server (Recommended)**
```bash
cd produce-processor-project
python3 -m http.server 8000
```
Then open: http://localhost:8000

**Option C: Use VS Code Live Server**
```bash
code .
```
Right-click `index.html` → "Open with Live Server"

---

### 2. Test the Application

**On Desktop/Laptop:**
1. You'll see "Work Mode" by default
2. Click "🔄 Reload Data" button (top left)
3. If no CSV files in Firebase Storage, you'll see date picker
4. Upload `example-data.csv` to Firebase Storage first (see below)

**On iPad:**
1. Opens in "Work Mode" automatically
2. No Reload Data button (field processing only)
3. Click items to start processing
4. Take completion photos

---

### 3. Upload Sample Data to Firebase

**Go to Firebase Console:**
1. Visit: https://console.firebase.google.com
2. Select project: **process-6d2dc**
3. Click **Storage** in left sidebar
4. Navigate to (or create) `produce-pdfs/` folder
5. Upload `example-data.csv`
6. Rename to: `2026-02-16.csv` (today's date)

**Back in the app:**
1. Click "🔄 Reload Data" button
2. Data loads automatically!

---

### 4. Record Your First Video

1. Click on any item (e.g., "Broccoli Crowns #1000230")
2. Click "Make Video" button
3. Allow camera access
4. Record instructions (press ⏺️ Record)
5. Stop recording (press ⏹️ Stop)
6. Click "Save Video"
7. Page reloads - video uploaded to Firebase Storage

**Watch the video:**
1. Find the same item again
2. Click "▶ Watch" button (appears after recording)
3. Video streams from Firebase Storage!

---

### 5. Complete Your First Item

1. Click on an item
2. Click "Start Processing" button
3. Timer starts
4. Click "Done" button when finished
5. Camera opens for completion photo
6. Take photo → Click "Accept Photo"
7. Item moves to "Completed" section!

---

## Common Issues

**"No data files available"**
→ Upload a CSV to Firebase Storage > produce-pdfs/

**Video won't play**
→ Delete old video, record new one (v2.151+ fixed corruption)

**Can't see Reload Data button**
→ Only shows on non-iPad devices in Work Mode

**Data not syncing**
→ Check internet connection and Firebase console

---

## Next Steps

1. **Read README.md** for complete documentation
2. **Check VERSION-HISTORY.md** for all features
3. **Explore Firebase Console** to see your data
4. **Deploy to Netlify** for team access

---

## Need Help?

1. **Browser Console (F12)** - See detailed logs
2. **Firebase Console** - View data, storage, usage
3. **README.md** - Full documentation
4. **VERSION-HISTORY.md** - Feature details

---

**You're ready to go! 🚀**
