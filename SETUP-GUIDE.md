# Firebase Storage Setup for Produce Processing App

## 🎉 What's New

Your app now supports **loading PDFs from Firebase Storage**! This means:

✅ Upload PDFs once from your computer
✅ All iPads can access them by date  
✅ No need to email or transfer files to iPads
✅ Prepare tomorrow's PDFs today

---

## 📦 Files Included

1. **index.html** - Main produce processing app (with Storage support)
2. **pdf-uploader.html** - Admin page for uploading PDFs to Storage

---

## 🔧 Firebase Storage Setup

### Step 1: Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **process-6d2dc**
3. Click **"Storage"** in the left sidebar (under "Build")
4. Click **"Get Started"**
5. Choose **"Start in test mode"** (for now)
6. Click **"Next"** → **"Done"**

### Step 2: Set Storage Rules (Important!)

After enabling Storage, set these rules:

1. In Firebase Console, go to **Storage → Rules**
2. Replace the rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /produce-pdfs/{filename} {
      // Allow anyone to read PDFs
      allow read: if true;
      // Allow writes (uploads/deletes) - adjust if you want stricter security
      allow write: if true;
    }
  }
}
```

3. Click **"Publish"**

**Note:** These rules allow anyone with the Firebase URL to read/write. For production, you might want to add authentication.

---

## 🚀 Deployment

### Deploy Main App (index.html)

**Option A: Netlify (Easiest)**

1. Create folder: `produce-processor`
2. Put `index.html` inside it
3. Go to https://app.netlify.com/drop
4. Drag the folder to deploy
5. Get your URL: `https://your-site.netlify.app`
6. Bookmark on iPads!

**Option B: Firebase Hosting**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting
# Select your project: process-6d2dc
# Use "public" as directory
# Configure as single-page app: Yes

# Copy file
cp index.html public/index.html

# Deploy
firebase deploy --only hosting
```

Your app will be at: `https://process-6d2dc.web.app`

### Deploy Admin Uploader (pdf-uploader.html)

**Option 1: Same Netlify site (Recommended)**

1. Put `pdf-uploader.html` in your `produce-processor` folder
2. Re-drag folder to Netlify (updates deployment)
3. Access at: `https://your-site.netlify.app/pdf-uploader.html`

**Option 2: Separate Netlify site**

1. Create folder: `pdf-uploader`
2. Rename `pdf-uploader.html` to `index.html`
3. Put it in the folder
4. Drag to Netlify Drop
5. Bookmark the admin URL

---

## 📱 How It Works

### For Manager (Computer)

1. Open `pdf-uploader.html` in browser
2. Select date
3. Choose PDF file
4. Click "Upload to Storage"
5. PDF is saved as `YYYY-MM-DD.pdf`

### For iPads (Processing Area)

1. Open main app
2. Click **"☁️ Load from Storage"**
3. Select date from list
4. PDF loads automatically!

**OR**

Click **"📋 Upload Local PDF"** (old way still works!)

---

## 🗂️ Storage Structure

```
Firebase Storage:
└── produce-pdfs/
    ├── 2026-02-03.pdf
    ├── 2026-02-04.pdf
    ├── 2026-02-05.pdf
    └── 2026-02-06.pdf (uploaded in advance!)
```

---

## 💰 Cost

**Firebase Storage Free Tier:**
- 5 GB storage
- 1 GB/day downloads

**Your usage:**
- ~40 KB per PDF × 365 days = ~15 MB/year
- 3 iPads × 1 download/day = 3 downloads/day

**You'll stay completely FREE!** ✅

---

## 🎯 Workflow Example

**Monday Morning (Manager's Office):**

1. Manager opens `pdf-uploader.html`
2. Uploads Monday's PDF → Saved as `2026-02-03.pdf`
3. Uploads Tuesday's PDF → Saved as `2026-02-04.pdf`
4. All done!

**Monday Morning (Processing Area):**

1. Worker opens app on iPad
2. Clicks "☁️ Load from Storage"
3. Sees: "Monday, 2/3/2026" ← Clicks it
4. PDF loads → Processing begins!

**Tuesday Morning (Processing Area):**

1. Worker opens app on iPad
2. Clicks "☁️ Load from Storage"
3. Sees: "Tuesday, 2/4/2026" ← Clicks it
4. Tuesday's PDF already there! 🎉

---

## 🔒 Security Notes

Current setup uses **test mode** rules which allow anyone to read/write.

**For production, consider:**

1. **Authentication** - Require login to upload
2. **API Key Restrictions** - Restrict in Firebase Console
3. **Custom Rules** - Allow read for all, write for specific users

---

## 🆘 Troubleshooting

**"No PDFs found in Storage"**
- Check that PDFs were uploaded successfully
- Check Storage rules allow reading
- Check filename format is `YYYY-MM-DD.pdf`

**"Could not load PDF from Storage"**
- Check Firebase Storage is enabled
- Check Storage rules
- Check console for error messages

**Videos/timing data not showing**
- These are stored locally on each iPad (IndexedDB)
- Videos are NOT in Storage (to avoid costs)
- Each iPad has its own video library

---

## 📞 Support

If you have questions or issues:

1. Check Firebase Console → Storage
2. Check browser console (F12) for errors
3. Verify Storage rules are published
4. Ensure PDFs are in `produce-pdfs/` folder

---

## ✨ Benefits Summary

**Before:**
- Manager uploads PDF on each iPad individually
- OR emails PDF to team
- Time-consuming setup every morning

**After:**
- Manager uploads once from computer ✅
- All iPads access instantly ✅
- Can prepare tomorrow's PDF today ✅
- Centralized, organized, efficient ✅

Enjoy your new workflow! 🎉
