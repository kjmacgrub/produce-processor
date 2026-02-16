# Produce Processing Application

A browser-based iPad application for processing produce items with real-time synchronization, video instructions, and completion tracking.

## Current Version: v2.152

---

## Firebase Configuration

### Firebase Project Details
- **Project ID:** process-6d2dc
- **Database URL:** https://process-6d2dc-default-rtdb.firebasio.com
- **Storage Bucket:** process-6d2dc.firebasestorage.app

### Firebase Services Used

**1. Realtime Database**
- Items and completion tracking
- Real-time photo sync
- Historical timing data
- Paths: `/items`, `/completedItems`, `/completionPhotos`, `/timingData`

**2. Firebase Storage**
- Video files: `produce-videos/{SKU}.webm`
- CSV data files: `produce-pdfs/{date}.csv`
- Free tier: 5 GB storage, 1 GB/day downloads

**3. Firebase Hosting** (optional)
- Deploy via Netlify currently
- URL: https://chimerical-brigadeiros-b50285.netlify.app

---

## File Structure

```
produce-processor-project/
├── index.html              # Main application (single-file React app)
├── VERSION-HISTORY.md      # Complete version history
├── example-data.csv        # Sample CSV data file
└── README.md              # This file
```

---

## Key Features

### ✅ Cross-Device Sync
- **Videos:** Firebase Storage (cloud sync)
- **Completion Photos:** Firebase Realtime Database (real-time sync)
- **Items & Progress:** Firebase Realtime Database (real-time sync)

### 📱 Device Modes
- **iPad (Work Mode):** Process items, take photos, watch videos
- **Desktop/Laptop (Work Mode):** Manage data, reload CSV files
- **Any Device (View Mode):** Read-only dashboard, live progress tracking

### 🎬 Video Management
- Record instruction videos per SKU
- Upload existing video files
- Videos stored in Firebase Storage
- Accessible from any device

### 📊 Data Loading
- **Reload Data button** (non-iPad, Work Mode only)
- Automatically loads today's CSV from Firebase Storage
- Falls back to date picker if today's file not found

---

## Setup Instructions

### 1. Firebase Setup (Already Configured)

The application is already configured with Firebase. **No changes needed** unless you want to use your own Firebase project.

**Current Firebase Config (in index.html line 36-45):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAOtKt-nDBvAod23fAX04nXpCxmA7FnWKk",
  authDomain: "process-6d2dc.firebaseapp.com",
  databaseURL: "https://process-6d2dc-default-rtdb.firebasio.com",
  projectId: "process-6d2dc",
  storageBucket: "process-6d2dc.firebasestorage.app",
  messagingSenderId: "955601669952",
  appId: "1:955601669952:web:871e3dd2c562c8aa6274a5",
  measurementId: "G-X5Z5CC3Q44"
};
```

### 2. Firebase Storage Rules

Make sure your Firebase Storage rules allow public read access:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Local Development

**Option A: Simple HTTP Server (Python)**
```bash
cd produce-processor-project
python3 -m http.server 8000
```
Then open: http://localhost:8000

**Option B: VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

**Option C: Node.js HTTP Server**
```bash
npx http-server -p 8000
```

### 4. Deployment to Netlify (Current)

**Current Site:** https://chimerical-brigadeiros-b50285.netlify.app

**To redeploy:**
1. Go to Netlify dashboard
2. Drag and drop `index.html` to deploy
3. Or connect to GitHub repo for auto-deploy

**Alternative: Deploy to Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## Data File Management

### CSV File Upload to Firebase Storage

**Manager uploads CSV files the night before:**

1. Go to Firebase Console → Storage
2. Navigate to `produce-pdfs/` folder
3. Upload CSV file with format: `YYYY-MM-DD.csv`
   - Example: `2026-02-12.csv`
4. Workers click "Reload Data" button next morning

### CSV File Format

**Required structure:**
```
Produce Processing Report for 2026-02-12

Broccoli Crowns #1000230,12,2 - Store in Walk-In
Green Kale Bunched #1001098,8,1 - Display Front
...
```

**Format:** `Name #SKU,Cases,Priority - Location`

---

## Usage Guide

### For iPad Workers (Field Processing)

**Work Mode (Default):**
1. See list of items to process
2. Click item → Start processing
3. Watch instruction video if available
4. Complete item → Take completion photo
5. Submit photo → Item marked complete

**View Mode:**
- Read-only dashboard
- See live progress updates
- View completed items and photos

### For Desktop/Laptop Users (Data Management)

**Work Mode:**
1. **Reload Data button** (top left)
   - Clears current data
   - Loads today's CSV from Firebase Storage
   - Shows date picker if today's file missing

2. **Mode toggle button** (top right)
   - Switch between Work Mode and View Mode

**View Mode:**
- Monitor live progress
- See completion photos in real-time
- Check timing statistics

---

## Technical Architecture

### Single-File React Application
- **React 18** (via CDN)
- **Babel** (in-browser compilation)
- **Lucide React** (icons)
- **Firebase SDK** (v9.22.2)

### State Management
- React hooks (useState, useEffect, useMemo)
- Real-time Firebase listeners
- No external state management library

### Storage Strategy

| Data Type | Storage Location | Sync | Persistence |
|-----------|------------------|------|-------------|
| Videos | Firebase Storage | Cloud | Permanent |
| Completion Photos | Firebase Realtime DB | Real-time | Permanent |
| Items/Progress | Firebase Realtime DB | Real-time | Per-session |
| CSV Files | Firebase Storage | Cloud | Permanent |

### Device Detection
```javascript
const isIPad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
```

---

## Known Issues & Solutions

### Issue: Videos not playing
**Error:** MediaError code 4, "FFmpegDemuxer: open context failed"

**Solution:**
1. Delete corrupted video
2. Record new video (v2.151+ fixed corruption)
3. New videos upload as Blob (no ArrayBuffer conversion)

### Issue: CORS errors on videos
**Solution:** Video element includes `crossOrigin="anonymous"` (v2.150+)

### Issue: Old data showing
**Solution:** Click "Reload Data" button to load fresh CSV from Firebase Storage

---

## Development Notes

### Video Recording
- Uses MediaRecorder API
- Saves as .webm format
- Uploads Blob directly to Firebase Storage
- **Do NOT convert to ArrayBuffer** (causes corruption)

### Photo Capture
- Uses getUserMedia API
- Captures from device camera
- Saves to Firebase Realtime Database as base64
- Real-time sync across all devices

### CSV Parsing
- Extracts date from first line
- Parses item format: `Name #SKU,Cases,Priority - Location`
- Handles missing priorities (marked as 'missing')
- Generates unique IDs per session

---

## Firebase Free Tier Limits

**Storage:**
- 5 GB free storage
- 1 GB/day free downloads
- Typical video: 1-5 MB
- Capacity: ~1,000-5,000 videos

**Realtime Database:**
- 1 GB free storage
- 10 GB/month free downloads
- 100 simultaneous connections

**Current Usage (estimated):**
- Videos: < 1 GB
- Photos: < 100 MB
- CSV files: < 10 MB
- **Total: Well within free tier**

---

## Version History

See `VERSION-HISTORY.md` for complete version history from v1.00 to v2.152.

**Recent Major Changes:**
- **v2.151:** Fixed video corruption (Blob upload, no ArrayBuffer)
- **v2.150:** Added CORS support for videos
- **v2.148:** Removed Clear Data button
- **v2.146:** Moved videos to Firebase Storage
- **v2.144:** Reload Data button (non-iPad, Work Mode)

---

## Support & Troubleshooting

### Browser Console Debugging

**Enable Console:**
- Desktop: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- iPad: Settings → Safari → Advanced → Web Inspector

**Key Console Messages:**
```
✅ Video uploaded to Firebase Storage
🎬 Fetching video URL from Firebase Storage
📥 Found today's file: 2026-02-12.csv
🔄 Reload Data clicked
```

**Common Errors:**
- `Firebase Storage not initialized` - Refresh page
- `Video not found` - Check Firebase Storage console
- `No data files available` - Upload CSV to Firebase Storage

### Firebase Console Access

**View your data:**
1. Go to https://console.firebase.google.com
2. Select project: process-6d2dc
3. Navigate to:
   - **Realtime Database** → See items, photos
   - **Storage** → See videos, CSV files
   - **Usage** → Check storage/bandwidth usage

---

## Security Considerations

### Current Security Model

**Public Read Access:**
- Videos and CSV files are publicly readable
- Anyone with Firebase URL can download

**Why this works:**
- Internal team application
- No sensitive data in videos/CSVs
- SKU numbers are not confidential

**Future Improvements (if needed):**
- Add Firebase Authentication
- Implement user-based access control
- Set up security rules per user role

---

## Future Enhancements

**Potential Features:**
- [ ] User authentication
- [ ] Multi-location support
- [ ] Export completed items to PDF/Excel
- [ ] Advanced analytics dashboard
- [ ] Offline mode with sync
- [ ] Barcode scanning for SKUs
- [ ] Voice commands for hands-free operation
- [ ] Automated daily reports
- [ ] Integration with inventory systems

---

## Credits

**Built with:**
- React 18
- Firebase (Realtime Database, Storage)
- Lucide React (icons)
- Netlify (hosting)

**Developed:** February 2026
**Current Version:** v2.152

---

## License

Internal use for Park Slope Food Co-Op produce processing.

---

## Contact

For questions or support, check the Firebase console or browser console for debugging information.
