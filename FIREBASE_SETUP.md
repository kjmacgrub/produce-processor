# Firebase Setup Guide for Produce Processor

This guide will walk you through setting up Firebase so multiple people can view processing progress in real-time.

## What You'll Get

✅ **Real-time sync** - Changes appear instantly on all devices
✅ **One iPad for data entry** - Upload CSVs, timing, videos from main iPad
✅ **Multiple view-only devices** - Anyone can check progress from any browser
✅ **Free hosting** - Firebase free tier is generous (plenty for co-op use)
✅ **Video storage** - Process videos stored in cloud
✅ **Persistent data** - All timing data saved permanently

## Setup Steps (15 minutes)

### Step 1: Create Firebase Account

1. Go to https://firebase.google.com/
2. Click **"Get Started"** or **"Go to Console"**
3. Sign in with your Google account (or create one)

### Step 2: Create New Project

1. Click **"Add project"** or **"Create a project"**
2. **Project name**: "produce-processor" (or any name you like)
3. Click **Continue**
4. **Google Analytics**: Turn OFF (not needed for this app)
5. Click **Create project**
6. Wait for project creation (takes 30 seconds)
7. Click **Continue**

### Step 3: Set Up Realtime Database

1. In the left sidebar, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. **Location**: Choose closest to you (e.g., us-central1)
4. Click **Next**
5. **Security rules**: Choose **"Start in test mode"** (we'll fix this next)
6. Click **Enable**

**Important: Set Security Rules**

1. Click the **"Rules"** tab at the top
2. Replace the rules with this:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. Click **"Publish"**

> **Note**: These rules allow anyone with the link to read/write. For production use, you'd want proper authentication. For a co-op internal tool, this is fine.

### Step 4: Set Up Storage

1. In the left sidebar, click **"Build"** → **"Storage"**
2. Click **"Get started"**
3. **Security rules**: Click **Next** (accept defaults)
4. **Location**: Should auto-select (same as database)
5. Click **Done**

**Set Storage Rules:**

1. Click the **"Rules"** tab
2. Replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

### Step 5: Get Your Configuration

1. Click the **gear icon** ⚙️ next to "Project Overview" in left sidebar
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **web icon** `</>` (it says "Add an app")
5. **App nickname**: "Produce Processor Web"
6. Click **"Register app"**
7. You'll see a code snippet with your config - **COPY THIS**

It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "produce-processor.firebaseapp.com",
  databaseURL: "https://produce-processor-default-rtdb.firebaseio.com",
  projectId: "produce-processor",
  storageBucket: "produce-processor.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

8. Click **"Continue to console"**

### Step 6: Configure the App

1. Open `produce-processor-firebase.html` in a text editor
2. Find this section near the top (around line 40):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. **Replace** this with your actual config from Step 5
4. **Save** the file

### Step 7: Test It!

1. Open `produce-processor-firebase.html` in Safari on your iPad
2. You should see **"🟢 Connected"** in the header
3. Upload a CSV file
4. Open the same file on another device (phone, computer, etc.)
5. Both should show the same data!

## Using the App

### Main iPad (Data Entry)

1. Open the app
2. Make sure it's in **"Edit Mode"** (orange button)
3. Upload CSV, add videos, time processing
4. All data automatically syncs to cloud

### Viewing Devices (Anyone)

1. Open the same HTML file URL
2. Click to switch to **"View Mode"** (blue button)
3. See real-time updates as processing happens
4. Can watch instruction videos
5. Cannot accidentally change data

## Hosting Options

### Option A: Simple File Sharing (Easiest)

1. Upload `produce-processor-firebase.html` to Google Drive
2. Get shareable link
3. Anyone with link can open it
4. Works immediately, no server needed

### Option B: GitHub Pages (Free Hosting)

1. Create GitHub account (free)
2. Create repository called "produce-processor"
3. Upload the HTML file
4. Enable GitHub Pages in settings
5. Get URL like: `https://yourusername.github.io/produce-processor`

### Option C: Firebase Hosting (Best)

1. In Firebase Console, click **"Hosting"** in left sidebar
2. Click **"Get started"**
3. Install Firebase CLI: `npm install -g firebase-tools`
4. Run: `firebase init hosting`
5. Deploy: `firebase deploy --only hosting`
6. Get URL like: `https://produce-processor.web.app`

## Troubleshooting

### "🔴 Offline" showing

**Solution**: Check your firebaseConfig - make sure you pasted the correct values

### Can't upload CSV or videos

**Solution**: Make sure you're in "Edit Mode" (not "View Mode")

### Videos not appearing on other devices

**Solution**: 
1. Check Storage rules are set correctly
2. Wait 10-20 seconds for upload to complete
3. Check internet connection

### Data not syncing between devices

**Solution**:
1. Check both devices show "🟢 Connected"
2. Verify both are using the same HTML file with same Firebase config
3. Try refreshing the page

### "Permission denied" errors

**Solution**: Double-check the security rules in Step 3 and Step 4

## Firebase Free Tier Limits

You get these for FREE:
- **Storage**: 5 GB
- **Database**: 1 GB stored, 10 GB/month downloaded
- **Bandwidth**: 360 MB/day

**For your co-op:**
- Timing data: Negligible (< 1 MB even with years of data)
- Videos: ~10-50 MB each (can store 100+ videos)
- Multiple devices viewing: No extra cost

You'll stay well within free limits!

## Security Notes

The current setup allows anyone with the HTML file to access the data. This is fine for:
- ✅ Internal co-op use
- ✅ Trusted team members
- ✅ Private network

For more security, you could add:
- Firebase Authentication (Google sign-in)
- Custom security rules
- API restrictions in Firebase Console

## Support

If you run into issues:
1. Check the Firebase Console for error messages
2. Look at browser console (right-click → Inspect → Console)
3. Verify all steps were completed
4. Make sure internet connection is working

## Summary

Once set up:
- **Main iPad**: Edit mode - upload CSVs, videos, timing
- **All other devices**: View mode - see real-time progress
- **Everyone sees**: Same data, updates instantly
- **Data persists**: Even if all devices are closed
- **No maintenance**: Just works!

The setup takes 15 minutes once, then it works forever (free tier).
