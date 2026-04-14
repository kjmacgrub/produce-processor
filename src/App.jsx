import { useState, useEffect, useRef, useMemo } from 'react';
import { ref, onValue, get, set, remove, push, child, update } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from './firebase';
import { Upload, Play, Package, ClipboardList, Video, Timer, Eye, Pencil, Clock, AlertCircle, StickyNote } from 'lucide-react';

const ProduceProcessorApp = () => {
  const [items, setItems] = useState([]);
  const [timingData, setTimingData] = useState({});
  const [videos, setVideos] = useState({});
  const [activeItem, setActiveItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showVideoUpload, setShowVideoUpload] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const readOnlyMode = false;
  const [isIPad] = useState(() => /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);
  const [isPhone] = useState(() => /iPhone/.test(navigator.userAgent) || (/Android/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent)));
  const [pdfDate, setPdfDate] = useState('');

  const isNotToday = useMemo(() => {
    if (!pdfDate) return false;
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return pdfDate !== todayStr;
  }, [pdfDate]);

  const weekInfo = useMemo(() => {
    const base = pdfDate ? new Date(pdfDate + 'T00:00:00') : new Date();
    const julianDay = Math.floor(
      (Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()) -
       Date.UTC(base.getFullYear(), 0, 0)) / 86400000
    );
    const d = new Date(Date.UTC(base.getFullYear(), base.getMonth(), base.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const palette = [
      { bg: '#ff1744', border: '#d50000', text: '#ffffff', bgLight: '#ff6680' },
      { bg: '#0091ea', border: '#0064b7', text: '#ffffff', bgLight: '#40baff' },
      { bg: '#ffc400', border: '#d4a000', text: '#1a1a1a', bgLight: '#ffd740' },
      { bg: '#00e676', border: '#00b248', text: '#1a1a1a', bgLight: '#69f0ae' },
    ];
    return { julianDay, weekNum, ...palette[(weekNum - 1) % 4] };
  }, [pdfDate]);

  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingItemId, setRecordingItemId] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);

  const [showTimingEvents, setShowTimingEvents] = useState(null);
  const [originalTotalCases, setOriginalTotalCases] = useState(0);
  const [itemsInProcess, setItemsInProcess] = useState({});
  const [itemsPaused, setItemsPaused] = useState({});
  const [pausedElapsedTime, setPausedElapsedTime] = useState({});
  const [historicalTimes, setHistoricalTimes] = useState({});
  const [timingEventsBySKU, setTimingEventsBySKU] = useState({});
  const [elapsedTimes, setElapsedTimes] = useState({});
  const [showStoragePicker, setShowStoragePicker] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [historicalPriorities, setHistoricalPriorities] = useState([]);
  const [showPriorityEditor, setShowPriorityEditor] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState({});
  const [showCompletionCamera, setShowCompletionCamera] = useState(null);
  const [showPhotoChoice, setShowPhotoChoice] = useState(null);
  const [itemPhotoTarget, setItemPhotoTarget] = useState(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationEditText, setLocationEditText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [displayCount, setDisplayCount] = useState(2);
  const [newItemName, setNewItemName] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemCases, setNewItemCases] = useState('1');
  const [newItemPriority, setNewItemPriority] = useState('missing');
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [commits, setCommits] = useState([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [showReckoning, setShowReckoning] = useState(false);
  const [reckoningItems, setReckoningItems] = useState([]);
  const [reckoningDecisions, setReckoningDecisions] = useState({});
  const [pendingLoad, setPendingLoad] = useState(null);
  const [showCasesPrompt, setShowCasesPrompt] = useState(null);
  const [casesPromptValue, setCasesPromptValue] = useState(1);
  const [mediaVideoURLs, setMediaVideoURLs] = useState({});
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [storageFiles, setStorageFiles] = useState(null);
  const [loadingStorageFiles, setLoadingStorageFiles] = useState(false);
  const [oosItems, setOosItems] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [showNotesBrowser, setShowNotesBrowser] = useState(false);
  const [notesBrowserDate, setNotesBrowserDate] = useState(null);
  const [editingItemNote, setEditingItemNote] = useState(null);
  const [itemNoteText, setItemNoteText] = useState('');
  const [editingFreeformNote, setEditingFreeformNote] = useState(null);
  const [freeformNoteText, setFreeformNoteText] = useState('');
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [dailyLogData, setDailyLogData] = useState(null);
  const [dailyLogList, setDailyLogList] = useState(null);
  const [dailyLogSearch, setDailyLogSearch] = useState('');
  const [dailyLogSearchResults, setDailyLogSearchResults] = useState(null);

  const fileInputRef = useRef(null);
  const cloverUploadRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const itemPhotoInputRef = useRef(null);
  const playbackVideoRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // Fetch O/S items from Delivery app
  useEffect(() => {
    fetch('https://delivery-app-481756503401.us-east1.run.app/api/v1/oos-items')
      .then(r => r.json())
      .then(data => setOosItems(new Set(data.oos || [])))
      .catch(() => {});
  }, []);

  // Check Firebase connection
  useEffect(() => {
    if (!db) return;
    const connectedRef = ref(db, '.info/connected');
    const unsub = onValue(connectedRef, (snap) => {
      setFirebaseConnected(snap.val() === true);
    });
    return () => unsub();
  }, []);

  // Force video loop to false when playback video changes
  useEffect(() => {
    if (playbackVideoRef.current && playingVideo) {
      const video = playbackVideoRef.current;
      video.loop = false;
      const handleEnded = () => { video.pause(); video.currentTime = video.duration; };
      video.addEventListener('ended', handleEnded);
      const intervalId = setInterval(() => { if (video.loop === true) video.loop = false; }, 100);
      return () => { video.removeEventListener('ended', handleEnded); clearInterval(intervalId); };
    }
  }, [playingVideo]);

  // Load timing data from Firebase
  useEffect(() => {
    if (!db) return;
    const timingRef = ref(db, 'timingData');
    const unsub = onValue(timingRef, (snapshot) => { const data = snapshot.val(); if (data) setTimingData(data); });
    return () => unsub();
  }, []);

  // Reset photo state when camera modal closes
  useEffect(() => {
    if (!showCompletionCamera) { setPhotoTaken(false); setPhotoData(null); }
  }, [showCompletionCamera]);

  // Update elapsed time for items in process every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updates = {};
      Object.keys(itemsInProcess).forEach(itemId => { updates[itemId] = Math.floor((now - itemsInProcess[itemId]) / 1000); });
      Object.keys(itemsPaused).forEach(itemId => { if (itemsPaused[itemId] && pausedElapsedTime[itemId] !== undefined) updates[itemId] = pausedElapsedTime[itemId]; });
      setElapsedTimes(updates);
    }, 1000);
    return () => clearInterval(interval);
  }, [itemsInProcess, itemsPaused, pausedElapsedTime]);

  // Keyboard shortcut: Hold Shift, then press V, then M
  useEffect(() => {
    let keySequence = [];
    let shiftHeld = false;
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') { shiftHeld = true; keySequence = []; return; }
      if (shiftHeld && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'm')) {
        keySequence.push(e.key.toLowerCase());
        if (keySequence.length === 2 && keySequence[0] === 'v' && keySequence[1] === 'm') { e.preventDefault(); keySequence = []; }
        if (keySequence.length > 2) keySequence = [];
      }
    };
    const handleKeyUp = (e) => { if (e.key === 'Shift') { shiftHeld = false; keySequence = []; } };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  // Processing timer
  const getCurrentDuration = () => { if (!startTime) return 0; return (Date.now() - startTime) / 1000; };
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => setCurrentTime(getCurrentDuration()), 100);
    return () => clearInterval(interval);
  }, [isProcessing, startTime]);

  // Fetch video URL from Firebase Storage
  useEffect(() => {
    const loadVideoURL = async () => {
      if (!playingVideo || !videos[playingVideo]) { setVideoSrc(null); setVideoError(null); setVideoLoading(false); return; }
      const videoData = videos[playingVideo];
      if (!videoData || !videoData.exists) { setVideoSrc(null); setVideoError('Video not found'); setVideoLoading(false); return; }
      try {
        setVideoLoading(true); setVideoError(null);
        const url = await getVideoURL(playingVideo);
        if (url) { setVideoSrc(url); setVideoError(null); } else { setVideoSrc(null); setVideoError('Video not found in storage'); }
      } catch (error) { setVideoSrc(null); setVideoError(error.message); } finally { setVideoLoading(false); }
    };
    loadVideoURL();
  }, [playingVideo, videos]);

  // Load items from Firebase
  useEffect(() => {
    if (!db) return;
    const itemsRef = ref(db, 'items');
    const unsub = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) { const arr = Object.keys(data).map(key => ({ ...data[key], id: key })); arr.sort((a, b) => a.priority - b.priority); setItems(arr); } else { setItems([]); }
    });
    return () => unsub();
  }, []);

  // Load file date from Firebase
  useEffect(() => {
    if (!db) return;
    const dateRef = ref(db, 'pdfDate');
    const unsub = onValue(dateRef, (snapshot) => { const date = snapshot.val(); if (date) setPdfDate(date); });
    return () => unsub();
  }, []);

  // Load original total cases from Firebase
  useEffect(() => {
    if (!db) return;
    const totalRef = ref(db, 'totalCases');
    const unsub = onValue(totalRef, (snapshot) => { setOriginalTotalCases(snapshot.val() || 0); });
    return () => unsub();
  }, []);

  // Load completed items from Firebase
  useEffect(() => {
    if (!db) return;
    const completedRef = ref(db, 'completedItems');
    const unsub = onValue(completedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) { const arr = Object.keys(data).map(key => ({ ...data[key], id: key })); arr.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)); setCompletedItems(arr); } else { setCompletedItems([]); }
    });
    return () => unsub();
  }, []);

  const [photosLoaded, setPhotosLoaded] = useState(false);

  // Load completion photos from Firebase
  useEffect(() => {
    if (!db) return;
    const photosRef = ref(db, 'completionPhotos');
    const unsub = onValue(photosRef, (snapshot) => { const data = snapshot.val(); if (data) { setCompletionPhotos(data); } else { setCompletionPhotos({}); } setPhotosLoaded(true); });
    return () => unsub();
  }, []);

  // Load historical times from Firebase
  useEffect(() => {
    if (!db) return;
    const timesRef = ref(db, 'historicalTimes');
    const unsub = onValue(timesRef, (snapshot) => { const data = snapshot.val(); setHistoricalTimes(data || {}); });
    return () => unsub();
  }, []);

  // Load timing events from Firebase
  useEffect(() => {
    if (!db) return;
    const eventsRef = ref(db, 'timingEvents');
    const unsub = onValue(eventsRef, (snapshot) => { const data = snapshot.val(); setTimingEventsBySKU(data || {}); });
    return () => unsub();
  }, []);

  // Load video URLs for media manager
  useEffect(() => {
    if (!showMediaManager) { setMediaVideoURLs({}); return; }
    Object.keys(videos).forEach(async (sku) => {
      const url = await getVideoURL(sku);
      if (url) setMediaVideoURLs(prev => ({ ...prev, [sku]: url }));
    });
  }, [showMediaManager, videos]);

  // Load video index from Firebase (real-time sync across devices)
  useEffect(() => {
    if (!db) return;
    const videoIndexRef = ref(db, 'videoIndex');
    const unsub = onValue(videoIndexRef, (snapshot) => {
      const data = snapshot.val();
      setVideos(data || {});
    });
    return () => unsub();
  }, []);

  // Load historical priorities from Firebase
  useEffect(() => {
    if (!db) return;
    const prioritiesRef = ref(db, 'historicalPriorities');
    const unsub = onValue(prioritiesRef, (snapshot) => {
      const data = snapshot.val();
      const priorities = firebaseToArray(data);
      const sorted = [...new Set(priorities)].sort((a, b) => {
        const aIsNumber = typeof a === 'number' && a > 0;
        const bIsNumber = typeof b === 'number' && b > 0;
        if (aIsNumber && bIsNumber) return a - b;
        if (aIsNumber) return -1; if (bIsNumber) return 1;
        if (a === 'missing') return -1; if (b === 'missing') return 1;
        return 0;
      });
      setHistoricalPriorities(sorted);
    });
    return () => unsub();
  }, []);

  // Load notes from Firebase
  useEffect(() => {
    if (!db) return;
    const notesRef = ref(db, 'notes');
    const unsub = onValue(notesRef, (snapshot) => { setNotes(snapshot.val() || {}); });
    return () => unsub();
  }, []);

  // Cleanup notes older than 10 days
  useEffect(() => {
    if (!db) return;
    const cleanupOldNotes = async () => {
      try {
        const notesRef = ref(db, 'notes');
        const snapshot = await get(notesRef);
        const data = snapshot.val();
        if (!data) return;
        const tenDaysAgo = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000));
        for (const dateKey in data) {
          if (new Date(dateKey + 'T00:00:00') < tenDaysAgo) {
            await remove(ref(db, `notes/${dateKey}`));
          }
        }
      } catch (error) { console.error('Error cleaning up old notes:', error); }
    };
    cleanupOldNotes();
    const intervalId = setInterval(cleanupOldNotes, 24 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Cleanup completed items older than 10 days
  useEffect(() => {
    if (!db) return;
    const cleanupOldCompletedItems = async () => {
      try {
        const completedRef = ref(db, 'completedItems');
        const snapshot = await get(completedRef);
        const completedData = snapshot.val();
        if (!completedData) return;
        const tenDaysAgo = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000));
        for (const key in completedData) {
          if (new Date(completedData[key].completedAt) < tenDaysAgo) {
            await remove(ref(db, `completedItems/${key}`));
          }
        }
      } catch (error) { console.error('Error cleaning up old completed items:', error); }
    };
    cleanupOldCompletedItems();
    const intervalId = setInterval(cleanupOldCompletedItems, 24 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Load videos from Storage and migrate timing data on mount
  useEffect(() => {
    const migrateAndLoad = async () => {
      try { const oldVideos = localStorage.getItem('produceVideos'); if (oldVideos) localStorage.removeItem('produceVideos'); } catch (error) {}
      // Migrate existing Storage videos into the Realtime DB index (one-time, for pre-existing videos)
      if (db) {
        try {
          const snapshot = await get(ref(db, 'videoIndex'));
          if (!snapshot.exists()) {
            const storageVideos = await listAllVideosFromStorage();
            if (Object.keys(storageVideos).length > 0) await set(ref(db, 'videoIndex'), storageVideos);
          }
        } catch (error) { console.error('Error migrating video index:', error); }
      }
      const loadedPhotos = await loadAllCompletionPhotosFromDB();
      setCompletionPhotos(loadedPhotos);
      if (db) {
        try {
          const migrationFlag = localStorage.getItem('timingDataMigrated');
          if (!migrationFlag) {
            const loadedTimes = await loadAllHistoricalTimesFromDB();
            const loadedEvents = await loadAllTimingEventsFromDB();
            if (Object.keys(loadedTimes).length > 0) await set(ref(db, 'historicalTimes'), loadedTimes);
            if (Object.keys(loadedEvents).length > 0) await set(ref(db, 'timingEvents'), loadedEvents);
            localStorage.setItem('timingDataMigrated', 'true');
          }
        } catch (error) { console.error('Error during timing data migration:', error); }
      }
    };
    migrateAndLoad();
  }, []);

  // Load available files when landing is shown
  useEffect(() => {
    if (showLanding && storage) {
      listAvailableCSVs().then(dates => setAvailableDates(dates));
    }
  }, [showLanding]);

  // Auto-skip landing when file is already loaded
  useEffect(() => {
    if (pdfDate && showLanding) setShowLanding(false);
  }, [pdfDate]);

  // Pull-to-refresh detection
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e) => { if (selectMode) return; if (window.scrollY === 0) startY = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      if (window.scrollY === 0 && startY > 0) {
        const distance = e.touches[0].clientY - startY;
        if (distance > 0 && distance < 150) { setPullDistance(distance); setIsPulling(true); }
      }
    };
    const handleTouchEnd = () => { if (isPulling && pullDistance > 80) checkAndSyncData(); setIsPulling(false); setPullDistance(0); startY = 0; };
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    return () => { document.removeEventListener('touchstart', handleTouchStart); document.removeEventListener('touchmove', handleTouchMove); document.removeEventListener('touchend', handleTouchEnd); };
  }, [isPulling, pullDistance, isProcessing, pdfDate, selectMode]);

  // IndexedDB setup for video storage
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ProduceVideoDB', 4);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const idb = event.target.result;
        if (!idb.objectStoreNames.contains('videos')) idb.createObjectStore('videos', { keyPath: 'id' });
        if (!idb.objectStoreNames.contains('historicalTimes')) idb.createObjectStore('historicalTimes', { keyPath: 'id' });
        if (!idb.objectStoreNames.contains('timingEvents')) idb.createObjectStore('timingEvents', { keyPath: 'id' });
        if (!idb.objectStoreNames.contains('completionPhotos')) idb.createObjectStore('completionPhotos', { keyPath: 'id' });
      };
    });
  };

  const saveCompletionPhotoToDB = async (sku, pd, itemName) => {
    try {
      const idb = await openDB();
      const tx = idb.transaction(['completionPhotos'], 'readwrite');
      tx.objectStore('completionPhotos').put({ id: sku, data: pd.data, timestamp: pd.timestamp, name: itemName });
      if (db) await set(ref(db, `completionPhotos/${sku}`), { data: pd.data, timestamp: pd.timestamp, name: itemName });
    } catch (error) { console.error('Error saving completion photo:', error); alert('Error saving photo.'); }
  };

  const deleteCompletionPhotoFromDB = async (sku) => {
    try {
      const idb = await openDB();
      const tx = idb.transaction(['completionPhotos'], 'readwrite');
      tx.objectStore('completionPhotos').delete(sku);
      if (db) await remove(ref(db, `completionPhotos/${sku}`));
    } catch (error) { console.error('Error deleting completion photo:', error); }
  };

  const loadAllCompletionPhotosFromDB = async () => {
    try {
      const idb = await openDB();
      const tx = idb.transaction(['completionPhotos'], 'readonly');
      const request = tx.objectStore('completionPhotos').getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => { const photos = {}; request.result.forEach(p => { photos[p.id] = { data: p.data, timestamp: p.timestamp }; }); resolve(photos); };
        request.onerror = () => reject(request.error);
      });
    } catch (error) { return {}; }
  };

  const saveHistoricalTimeToDB = async (sku, timePerCase) => {
    try { const idb = await openDB(); idb.transaction(['historicalTimes'], 'readwrite').objectStore('historicalTimes').put({ id: sku, timePerCase }); } catch (error) {}
  };

  const loadAllHistoricalTimesFromDB = async () => {
    try {
      const idb = await openDB();
      const request = idb.transaction(['historicalTimes'], 'readonly').objectStore('historicalTimes').getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => { const times = {}; request.result.forEach(r => { times[r.id] = r.timePerCase; }); resolve(times); };
        request.onerror = () => reject(request.error);
      });
    } catch (error) { return {}; }
  };

  const saveTimingEventToDB = async (sku, event) => {
    try {
      const idb = await openDB();
      const store = idb.transaction(['timingEvents'], 'readwrite').objectStore('timingEvents');
      const getReq = store.get(sku);
      return new Promise((resolve, reject) => {
        getReq.onsuccess = () => { const existing = getReq.result; const events = existing ? existing.events : []; events.push(event); store.put({ id: sku, events }); resolve(); };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (error) {}
  };

  const loadAllTimingEventsFromDB = async () => {
    try {
      const idb = await openDB();
      const request = idb.transaction(['timingEvents'], 'readonly').objectStore('timingEvents').getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => { const te = {}; request.result.forEach(r => { te[r.id] = r.events || []; }); resolve(te); };
        request.onerror = () => reject(request.error);
      });
    } catch (error) { return {}; }
  };

  const deleteTimingEventFromDB = async (sku, eventIndex) => {
    try {
      const idb = await openDB();
      const store = idb.transaction(['timingEvents'], 'readwrite').objectStore('timingEvents');
      const getReq = store.get(sku);
      return new Promise((resolve, reject) => {
        getReq.onsuccess = () => { const existing = getReq.result; if (existing && existing.events) { existing.events.splice(eventIndex, 1); store.put(existing); } resolve(); };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (error) {}
  };

  // FIREBASE STORAGE - VIDEO FUNCTIONS
  const saveVideoToStorage = async (sku, videoData) => {
    if (!storage) return;
    try {
      const filename = `${sku}.webm`;
      const storageRef = sRef(storage, `produce-videos/${filename}`);
      let blob;
      if (videoData.data instanceof ArrayBuffer) blob = new Blob([videoData.data], { type: videoData.type || 'video/webm' });
      else if (typeof videoData.data === 'string' && videoData.data.startsWith('data:')) { const r = await fetch(videoData.data); blob = await r.blob(); }
      else if (videoData.data instanceof Blob) blob = videoData.data;
      else throw new Error('Unknown video data format');
      if (!blob || blob.size === 0) throw new Error('Video blob is empty or invalid');
      await uploadBytes(storageRef, blob, { contentType: videoData.type || 'video/webm', customMetadata: { sku, uploadedAt: new Date().toISOString() } });
      if (db) await set(ref(db, `videoIndex/${sku}`), { exists: true, filename, storageRef: `produce-videos/${filename}`, name: videoData.itemName });
    } catch (error) { console.error('Error uploading video:', error); throw error; }
  };

  const deleteVideoFromStorage = async (sku) => {
    if (!storage) return;
    try {
      await deleteObject(sRef(storage, `produce-videos/${sku}.webm`));
      if (db) await remove(ref(db, `videoIndex/${sku}`));
    } catch (error) { if (error.code !== 'storage/object-not-found') console.error('Error deleting video:', error); }
  };

  const listAllVideosFromStorage = async () => {
    if (!storage) return {};
    try {
      const result = await listAll(sRef(storage, 'produce-videos'));
      const vids = {};
      for (const itemRef of result.items) {
        const sku = itemRef.name.replace('.webm', '');
        vids[sku] = { exists: true, filename: itemRef.name, storageRef: itemRef.fullPath };
      }
      return vids;
    } catch (error) { console.error('Error listing videos:', error); return {}; }
  };

  const getVideoURL = async (sku) => {
    if (!storage) return null;
    try { return await getDownloadURL(sRef(storage, `produce-videos/${sku}.webm`)); }
    catch (error) { if (error.code !== 'storage/object-not-found') console.error('Error getting video URL:', error); return null; }
  };

  const saveVideoToDB = saveVideoToStorage;
  const deleteVideoFromDB = deleteVideoFromStorage;
  const loadAllVideosFromDB = listAllVideosFromStorage;

  // FIREBASE STORAGE - DATA FILE FUNCTIONS
  const listAvailableCSVs = async () => {
    if (!storage) return [];
    try {
      const result = await listAll(sRef(storage, 'produce-csv'));
      const csvFiles = result.items.filter(item => item.name.toLowerCase().endsWith('.csv'));
      console.log(`📂 Found ${csvFiles.length} CSV files in produce-csv:`, csvFiles.map(f => f.name));
      const filesWithDates = await Promise.all(csvFiles.map(async (fileRef) => {
        try {
          const url = await getDownloadURL(fileRef);
          const response = await fetch(url);
          const text = await response.text();
          // Try first line for date
          const firstLine = text.split(/\r?\n/)[0];
          const dateMatch = firstLine.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) return { filename: fileRef.name, date: dateMatch[1], fileType: 'csv' };
          // Fallback: try filename for date
          const filenameMatch = fileRef.name.match(/(\d{4}-\d{2}-\d{2})/);
          if (filenameMatch) return { filename: fileRef.name, date: filenameMatch[1], fileType: 'csv' };
          // Fallback: try any line in the file for a date
          const anyDateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
          if (anyDateMatch) return { filename: fileRef.name, date: anyDateMatch[1], fileType: 'csv' };
          console.warn(`⚠️ No date found in file: ${fileRef.name}`);
          return null;
        } catch (error) { console.error(`❌ Error reading file ${fileRef.name}:`, error); return null; }
      }));
      const validFiles = filesWithDates.filter(Boolean);
      validFiles.sort((a, b) => b.date.localeCompare(a.date));
      console.log(`✅ Valid files with dates:`, validFiles);
      return validFiles;
    } catch (error) { console.error('Error listing files:', error); return []; }
  };

  const loadCSVFromStorage = async (fileInfo) => {
    if (!storage || !db || readOnlyMode) return;
    try {
      const storageRef = sRef(storage, `produce-csv/${fileInfo.filename}`);
      const url = await getDownloadURL(storageRef);
      const response = await fetch(url);
      const text = await response.text();
      await processCSVData(text, fileInfo.date);
    } catch (error) { console.error('Error loading CSV:', error); alert('Could not load CSV: ' + error.message); }
  };

  const processCSVData = async (csvText, dateHint = null) => {
    try {
      const lines = csvText.split(/\r?\n/);
      const headerIndex = lines.findIndex(line => line.startsWith('task,instruction'));
      if (headerIndex === -1) throw new Error('Could not find CSV header row');
      const parsedItems = [];
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { fields.push(currentField.trim()); currentField = ''; }
          else currentField += char;
        }
        fields.push(currentField.trim());
        const [task, instruction, caseQty, item, notes, checkInNotes] = fields;
        if (!item || !caseQty || !item.includes('#')) continue;
        const cases = parseInt(caseQty);
        if (isNaN(cases) || cases <= 0) continue;
        let priority = 'missing';
        let location = instruction || 'See file';
        if (instruction) {
          const priorityMatch = instruction.match(/^([0-9U])\s*-\s*(.+)$/);
          if (priorityMatch) { priority = priorityMatch[1] === 'U' ? 'missing' : parseInt(priorityMatch[1]); location = priorityMatch[2].trim(); }
        }
        parsedItems.push({ name: item.trim(), priority, cases, location });
      }
      const totalCases = parsedItems.reduce((sum, item) => sum + item.cases, 0);
      const sortedForOrder = [...parsedItems].sort((a, b) => {
        const pa = a.priority === 'missing' ? 9999 : a.priority;
        const pb = b.priority === 'missing' ? 9999 : b.priority;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      });
      const itemsWithIds = sortedForOrder.map((item, index) => ({ id: `item-${Date.now()}-${index}`, sortOrder: index, ...item }));
      const itemsObject = {};
      itemsWithIds.forEach(item => { itemsObject[item.id] = item; });
      let csvDate = dateHint;
      if (!csvDate) {
        const dateMatch = lines[0].match(/(\d{4}-\d{2}-\d{2})/);
        csvDate = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      }
      const existingSnap = await get(ref(db, 'items'));
      const existingItems = existingSnap.val() ? Object.values(existingSnap.val()) : [];
      if (existingItems.length > 0) {
        setPendingLoad({ itemsObject, totalCases, dateStr: csvDate });
        setReckoningItems(existingItems);
        const defaults = {};
        existingItems.forEach(item => { defaults[item.id] = { action: 'carry', cases: item.cases }; });
        setReckoningDecisions(defaults);
        setShowReckoning(true);
      } else {
        await set(ref(db, 'items'), itemsObject);
        await set(ref(db, 'completedItems'), {});
        await set(ref(db, 'totalCases'), totalCases);
        setOriginalTotalCases(totalCases);
        await set(ref(db, 'pdfDate'), csvDate);
      }
    } catch (error) { console.error('Error processing CSV:', error); alert('Error processing CSV: ' + error.message); }
  };

  const processPDFData = async (arrayBuffer, dateHint = null) => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let lastY = -1; let currentLine = '';
        for (let item of textContent.items) {
          const y = item.transform[5];
          if (lastY !== -1 && Math.abs(lastY - y) > 2) { fullText += currentLine + '\n'; currentLine = ''; }
          currentLine += item.str + ' '; lastY = y;
        }
        if (currentLine) fullText += currentLine + '\n';
      }
      const dateMatch = fullText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      let extractedDate = null;
      if (dateMatch) extractedDate = dateMatch[1];
      else if (dateHint) { const parts = dateHint.split('-'); extractedDate = `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0]}`; }
      if (extractedDate) { setPdfDate(extractedDate); await set(ref(db, 'pdfDate'), extractedDate); }
      let cleanText = fullText.replace(/First character determines priority.*?area\./gi, '');
      cleanText = cleanText.replace(/Cases\s+(Process on ground floor|Top Priority|Next Priority|Not Refrigerated|Do by belt|U)\s+Instructions/gi, '');
      cleanText = cleanText.replace(/Thursday|Wednesday|Monday|Tuesday|Friday|Saturday|Sunday/gi, '');
      cleanText = cleanText.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, '');
      cleanText = cleanText.replace(/Processing Priorities/gi, '');
      cleanText = cleanText.replace(/Total cases\s+\d+/gi, '');
      cleanText = cleanText.replace(/Day \d+ Week \d+/gi, '');
      const itemBlocks = cleanText.split(/\n/).filter(line => line.trim());
      const parsedItems = [];
      let idx = 0;
      const sectionHeaders = ['Cases Process on ground floor','Cases Top Priority','Cases Next Priority','Cases Not Refrigerated','Cases Do by belt or other area','Cases U'];
      while (idx < itemBlocks.length) {
        const line = itemBlocks[idx].trim();
        const casesMatch = line.match(/^(\d+)\s+(.+)$/);
        if (!casesMatch) { idx++; continue; }
        const cases = parseInt(casesMatch[1]);
        let itemText = casesMatch[2];
        idx++;
        while (idx < itemBlocks.length && !itemText.match(/[0-9U]\s*-\s*/)) {
          const nextLine = itemBlocks[idx].trim();
          if (sectionHeaders.some(h => nextLine.startsWith(h)) || nextLine.startsWith('Cases')) break;
          itemText += ' ' + nextLine; idx++;
        }
        while (idx < itemBlocks.length && !itemBlocks[idx].trim().match(/^\d+\s/)) {
          const nextLine = itemBlocks[idx].trim();
          if (sectionHeaders.some(h => nextLine.startsWith(h)) || nextLine.startsWith('Cases')) break;
          itemText += ' ' + nextLine; idx++;
        }
        const priorityMatch = itemText.match(/^(.+?)\s+([0-9U])\s*-\s*(.+)$/);
        if (priorityMatch) {
          const name = priorityMatch[1].trim();
          const priority = priorityMatch[2] === 'U' ? 'missing' : parseInt(priorityMatch[2]);
          if (name.includes('#') && cases > 0) parsedItems.push({ name, priority, cases, location: priorityMatch[3].trim() });
        } else {
          const noDashMatch = itemText.match(/^(.+?#\d+)\s+([0-9U])\s+(.+)$/);
          if (noDashMatch) {
            const priority = noDashMatch[2] === 'U' ? 'missing' : parseInt(noDashMatch[2]);
            if (cases > 0) parsedItems.push({ name: noDashMatch[1].trim(), priority, cases, location: noDashMatch[3].trim() });
          } else {
            const name = itemText.trim();
            if (name.includes('#') && cases > 0) {
              const locMatch = name.match(/^(.+?)\s+-\s+(.+)$/);
              if (locMatch) parsedItems.push({ name: locMatch[1].trim(), priority: 'missing', cases, location: locMatch[2].trim() });
              else parsedItems.push({ name, priority: 'missing', cases, location: 'See PDF' });
            }
          }
        }
      }
      const totalCases = parsedItems.reduce((sum, item) => sum + item.cases, 0);
      const sortedForOrderPdf = [...parsedItems].sort((a, b) => {
        const pa = a.priority === 'missing' ? 9999 : a.priority;
        const pb = b.priority === 'missing' ? 9999 : b.priority;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      });
      const newItems = {};
      sortedForOrderPdf.forEach((item, index) => { const key = push(child(ref(db), 'items')).key; newItems[key] = { ...item, sortOrder: index }; });
      const pdfDateStr = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      const newPriorities = [...new Set(parsedItems.map(item => item.priority))];
      const snap = await get(ref(db, 'historicalPriorities'));
      const currentPriorities = firebaseToArray(snap.val());
      const combined = [...new Set([...currentPriorities, ...newPriorities])].sort((a, b) => {
        const aN = typeof a === 'number' && a > 0, bN = typeof b === 'number' && b > 0;
        if (aN && bN) return a - b; if (aN) return -1; if (bN) return 1;
        if (a === 'missing') return -1; if (b === 'missing') return 1; return 0;
      });
      await set(ref(db, 'historicalPriorities'), combined);
      const existingSnapPdf = await get(ref(db, 'items'));
      const existingItemsPdf = existingSnapPdf.val() ? Object.values(existingSnapPdf.val()) : [];
      if (existingItemsPdf.length > 0) {
        setPendingLoad({ itemsObject: newItems, totalCases, dateStr: pdfDateStr, isPdf: true });
        setReckoningItems(existingItemsPdf);
        const defaults = {};
        existingItemsPdf.forEach(item => { defaults[item.id] = { action: 'carry', cases: item.cases }; });
        setReckoningDecisions(defaults);
        setShowReckoning(true);
      } else {
        const itemsRef2 = ref(db, 'items');
        await remove(itemsRef2);
        await update(itemsRef2, newItems);
        await remove(ref(db, 'completedItems'));
        await set(ref(db, 'pdfDate'), pdfDateStr);
        await set(ref(db, 'originalTotalCases'), totalCases);
      }
    } catch (error) { console.error('Error processing PDF:', error); alert('Error processing PDF: ' + error.message); }
  };

  const checkAndSyncData = async () => {
    if (!db) return;
    if (isProcessing) { setRefreshMessage('Waiting for processing to finish...'); setTimeout(() => setRefreshMessage(''), 3000); return; }
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dateSnapshot = await get(ref(db, 'pdfDate'));
      const firebaseDate = dateSnapshot.val();
      if (firebaseDate !== todayStr) {
        await remove(ref(db, 'items')); await remove(ref(db, 'completedItems')); await remove(ref(db, 'pdfDate')); await remove(ref(db, 'totalCases'));
        setItems([]); setCompletedItems([]); setPdfDate(''); setOriginalTotalCases(0); setActiveItem(null); setIsProcessing(false); setStartTime(null);
        setItemsInProcess({}); setItemsPaused({}); setPausedElapsedTime({}); setElapsedTimes({});
        setRefreshMessage('No data for today. Local data cleared.'); setTimeout(() => setRefreshMessage(''), 3000); return;
      }
      if (!pdfDate || pdfDate !== todayStr) {
        setRefreshMessage('Loading today\'s data...');
        const itemsSnap = await get(ref(db, 'items'));
        if (itemsSnap.val()) setItems(Object.keys(itemsSnap.val()).map(id => ({ id, ...itemsSnap.val()[id] })));
        const compSnap = await get(ref(db, 'completedItems'));
        if (compSnap.val()) setCompletedItems(Object.keys(compSnap.val()).map(id => ({ id, ...compSnap.val()[id] })));
        const totalSnap = await get(ref(db, 'totalCases'));
        if (totalSnap.val()) setOriginalTotalCases(totalSnap.val());
        setPdfDate(todayStr);
        setRefreshMessage('Today\'s data loaded!'); setTimeout(() => setRefreshMessage(''), 3000);
      } else { setRefreshMessage('Data is up to date'); setTimeout(() => setRefreshMessage(''), 2000); }
    } catch (error) { console.error('Error syncing data:', error); setRefreshMessage('Error syncing data'); setTimeout(() => setRefreshMessage(''), 3000); }
  };

  const clearCurrentFile = async () => {
    if (!db) return;
    await remove(ref(db, 'items'));
    await remove(ref(db, 'completedItems'));
    await remove(ref(db, 'pdfDate'));
    await remove(ref(db, 'totalCases'));
    setItems([]); setCompletedItems([]); setPdfDate(''); setOriginalTotalCases(0);
    setActiveItem(null); setIsProcessing(false); setStartTime(null);
    setItemsInProcess({}); setItemsPaused({}); setPausedElapsedTime({}); setElapsedTimes({});
  };

  // --- Notes helpers ---
  const saveItemNote = async (itemId, text, itemName) => {
    if (!db || !pdfDate) return;
    const noteRef = ref(db, `notes/${pdfDate}/itemNotes/${itemId}`);
    if (text.trim()) {
      await set(noteRef, { text: text.trim(), itemName, updatedAt: new Date().toISOString() });
    } else {
      await remove(noteRef);
    }
  };

  const saveFreeformNote = async (noteId, text) => {
    if (!db || !pdfDate) return;
    if (noteId === 'new') {
      if (!text.trim()) return;
      const notesRef = ref(db, `notes/${pdfDate}/freeformNotes`);
      await push(notesRef, { text: text.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } else {
      const noteRef = ref(db, `notes/${pdfDate}/freeformNotes/${noteId}`);
      if (text.trim()) {
        await update(noteRef, { text: text.trim(), updatedAt: new Date().toISOString() });
      } else {
        await remove(noteRef);
      }
    }
  };

  const saveBrowserNote = async (dateKey, type, noteId, text, itemName) => {
    if (!db) return;
    if (type === 'item') {
      const noteRef = ref(db, `notes/${dateKey}/itemNotes/${noteId}`);
      if (text.trim()) {
        await update(noteRef, { text: text.trim(), updatedAt: new Date().toISOString() });
      } else {
        await remove(noteRef);
      }
    } else {
      const noteRef = ref(db, `notes/${dateKey}/freeformNotes/${noteId}`);
      if (text.trim()) {
        await update(noteRef, { text: text.trim(), updatedAt: new Date().toISOString() });
      } else {
        await remove(noteRef);
      }
    }
  };

  // ---- Daily Log (Delivery API) ----
  const DELIVERY_API = 'https://delivery-app-481756503401.us-east1.run.app/api/v1';

  const snapshotProcessingToLog = async (dateKey) => {
    if (!dateKey) return;
    try {
      const payload = {
        completedItems: completedItems.map(item => ({
          sku: item.id || '',
          itemName: item.name || '',
          cases: item.cases || 0,
          completedAt: item.completedAt || null,
          carryover: item.carryover || false,
        })),
        timingEvents: timingEventsBySKU || {},
        notes: notes[dateKey] || {},
        photos: completionPhotos || {},
      };
      await fetch(`${DELIVERY_API}/daily-logs/${dateKey}/snapshot-processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Daily log snapshot failed:', e);
    }
  };

  const loadDailyLogList = async () => {
    try {
      const res = await fetch(`${DELIVERY_API}/daily-logs`);
      const data = await res.json();
      setDailyLogList(data.logs || []);
      setDailyLogData(null);
      setDailyLogSearch('');
      setDailyLogSearchResults(null);
    } catch (e) {
      setDailyLogList([]);
    }
  };

  const loadDailyLogDetail = async (dateKey) => {
    try {
      const res = await fetch(`${DELIVERY_API}/daily-logs/${dateKey}`);
      const data = await res.json();
      setDailyLogData(data);
    } catch (e) {
      setDailyLogData(null);
    }
  };

  const searchDailyLogs = async (query) => {
    if (!query.trim()) { setDailyLogSearchResults(null); return; }
    try {
      const res = await fetch(`${DELIVERY_API}/daily-logs/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setDailyLogSearchResults(data);
    } catch (e) {
      setDailyLogSearchResults({ results: [], totalHits: 0 });
    }
  };

  const finishReckoning = async () => {
    if (!pendingLoad || !db) return;
    // Snapshot current day's processing data to daily log before clearing
    if (pdfDate && completedItems.length > 0) {
      await snapshotProcessingToLog(pdfDate);
    }
    const { itemsObject, totalCases, dateStr, isPdf } = pendingLoad;
    const carryItems = reckoningItems.filter(item => reckoningDecisions[item.id]?.action === 'carry');
    const carryObject = {};
    carryItems.forEach((item, idx) => {
      const newId = `carryover-${Date.now()}-${idx}`;
      carryObject[newId] = { ...item, id: newId, cases: reckoningDecisions[item.id]?.cases ?? item.cases, sortOrder: idx - carryItems.length, carryover: true };
    });
    const combined = { ...carryObject, ...itemsObject };
    const carryTotal = carryItems.reduce((sum, item) => sum + (reckoningDecisions[item.id]?.cases ?? item.cases), 0);
    const itemsRef = ref(db, 'items');
    await remove(itemsRef);
    if (isPdf) { await update(itemsRef, combined); } else { await set(itemsRef, combined); }
    await set(ref(db, 'completedItems'), {});
    await set(ref(db, 'totalCases'), totalCases + carryTotal);
    await set(ref(db, 'originalTotalCases'), totalCases + carryTotal);
    setOriginalTotalCases(totalCases + carryTotal);
    await set(ref(db, 'pdfDate'), dateStr);
    setShowReckoning(false);
    setReckoningItems([]);
    setReckoningDecisions({});
    setPendingLoad(null);
  };

  // HANDLER FUNCTIONS
  const handlePDFUpload = async (event) => {
    if (readOnlyMode || !db) return;
    const file = event.target.files[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      await processCSVData(text);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      await processPDFData(arrayBuffer);
    }
  };

  const handleCloverUpload = async (event) => {
    if (!storage || !db) return;
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const namePattern = /^\d{4}-\d{2}-\d{2}-produce-processing-report\.csv$/i;
    if (!namePattern.test(file.name)) {
      if (!window.confirm(`The filename "${file.name}" doesn't match the expected format (YYYY-MM-DD-produce-processing-report.csv). Upload anyway?`)) return;
    }
    try {
      const storageRef = sRef(storage, `produce-csv/${file.name}`);
      await uploadBytes(storageRef, file, { contentType: 'text/csv' });
      const text = await file.text();
      await processCSVData(text);
      setShowMenu(false);
    } catch (error) { console.error('Error uploading Clover file:', error); alert('Upload failed: ' + error.message); }
  };

  const handleVideoUpload = (event, item) => {
    if (readOnlyMode) return;
    const file = event.target.files[0];
    if (!file) return;
    const sku = getSKU(item.name);
    if (!sku) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await saveVideoToDB(sku, { data: e.target.result, name: file.name, type: file.type, itemName: getDisplayName(item.name) });
        setShowVideoUpload(null);
      } catch (error) { console.error('Error saving video:', error); alert('Error saving video.'); setShowVideoUpload(null); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteVideo = async (sku) => {
    if (readOnlyMode) return false;
    if (!confirm('Delete this video? This cannot be undone.')) return false;
    await deleteVideoFromDB(sku);
    setVideos(prev => { const entries = Object.entries(prev).filter(([key]) => key !== sku); return Object.fromEntries(entries); });
    return true;
  };

  const startRecording = async (item) => {
    const sku = getSKU(item.name);
    if (!sku) { alert('Cannot record video: item has no SKU number.'); return; }
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
      } catch (audioErr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      }
      setMediaStream(stream); setRecordingItemId(item.id); setIsRecording(true);
      setTimeout(async () => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          try { await videoPreviewRef.current.play(); } catch (e) { setTimeout(async () => { try { await videoPreviewRef.current.play(); } catch (e2) {} }, 100); }
        }
      }, 100);
      let options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm;codecs=vp8,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) options = {};
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        if (chunks.length === 0) { alert('No video data was recorded.'); setIsRecording(false); setRecordingItemId(null); setShowVideoUpload(null); return; }
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: mimeType });
        try {
          await saveVideoToDB(sku, { data: blob, name: `recording-${Date.now()}.webm`, type: blob.type, itemName: getDisplayName(item.name) });
          const refreshedVideos = await loadAllVideosFromDB();
          setVideos(refreshedVideos);
          setIsRecording(false); setRecordingItemId(null); setShowVideoUpload(null);
        } catch (error) { console.error('Error saving video:', error); alert('Error saving video.'); setIsRecording(false); setRecordingItemId(null); setShowVideoUpload(null); }
      };
      recorder.onerror = () => { alert('Recording error occurred.'); setIsRecording(false); setRecordingItemId(null); };
      setMediaRecorder(recorder);
      recorder.start();
    } catch (error) {
      if (error.name === 'NotAllowedError') alert('Camera access denied.');
      else if (error.name === 'NotFoundError') alert('No camera found.');
      else alert('Could not access camera: ' + error.message);
      setIsRecording(false); setRecordingItemId(null); setShowVideoUpload(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) { mediaRecorder.stop(); if (mediaStream) { mediaStream.getTracks().forEach(track => track.stop()); setMediaStream(null); } }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) mediaRecorder.stop();
    if (mediaStream) { mediaStream.getTracks().forEach(track => track.stop()); setMediaStream(null); }
    setIsRecording(false); setRecordingItemId(null); setShowVideoUpload(null);
  };

  const startProcessing = (item) => { if (readOnlyMode) return; setActiveItem(item); setIsProcessing(true); setStartTime(Date.now()); };

  const stopProcessing = async () => {
    if (readOnlyMode || !startTime || !activeItem || !db) return;
    const duration = (Date.now() - startTime) / 1000;
    const itemTimings = timingData[activeItem.id] || [];
    await set(ref(db, `timingData/${activeItem.id}`), [...itemTimings, { duration, timestamp: new Date().toISOString() }]);
    setIsProcessing(false); setStartTime(null); setActiveItem(null);
  };

  const updatePriority = async (itemId, newPriority) => {
    if (readOnlyMode || !db) return;
    let priority = newPriority === 'missing' ? 'missing' : parseInt(newPriority);
    if (typeof priority === 'number' && isNaN(priority)) return;
    await set(ref(db, `items/${itemId}/priority`), priority);
    const snap = await get(ref(db, 'historicalPriorities'));
    const currentPriorities = firebaseToArray(snap.val());
    if (!currentPriorities.includes(priority)) {
      const updated = [...currentPriorities, priority].sort((a, b) => {
        const aN = typeof a === 'number' && a > 0, bN = typeof b === 'number' && b > 0;
        if (aN && bN) return a - b; if (aN) return -1; if (bN) return 1;
        if (a === 'missing') return -1; if (b === 'missing') return 1; return 0;
      });
      await set(ref(db, 'historicalPriorities'), updated);
    }
  };

  const moveItemUp = async (itemId) => {
    if (!db) return;
    const sorted = [...items].sort((a, b) => {
      const ao = a.sortOrder ?? 9999, bo = b.sortOrder ?? 9999;
      if (ao !== bo) return ao - bo;
      const pa = a.priority === 'missing' ? 9999 : (a.priority ?? 9999);
      const pb = b.priority === 'missing' ? 9999 : (b.priority ?? 9999);
      if (pa !== pb) return pa - pb;
      return (a.name || '').localeCompare(b.name || '');
    });
    const idx = sorted.findIndex(i => i.id === itemId);
    if (idx <= 0) return;
    const item = sorted[idx];
    const above = sorted[idx - 1];
    const aboveSortOrder = above.sortOrder ?? idx - 1;
    const itemSortOrder = item.sortOrder ?? idx;
    const updates = {};
    updates[`items/${item.id}/sortOrder`] = aboveSortOrder;
    updates[`items/${item.id}/priority`] = above.priority;
    updates[`items/${above.id}/sortOrder`] = itemSortOrder;
    await update(ref(db), updates);
  };

  const moveItemDown = async (itemId) => {
    if (!db) return;
    const sorted = [...items].sort((a, b) => {
      const ao = a.sortOrder ?? 9999, bo = b.sortOrder ?? 9999;
      if (ao !== bo) return ao - bo;
      const pa = a.priority === 'missing' ? 9999 : (a.priority ?? 9999);
      const pb = b.priority === 'missing' ? 9999 : (b.priority ?? 9999);
      if (pa !== pb) return pa - pb;
      return (a.name || '').localeCompare(b.name || '');
    });
    const idx = sorted.findIndex(i => i.id === itemId);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const item = sorted[idx];
    const below = sorted[idx + 1];
    const belowSortOrder = below.sortOrder ?? idx + 1;
    const itemSortOrder = item.sortOrder ?? idx;
    const updates = {};
    updates[`items/${item.id}/sortOrder`] = belowSortOrder;
    updates[`items/${item.id}/priority`] = below.priority;
    updates[`items/${below.id}/sortOrder`] = itemSortOrder;
    await update(ref(db), updates);
  };

  const moveItemToTop = async (itemId) => {
    if (!db) return;
    const sorted = [...items].sort((a, b) => {
      const ao = a.sortOrder ?? 9999, bo = b.sortOrder ?? 9999;
      if (ao !== bo) return ao - bo;
      const pa = a.priority === 'missing' ? 9999 : (a.priority ?? 9999);
      const pb = b.priority === 'missing' ? 9999 : (b.priority ?? 9999);
      if (pa !== pb) return pa - pb;
      return (a.name || '').localeCompare(b.name || '');
    });
    const idx = sorted.findIndex(i => i.id === itemId);
    if (idx <= 0) return;
    const updates = {};
    const topSortOrder = sorted[0].sortOrder ?? 0;
    updates[`items/${itemId}/sortOrder`] = topSortOrder - 1;
    updates[`items/${itemId}/priority`] = sorted[0].priority;
    await update(ref(db), updates);
  };

  const moveItemToBottom = async (itemId) => {
    if (!db) return;
    const sorted = [...items].sort((a, b) => {
      const ao = a.sortOrder ?? 9999, bo = b.sortOrder ?? 9999;
      if (ao !== bo) return ao - bo;
      const pa = a.priority === 'missing' ? 9999 : (a.priority ?? 9999);
      const pb = b.priority === 'missing' ? 9999 : (b.priority ?? 9999);
      if (pa !== pb) return pa - pb;
      return (a.name || '').localeCompare(b.name || '');
    });
    const idx = sorted.findIndex(i => i.id === itemId);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const last = sorted[sorted.length - 1];
    const updates = {};
    updates[`items/${itemId}/sortOrder`] = (last.sortOrder ?? sorted.length - 1) + 1;
    updates[`items/${itemId}/priority`] = last.priority;
    await update(ref(db), updates);
  };

  const updateLocation = async (itemId, newLocation) => { if (readOnlyMode || !db) return; await set(ref(db, `items/${itemId}/location`), newLocation); };

  const addNewItem = async () => {
    if (readOnlyMode || !db) return;
    if (!newItemName.trim()) { alert('Please enter an item name'); return; }
    if (!newItemLocation.trim()) { alert('Please enter instructions/location'); return; }
    const cases = parseInt(newItemCases);
    if (isNaN(cases) || cases < 1) { alert('Please enter a valid number of cases'); return; }
    const newItem = { id: `adhoc-${Date.now()}`, name: newItemName.trim(), location: newItemLocation.trim(), cases, priority: newItemPriority === 'missing' ? 'missing' : parseInt(newItemPriority) };
    await set(ref(db, `items/${newItem.id}`), newItem);
    if (newItemPriority !== 'missing') {
      const p = parseInt(newItemPriority);
      const snap = await get(ref(db, 'historicalPriorities'));
      const cur = firebaseToArray(snap.val());
      if (!cur.includes(p)) {
        const updated = [...cur, p].sort((a, b) => { const aN = typeof a === 'number' && a > 0, bN = typeof b === 'number' && b > 0; if (aN && bN) return a - b; if (aN) return -1; if (bN) return 1; if (a === 'missing') return -1; if (b === 'missing') return 1; return 0; });
        await set(ref(db, 'historicalPriorities'), updated);
      }
    }
    setNewItemName(''); setNewItemLocation(''); setNewItemCases('1'); setNewItemPriority('missing'); setShowAddItem(false);
  };

  const deletePriority = async (priorityToDelete) => {
    if (readOnlyMode || !db) return;
    const snap = await get(ref(db, 'historicalPriorities'));
    const cur = firebaseToArray(snap.val());
    await set(ref(db, 'historicalPriorities'), cur.filter(p => p !== priorityToDelete));
  };

  const handleBeginProcessing = (itemId) => {
    if (readOnlyMode) return;
    if (itemsPaused[itemId]) {
      const pausedSeconds = pausedElapsedTime[itemId] || 0;
      setItemsInProcess(prev => ({ ...prev, [itemId]: Date.now() - (pausedSeconds * 1000) }));
      setItemsPaused(prev => { const u = { ...prev }; delete u[itemId]; return u; });
      setPausedElapsedTime(prev => { const u = { ...prev }; delete u[itemId]; return u; });
    } else if (itemsInProcess[itemId]) {
      const elapsed = elapsedTimes[itemId] || 0;
      setPausedElapsedTime(prev => ({ ...prev, [itemId]: elapsed }));
      setItemsPaused(prev => ({ ...prev, [itemId]: true }));
      setItemsInProcess(prev => { const u = { ...prev }; delete u[itemId]; return u; });
    } else {
      setItemsInProcess(prev => ({ ...prev, [itemId]: Date.now() }));
    }
  };

  const markComplete = async (item) => { if (readOnlyMode || !db) return; finalizeCompletion(item, null); };

  const openCasesPrompt = (item) => {
    if (readOnlyMode) return;
    if (item.cases === 1) { markComplete(item); return; }
    setCasesPromptValue(item.cases);
    setShowCasesPrompt(item.id);
  };

  const confirmCases = async (item) => {
    setShowCasesPrompt(null);
    if (casesPromptValue >= item.cases) {
      markComplete(item);
    } else {
      if (!db) return;
      const originalCases = item.originalCases ?? item.cases;
      const prevDone = item.casesDone ?? 0;
      const nowDone = prevDone + casesPromptValue;
      const remaining = item.cases - casesPromptValue;
      await update(ref(db, `items/${item.id}`), { cases: remaining, casesDone: nowDone, originalCases });
    }
  };

  const finalizeCompletion = async (item, pd) => {
    if (readOnlyMode || !db) return;
    const sku = getSKU(item.name);
    if (pd && sku) { await saveCompletionPhotoToDB(sku, pd, getDisplayName(item.name)); setCompletionPhotos(prev => ({ ...prev, [sku]: { ...pd, name: getDisplayName(item.name) } })); }
    let totalTime = null;
    if (itemsInProcess[item.id]) totalTime = (Date.now() - itemsInProcess[item.id]) / 1000;
    else if (itemsPaused[item.id] && pausedElapsedTime[item.id] !== undefined) totalTime = pausedElapsedTime[item.id];
    if (totalTime !== null && sku) {
      const timePerCase = totalTime / item.cases;
      const timingEvent = { totalTime, cases: item.cases, timePerCase, timestamp: new Date().toISOString() };
      const allEvents = timingEventsBySKU[sku] || [];
      const newEvents = [...allEvents, timingEvent];
      await set(ref(db, `timingEvents/${sku}`), newEvents);
      const avgTimePerCase = newEvents.reduce((sum, e) => sum + e.timePerCase, 0) / newEvents.length;
      await set(ref(db, `historicalTimes/${sku}`), avgTimePerCase);
      setItemsInProcess(prev => { const u = { ...prev }; delete u[item.id]; return u; });
      setItemsPaused(prev => { const u = { ...prev }; delete u[item.id]; return u; });
      setPausedElapsedTime(prev => { const u = { ...prev }; delete u[item.id]; return u; });
      setElapsedTimes(prev => { const u = { ...prev }; delete u[item.id]; return u; });
    }
    await set(ref(db, `completedItems/${item.id}`), { ...item, completedAt: new Date().toISOString() });
    await remove(ref(db, `items/${item.id}`));
    setShowCompletionCamera(null);
  };

  const bulkMarkDone = async () => {
    const targets = items.filter(item => selectedItemIds.has(item.id));
    for (const item of targets) {
      await finalizeCompletion(item, null);
    }
    setSelectMode(false);
    setSelectedItemIds(new Set());
  };

  const handleCardLongPress = (itemId) => {
    setSelectMode(true);
    setSelectedItemIds(new Set([itemId]));
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedItemIds(new Set());
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const undoComplete = async (item) => {
    if (readOnlyMode || !db) return;
    const { completedAt, ...activeItem } = item;
    await set(ref(db, `items/${item.id}`), activeItem);
    await remove(ref(db, `completedItems/${item.id}`));
  };

  const deleteTimingEvent = async (sku, eventIndex) => {
    if (readOnlyMode) return;
    const events = timingEventsBySKU[sku] || [];
    await deleteTimingEventFromDB(sku, eventIndex);
    const updatedEvents = events.filter((_, index) => index !== eventIndex);
    if (db) {
      if (updatedEvents.length > 0) {
        await set(ref(db, `timingEvents/${sku}`), updatedEvents);
      } else {
        await remove(ref(db, `timingEvents/${sku}`));
      }
    }
    setTimingEventsBySKU(prev => ({ ...prev, [sku]: updatedEvents }));
    if (updatedEvents.length > 0) {
      const avg = updatedEvents.reduce((sum, e) => sum + e.timePerCase, 0) / updatedEvents.length;
      await saveHistoricalTimeToDB(sku, avg);
      setHistoricalTimes(prev => ({ ...prev, [sku]: avg }));
    } else { setHistoricalTimes(prev => { const u = { ...prev }; delete u[sku]; return u; }); }
  };

  // HELPER FUNCTIONS
  const getStats = (sku) => {
    const events = timingEventsBySKU[sku] || [];
    if (events.length === 0) return null;
    const timesPerCase = events.map(e => e.timePerCase);
    const average = timesPerCase.reduce((a, b) => a + b, 0) / timesPerCase.length;
    const fastest = Math.min(...timesPerCase);
    const totalCases = events.reduce((sum, e) => sum + e.cases, 0);
    return { average, fastest, totalCases };
  };

  const fetchCommits = async () => {
    setCommitsLoading(true);
    try {
      const res = await fetch('https://api.github.com/repos/kjmacgrub/produce-processor/commits?per_page=30');
      if (res.ok) {
        const data = await res.json();
        setCommits(data.map(c => ({
          sha: c.sha.substring(0, 7),
          message: c.commit.message.split('\n')[0],
          date: new Date(c.commit.author.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          author: c.commit.author.name
        })));
      }
    } catch (error) {
      console.error('Error fetching commits:', error);
    }
    setCommitsLoading(false);
  };

  const formatTime = (seconds) => { const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${mins}:${secs.toString().padStart(2, '0')}`; };
  const formatTimeWithUnits = (seconds) => { if (seconds < 60) return `${Math.floor(seconds)} sec`; const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`; };
  const getDisplayName = (fullName) => fullName.split('#')[0].trim();
  const getSKU = (fullName) => { const match = fullName.match(/#(\d+)/); return match ? match[1] : null; };

  const formatDateWithDay = (dateString) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length !== 3) return dateString;
      const year = parseInt(parts[0]), month = parseInt(parts[1]) - 1, day = parseInt(parts[2]);
      const date = new Date(year, month, day);
      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const getOrdinal = (n) => { const s = ["th","st","nd","rd"]; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
      return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${getOrdinal(day)} ${year}`;
    } catch (error) { return dateString; }
  };

  const firebaseToArray = (data) => { if (!data) return []; if (Array.isArray(data)) return data; if (typeof data === 'object') return Object.values(data); return []; };

  const getPriorityColor = (priority) => {
    if (priority === 'missing') return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    if (priority === 0) return 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
    if (priority === 1) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    if (priority === 2) return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';
    if (priority === 3) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    return 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
  };

  // SECTION:JSX
  return (
    <>
    <style>{`
      @keyframes pulse-badge {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
    {isNotToday && (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style={{
          fontSize: '5vw', fontWeight: 900, letterSpacing: '0.15em',
          color: 'rgba(255, 0, 0, 0.32)', whiteSpace: 'nowrap',
          transform: 'rotate(-35deg)',
        }}>NOT TODAY'S DATA</div>
      </div>
    )}
    <div style={{
      minHeight: '100vh',
      background: readOnlyMode
        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #0f766e 0%, #14532d 100%)',
      padding: 'clamp(0.5rem, 3vw, 2rem)',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Pull-to-refresh indicator */}
        {isPulling && (
          <div style={{
            position: 'fixed',
            top: `${pullDistance}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '1rem 2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 9999,
            fontWeight: '700',
            color: '#0f766e'
          }}>
            {pullDistance > 80 ? '↓ Release to refresh' : '↓ Pull down to refresh'}
          </div>
        )}

        {/* Refresh message notification */}
        {refreshMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '1rem 2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 10000,
            fontWeight: '700',
            fontSize: '1.1rem',
            color: '#1e293b',
            border: '2px solid #0f766e'
          }}>
            {refreshMessage}
          </div>
        )}

        {/* Landing Page */}
        {showLanding && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 25px 70px rgba(0,0,0,0.25)'
          }}>
            <h1 style={{
              textAlign: 'center',
              fontSize: '2.2rem',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '2rem'
            }}>
              Produce Processor
            </h1>

            {/* Current File Status */}
            {pdfDate ? (
              <div style={{
                background: items.length > 0 ? '#f0fdf4' : '#eff6ff',
                border: items.length > 0 ? '2px solid #10b981' : '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '1.2rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{
                    display: 'inline-block',
                    background: items.length > 0 ? '#10b981' : '#3b82f6',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    marginBottom: '0.4rem',
                    animation: items.length > 0 ? 'pulse-badge 1.5s ease-in-out infinite' : 'none'
                  }}>
                    {items.length > 0 ? 'IN PROGRESS' : 'COMPLETED'}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1e293b' }}>
                    {formatDateWithDay(pdfDate)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowLanding(false)}
                    style={{
                      background: items.length > 0 ? '#10b981' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.6rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {items.length > 0 ? 'Continue' : 'View'}
                  </button>
                  {!isIPad && (
                    <button
                      onClick={async () => {
                        if (!window.confirm('This will clear the current session. Are you sure?')) return;
                        await clearCurrentFile();
                        const dates = await listAvailableCSVs();
                        setAvailableDates(dates);
                      }}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.6rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '1.2rem 1.5rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                color: '#94a3b8',
                fontWeight: '600',
                fontSize: '1.1rem'
              }}>
                No file loaded — select a date below
              </div>
            )}

            {/* Available Files */}
            {(() => {
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h2 style={{
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      color: '#64748b',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Available Files
                    </h2>
                    <button
                      onClick={async () => {
                        setAvailableDates([]);
                        const dates = await listAvailableCSVs();
                        setAvailableDates(dates);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 1rem',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  {availableDates.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      Loading files...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {availableDates.map(fileInfo => (
                        <button
                          key={fileInfo.filename}
                          onClick={async () => {
                            if (pdfDate === fileInfo.date) {
                              setShowLanding(false);
                            } else {
                              await loadCSVFromStorage(fileInfo);
                              setShowLanding(false);
                            }
                          }}
                          style={{
                            padding: '0.8rem 1.2rem',
                            background: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: '1.05rem',
                            color: '#1e293b'
                          }}
                        >
                          {formatDateWithDay(fileInfo.date)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {items.length > 0 && pdfDate && (
              <div style={{
                textAlign: 'center',
                marginTop: '1rem',
                color: '#94a3b8',
                fontSize: '0.9rem'
              }}>
                Clear current file to load a different date
              </div>
            )}
          </div>
        )}

        {/* Main Work View */}
        {(!showLanding || pdfDate) && (
        <>
        {/* Header */}
        <div style={{
          background: weekInfo.bg,
          borderRadius: '24px',
          padding: '1.2rem 1.5rem',
          marginBottom: '1rem',
          position: 'relative',
          boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
          border: `clamp(4px, 1.5vw, 14px) solid ${weekInfo.border}`,
          transition: 'background 0.3s',
        }}>

          {/* Hamburger Menu Button */}
          {!isIPad && (
            <button
              onClick={() => setShowMenu(true)}
              aria-label="Menu"
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                zIndex: 10
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={weekInfo.text} strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}

          {/* Delivery App Nav Link */}
          <a
            href="https://delivery-app-481756503401.us-east1.run.app"
            aria-label="Delivery"
            style={{
              position: 'absolute',
              top: '1rem',
              left: isIPad ? '1rem' : '3.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: weekInfo.text,
              opacity: 0.7,
              zIndex: 10,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="3" x2="4" y2="21"/>
              <line x1="20" y1="3" x2="20" y2="21"/>
              <line x1="12" y1="4" x2="12" y2="6"/>
              <line x1="12" y1="9" x2="12" y2="11"/>
              <line x1="12" y1="14" x2="12" y2="16"/>
              <line x1="12" y1="19" x2="12" y2="21"/>
            </svg>
          </a>

          {/* Julian Day / Week */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            textAlign: 'right',
            lineHeight: 1.2,
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500', color: weekInfo.text, opacity: 0.7 }}>Day </span>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: weekInfo.text }}>{weekInfo.julianDay}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: '500', color: weekInfo.text, opacity: 0.7 }}>&nbsp;&nbsp;Week </span>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: weekInfo.text }}>{weekInfo.weekNum}</span>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', fontSize: '2.6rem', fontWeight: '700', color: weekInfo.text, marginBottom: '0.25rem' }}>
            Produce Processing
          </div>

          {/* Date display */}
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: '700',
              color: weekInfo.text,
              textAlign: 'center',
              marginBottom: '0.5rem'
            }}
          >
            {pdfDate ? formatDateWithDay(pdfDate) : 'No data file loaded'}
          </div>

          {/* Progress Bar and Welcome */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              {(() => {
                const completedCases = completedItems.reduce((sum, item) => sum + item.cases, 0);
                const completedPercentage = originalTotalCases > 0 ? (completedCases / originalTotalCases) * 100 : 0;
                return (
                  <div>
                    <div style={{
                      width: '100%',
                      height: '24px',
                      background: '#e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${completedPercentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        transition: 'width 0.5s ease',
                        borderRadius: '20px'
                      }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: weekInfo.text,
                      opacity: 0.75,
                      marginTop: '0.35rem',
                      paddingLeft: '2px',
                      paddingRight: '2px'
                    }}>
                      <span>{completedCases} cases done</span>
                      <span>{originalTotalCases} cases and {items.length + completedItems.length} items expected</span>
                    </div>
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.8rem', color: weekInfo.text, opacity: 0.75 }}># of items to show</span>
                      <button onClick={() => setDisplayCount(c => Math.max(1, (c ?? items.length) - 1))} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: `2px solid ${weekInfo.border}`, background: weekInfo.bgLight, fontSize: '1.2rem', fontWeight: '700', color: weekInfo.text, cursor: 'pointer', lineHeight: 1 }}>−</button>
                      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: weekInfo.text, minWidth: '2rem', textAlign: 'center' }}>{displayCount ?? items.length}</div>
                      <button onClick={() => setDisplayCount(c => Math.min(items.length, (c ?? items.length) + 1))} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: `2px solid ${weekInfo.border}`, background: weekInfo.bgLight, fontSize: '1.2rem', fontWeight: '700', color: weekInfo.text, cursor: 'pointer', lineHeight: 1 }}>+</button>
                      <button onClick={() => setDisplayCount(null)} style={{ padding: '0.25rem 0.75rem', borderRadius: '8px', border: `2px solid ${weekInfo.border}`, background: displayCount === null ? 'rgba(0,0,0,0.2)' : weekInfo.bgLight, color: weekInfo.text, fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' }}>All</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div
            onClick={() => { setShowChangelog(true); fetchCommits(); }}
            style={{
              textAlign: 'right',
              fontSize: '0.75rem',
              color: weekInfo.text,
              opacity: 0.5,
              fontWeight: '600',
              marginTop: '0.5rem',
              cursor: 'pointer'
            }}
          >
            v2.15 · {__COMMIT_HASH__}
          </div>

        </div>

        {/* Firebase Config Warning */}
        {!firebaseConnected && (
          <div style={{
            background: '#fef3c7',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '2px solid #f59e0b',
            color: '#92400e'
          }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              ⚠️ Firebase Not Connected
            </strong>
            <p style={{ margin: 0 }}>
              Please configure Firebase in the HTML file. See setup instructions.
            </p>
          </div>
        )}


        {/* No items message - View mode */}
        {items.length === 0 && !pdfDate && !readOnlyMode && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☰</div>
            <h2 style={{ marginBottom: '0.75rem', color: '#1e293b', fontSize: '1.8rem' }}>No file loaded</h2>
            <p style={{ fontSize: '1.1rem' }}>Tap the menu in the top-right corner<br />to upload today's Clover file.</p>
          </div>
        )}

        {items.length === 0 && readOnlyMode && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
            color: '#64748b'
          }}>
            <Eye size={72} style={{ marginBottom: '1.5rem', color: '#64748b' }} />
            <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>
              No Items Loaded
            </h2>
            <p>Waiting for someone to load a file...</p>
          </div>
        )}

        {/* Active Processing Timer */}
        {isProcessing && activeItem && (
          <div style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            marginBottom: '2rem',
            color: 'white',
            boxShadow: '0 25px 70px rgba(234, 88, 12, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ flex: '1', minWidth: '250px' }}>
                <div style={{ fontSize: '1.3rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '600' }}>
                  Processing Now
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                  {getDisplayName(activeItem.name)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(currentTime)}
                </div>
                {!readOnlyMode && (
                  <button
                    onClick={stopProcessing}
                    style={{
                      background: 'white',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '1rem 2.5rem',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 6px 25px rgba(0,0,0,0.25)'
                    }}
                  >
                    ✓ Complete Case
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items List - Two Column Layout */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left column: Todo items */}
          <div style={{ flex: '1 1 0', minWidth: 'min(650px, 100%)', display: 'grid', gap: '0.75rem' }}>

            {[...items].sort((a, b) => {
              const ao = a.sortOrder ?? 9999, bo = b.sortOrder ?? 9999;
              if (ao !== bo) return ao - bo;
              const pa = a.priority === 'missing' ? 9999 : (a.priority ?? 9999);
              const pb = b.priority === 'missing' ? 9999 : (b.priority ?? 9999);
              if (pa !== pb) return pa - pb;
              return (a.name || '').localeCompare(b.name || '');
            }).slice(0, displayCount ?? undefined).map((item, idx, sortedArr) => {
            const sku = getSKU(item.name);
            const stats = sku ? getStats(sku) : null;
            const hasVideo = sku ? videos[sku] : null;
            const hasPhoto = sku ? completionPhotos[sku] : null;

            return (
              <div
                key={item.id}
                onTouchStart={() => {
                  longPressTimerRef.current = setTimeout(() => handleCardLongPress(item.id), 600);
                }}
                onTouchEnd={() => clearTimeout(longPressTimerRef.current)}
                onTouchMove={() => clearTimeout(longPressTimerRef.current)}
                style={{
                  background: selectMode && selectedItemIds.has(item.id) ? '#eff6ff' : 'white',
                  borderRadius: '12px',
                  padding: '0.55rem 1.2rem',
                  boxShadow: activeItem?.id === item.id
                    ? '0 4px 20px rgba(15, 118, 110, 0.25)'
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease',
                  border: selectMode && selectedItemIds.has(item.id)
                    ? '2px solid #3b82f6'
                    : activeItem?.id === item.id ? '2px solid #0f766e' : '2px solid transparent',
                  position: 'relative',
                  paddingLeft: '2.8rem',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                }}
              >
                {/* Bulk-select checkbox — always visible on desktop, select-mode-only on iPad */}
                {(selectMode || !isIPad) && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!selectMode) setSelectMode(true);
                      toggleItemSelection(item.id);
                    }}
                    style={{
                      position: 'absolute', top: '0.5rem', right: '0.5rem',
                      width: '28px', height: '28px',
                      borderRadius: '50%',
                      border: `3px solid ${selectedItemIds.has(item.id) ? '#3b82f6' : '#cbd5e1'}`,
                      background: selectedItemIds.has(item.id) ? '#3b82f6' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 10, cursor: 'pointer', flexShrink: 0,
                      opacity: selectMode ? 1 : 0.35,
                    }}
                  >
                    {selectedItemIds.has(item.id) && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <polyline points="2,7 6,11 12,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}

                {/* Up/down arrows — left margin */}
                <div style={{
                  position: 'absolute', left: '0.5rem', top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center',
                  opacity: selectMode ? 0 : 1, pointerEvents: selectMode ? 'none' : 'auto',
                }}>
                  {idx > 0 && (
                    <div onClick={() => moveItemUp(item.id)} title="Move up" style={{ cursor: 'pointer', display: 'flex', userSelect: 'none' }}>
                      <svg width="20" height="24" viewBox="0 0 22 26" fill="none"><polygon points="11,0 22,13 15,13 15,26 7,26 7,13 0,13" fill="#94a3b8"/></svg>
                    </div>
                  )}
                  {idx < sortedArr.length - 1 && (
                    <div onClick={() => moveItemDown(item.id)} title="Move down" style={{ cursor: 'pointer', display: 'flex', userSelect: 'none' }}>
                      <svg width="20" height="24" viewBox="0 0 22 26" fill="none"><polygon points="11,26 22,13 15,13 15,0 7,0 7,13 0,13" fill="#94a3b8"/></svg>
                    </div>
                  )}
                </div>

                {/* Line 1: Cases badge + Item name */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <div style={{
                        fontSize: '0.55rem', fontWeight: '700', color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.1rem'
                      }}>Cases</div>
                      <div style={{
                        background: '#0f766e', color: 'white', borderRadius: '8px',
                        padding: '0.3rem 0.7rem', fontSize: '1.1rem', fontWeight: '700',
                        minWidth: '3.5rem', textAlign: 'center'
                      }}>
                        {item.cases}
                      </div>
                      {item.supplier && <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem', textAlign: 'center', lineHeight: 1.2 }}>{item.supplier}</div>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.2, textDecoration: oosItems.has(getDisplayName(item.name).toLowerCase()) ? 'line-through' : 'none', opacity: oosItems.has(getDisplayName(item.name).toLowerCase()) ? 0.5 : 1 }}>
                          {getDisplayName(item.name)}
                        </h3>
                        <button
                          onClick={() => { setEditingItemNote(item.id); setItemNoteText(notes[pdfDate]?.itemNotes?.[item.id]?.text || ''); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem', opacity: notes[pdfDate]?.itemNotes?.[item.id] ? 1 : 0.3, color: notes[pdfDate]?.itemNotes?.[item.id] ? '#f59e0b' : '#94a3b8', flexShrink: 0 }}
                        >
                          <StickyNote size={16} />
                        </button>
                      </div>
                      {editingItemNote === item.id && (
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={itemNoteText}
                            onChange={(e) => setItemNoteText(e.target.value)}
                            onBlur={() => { saveItemNote(item.id, itemNoteText, getDisplayName(item.name)); setEditingItemNote(null); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { saveItemNote(item.id, itemNoteText, getDisplayName(item.name)); setEditingItemNote(null); }
                              else if (e.key === 'Escape') { setEditingItemNote(null); }
                            }}
                            autoFocus
                            placeholder="Add a note..."
                            style={{ flex: 1, fontSize: '0.9rem', padding: '0.3rem 0.5rem', border: '1px solid #fbbf24', borderRadius: '6px', background: '#fffbeb', color: '#78350f' }}
                          />
                        </div>
                      )}
                      {editingItemNote !== item.id && notes[pdfDate]?.itemNotes?.[item.id]?.text && (
                        <span style={{ fontSize: '0.8rem', color: '#92400e', background: '#fef3c7', borderRadius: '4px', padding: '0.1rem 0.4rem', alignSelf: 'flex-start' }}>
                          📝 {notes[pdfDate]?.itemNotes?.[item.id]?.text}
                        </span>
                      )}
                      {item.carryover && (
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff', background: '#dc2626', border: '1px solid #b91c1c', borderRadius: '4px', padding: '0.2rem 0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'flex-start' }}>↩ From yesterday</span>
                      )}
                      {item.casesDone > 0 && (
                        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#065f46', background: '#d1fae5', border: '1px solid #10b981', borderRadius: '4px', padding: '0.1rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'flex-start' }}>{item.casesDone} of {item.originalCases} done</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line 2: Instructions + Done button, then Video/Timer below */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {showCasesPrompt === item.id ? (
                    <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#dc2626', flex: '1 1 auto' }}>How many cases done?</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => setCasesPromptValue(v => Math.max(1, v - 1))} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #10b981', background: 'white', fontSize: '1.1rem', fontWeight: '700', color: '#065f46', cursor: 'pointer', lineHeight: 1 }}>−</button>
                        <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#065f46', minWidth: '2rem', textAlign: 'center' }}>{casesPromptValue}</span>
                        <button onClick={() => setCasesPromptValue(v => Math.min(item.cases, v + 1))} style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid #10b981', background: 'white', fontSize: '1.1rem', fontWeight: '700', color: '#065f46', cursor: 'pointer', lineHeight: 1 }}>+</button>
                      </div>
                      <button onClick={() => confirmCases(item)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 1.2rem', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', minWidth: '7.5rem', textAlign: 'center' }}>
                        {casesPromptValue >= item.cases ? 'All done ✓' : 'Confirm'}
                      </button>
                      <button onClick={() => setShowCasesPrompt(null)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    </div>
                  ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Row 1: Instructions box + Done circle — centerlines aligned */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: '1 1 auto' }}>
                      <div style={{
                        background: '#fef3c7', borderRadius: '8px',
                        padding: '0.5rem 0.75rem', paddingBottom: '0.85rem',
                        border: '1px solid #fbbf24',
                        display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        flexWrap: 'wrap', position: 'relative'
                      }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: '700', color: '#92400e',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          position: 'absolute', bottom: '-0.45rem', left: '50%',
                          transform: 'translateX(-50%)', background: '#fef3c7',
                          padding: '0 0.4rem', whiteSpace: 'nowrap'
                        }}>Instructions</span>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2rem', color: '#78350f', flex: '1', minWidth: 0 }}>
                          {editingLocation === item.id ? (
                            <input
                              type="text"
                              value={locationEditText}
                              onChange={(e) => setLocationEditText(e.target.value)}
                              onBlur={() => { updateLocation(item.id, locationEditText); setEditingLocation(null); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { updateLocation(item.id, locationEditText); setEditingLocation(null); }
                                else if (e.key === 'Escape') { setEditingLocation(null); }
                              }}
                              autoFocus
                              style={{
                                fontSize: '1.2rem', fontWeight: '600', color: '#78350f',
                                background: 'white', border: '1px solid #fbbf24',
                                borderRadius: '6px', padding: '0.3rem', textAlign: 'center', width: '100%'
                              }}
                            />
                          ) : (
                            <div
                              onClick={() => { if (!readOnlyMode) { setEditingLocation(item.id); setLocationEditText(item.location); } }}
                              style={{ fontWeight: '600', cursor: readOnlyMode ? 'default' : 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.3rem', flexWrap: 'wrap', wordBreak: 'break-word' }}
                            >
                              <span style={{ whiteSpace: 'normal' }}>{item.location}</span>
                              {!readOnlyMode && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      </div>
                      {!readOnlyMode && !selectMode && (
                        <button
                          onClick={() => openCasesPrompt(item)}
                          style={{
                            background: (itemsInProcess[item.id] || itemsPaused[item.id]) ? '#1e293b' : '#10b981',
                            color: (itemsInProcess[item.id] || itemsPaused[item.id]) ? '#fbbf24' : 'white',
                            border: (itemsInProcess[item.id] || itemsPaused[item.id]) ? '3px solid #fbbf24' : 'none',
                            borderRadius: '50%',
                            width: '72px',
                            height: '72px',
                            cursor: 'pointer',
                            fontWeight: '900',
                            fontSize: (itemsInProcess[item.id] || itemsPaused[item.id]) ? '0.75rem' : '1.3rem',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1.1
                          }}
                        >
                          {(itemsInProcess[item.id] || itemsPaused[item.id]) ? 'Timing...' : 'Done'}
                        </button>
                      )}
                    </div>

                    {/* Row 2: Video | Timer+AvgTime | Photo — centered under instructions */}
                    {!readOnlyMode && !selectMode && !itemsInProcess[item.id] && !itemsPaused[item.id] && (
                      <div style={{ display: 'flex', alignItems: 'center', paddingRight: 'calc(72px + 0.5rem)' }}>
                        {/* Left slot: Video */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: '0.75rem' }}>
                          {hasVideo ? (
                            <button onClick={() => setPlayingVideo(sku)} style={{
                              background: '#059669', color: 'white', border: 'none', borderRadius: '8px',
                              padding: '0.4rem 1rem', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem'
                            }}>
                              <Play size={16} /> Watch
                            </button>
                          ) : isPhone ? (
                            <button onClick={() => { setShowVideoUpload(item.id); startRecording(item); }} style={{
                              background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px',
                              padding: '0.4rem 1rem', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem'
                            }}>
                              <Video size={16} /> Record Video
                            </button>
                          ) : null}
                        </div>
                        {/* Center: Timer + Avg Time below */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <button onClick={() => handleBeginProcessing(item.id)} style={{
                            background: 'linear-gradient(to bottom, #fef9c3, #fde047)', color: '#000', border: '1px solid #000', borderRadius: '8px',
                            padding: '0.4rem 1.2rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem',
                            boxShadow: '0 2px 0 #a16207, 0 3px 5px rgba(0,0,0,0.15)'
                          }}>
                            Timer
                          </button>
                          {stats && (
                            <span onClick={!isIPad ? () => setShowTimingEvents(sku) : undefined} style={{
                              background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)',
                              borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.8rem',
                              color: '#0f766e', fontWeight: '600', whiteSpace: 'nowrap',
                              cursor: !isIPad ? 'pointer' : 'default',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3
                            }}>
                              <span>{formatTimeWithUnits(stats.average)}</span>
                              <span style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Avg Time per Case</span>
                              <span style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: '500' }}>{stats.totalCases} cases timed</span>
                            </span>
                          )}
                        </div>
                        {/* Right slot: Photo */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '0.75rem' }}>
                          {hasPhoto ? (
                            <button onClick={() => {
                                const photo = completionPhotos[sku];
                                const modal = document.createElement('div');
                                modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;';
                                modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
                                const wrapper = document.createElement('div');
                                wrapper.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;gap:0.75rem;max-width:100%;max-height:95%;';
                                const img = document.createElement('img');
                                img.src = photo.data;
                                img.style.cssText = 'max-width:100%;max-height:85vh;border-radius:12px;';
                                wrapper.appendChild(img);
                                const btnRow = document.createElement('div');
                                btnRow.style.cssText = 'display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;justify-content:center;';
                                const closeBtn = document.createElement('button');
                                closeBtn.textContent = 'Close';
                                closeBtn.style.cssText = 'background:#64748b;color:white;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-size:0.85rem;font-weight:700;cursor:pointer;';
                                closeBtn.onclick = () => modal.remove();
                                btnRow.appendChild(closeBtn);
                                if (!isIPad) {
                                  const retakeBtn = document.createElement('button');
                                  retakeBtn.textContent = '📷 Retake';
                                  retakeBtn.style.cssText = 'background:#6366f1;color:white;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-size:0.85rem;font-weight:700;cursor:pointer;';
                                  retakeBtn.onclick = () => { modal.remove(); setItemPhotoTarget(item); setTimeout(() => itemPhotoInputRef.current?.click(), 50); };
                                  btnRow.appendChild(retakeBtn);
                                  const delBtn = document.createElement('button');
                                  delBtn.textContent = 'Delete Photo';
                                  delBtn.style.cssText = 'background:#ef4444;color:white;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-size:0.85rem;font-weight:700;cursor:pointer;';
                                  delBtn.onclick = async () => {
                                    if (!confirm('Delete this photo?')) return;
                                    await deleteCompletionPhotoFromDB(sku);
                                    setCompletionPhotos(prev => { const u = {...prev}; delete u[sku]; return u; });
                                    modal.remove();
                                  };
                                  btnRow.appendChild(delBtn);
                                }
                                wrapper.appendChild(btnRow);
                                modal.appendChild(wrapper);
                                document.body.appendChild(modal);
                              }} style={{
                                background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px',
                                padding: '0.4rem 1rem', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem'
                              }}>
                                📷 Photo
                              </button>
                          ) : isPhone ? (
                            <button onClick={() => { setItemPhotoTarget(item); itemPhotoInputRef.current?.click(); }} style={{
                              background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px',
                              padding: '0.4rem 1rem', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem'
                            }}>
                              📷 Take Photo
                            </button>
                          ) : null}
                        </div>
                      </div>
                      )}

                  </div>
                  )}
                </div>

                {/* Inline Timer Overlay */}
                {!selectMode && showCasesPrompt !== item.id && (itemsInProcess[item.id] || itemsPaused[item.id]) && (() => {
                  const isPaused = itemsPaused[item.id];
                  const elapsed = elapsedTimes[item.id] || 0;
                  return (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '33%',
                      minWidth: '140px',
                      background: isPaused
                        ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
                        : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      border: isPaused ? '2px solid #64748b' : '2px solid #fbbf24',
                      borderRadius: '0 12px 12px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem',
                      zIndex: 5
                    }}>
                      {/* Elapsed time */}
                      <div style={{
                        fontSize: '1.6rem',
                        fontWeight: '900',
                        fontVariantNumeric: 'tabular-nums',
                        color: '#fbbf24',
                        lineHeight: 1
                      }}>
                        {formatTime(elapsed)}
                      </div>

                      {/* Per case + avg row */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        fontSize: '0.65rem',
                        color: '#94a3b8',
                        textAlign: 'center'
                      }}>
                        <div>
                          <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per Case</div>
                          <div style={{ fontWeight: '700', color: '#fbbf24', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                            {formatTime(Math.floor(elapsed / item.cases))}
                          </div>
                        </div>
                        {stats && (
                          <div>
                            <div style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg</div>
                            <div style={{ fontWeight: '700', color: '#0f766e', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}>
                              {formatTime(stats.average)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pause/Resume + Done buttons */}
                      <div style={{ display: 'flex', gap: '0.3rem', width: '100%' }}>
                        <button
                          onClick={() => handleBeginProcessing(item.id)}
                          style={{
                            background: isPaused ? '#fbbf24' : 'transparent',
                            color: isPaused ? '#1e293b' : '#fbbf24',
                            border: isPaused ? 'none' : '2px solid #fbbf24',
                            borderRadius: '8px',
                            padding: '0.35rem 0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            flex: 1
                          }}
                        >
                          {isPaused ? 'Restart' : 'Pause'}
                        </button>
                        <button
                          onClick={() => openCasesPrompt(item)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.35rem 0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            flex: 1
                          }}
                        >
                          Done
                        </button>
                      </div>

                      {/* Cancel link */}
                      <button
                        onClick={() => {
                          setItemsInProcess(prev => ({ ...prev, [item.id]: false }));
                          setItemsPaused(prev => ({ ...prev, [item.id]: false }));
                          setElapsedTimes(prev => ({ ...prev, [item.id]: 0 }));
                          setStartTimes(prev => {
                            const newTimes = { ...prev };
                            delete newTimes[item.id];
                            return newTimes;
                          });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '0.1rem 0.3rem',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  );
                })()}

              </div>
            );
          })}

          {displayCount !== null && items.length > displayCount && (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem', fontWeight: '600', marginTop: '0.25rem' }}>
              {items.length - displayCount} item{items.length - displayCount !== 1 ? 's' : ''} not shown
            </div>
          )}
          </div>

          {/* Bulk-select floating toolbar */}
          {selectMode && (
            <div style={{
              position: 'fixed', bottom: '1.5rem', left: '50%',
              transform: 'translateX(-50%)',
              background: '#1e293b', borderRadius: '16px',
              padding: '0.75rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              zIndex: 100, whiteSpace: 'nowrap',
            }}>
              <span style={{ color: '#94a3b8', fontWeight: '700', fontSize: '0.95rem', minWidth: '5rem' }}>
                {selectedItemIds.size} selected
              </span>
              <button
                onClick={() => setSelectedItemIds(new Set(items.map(i => i.id)))}
                style={{ background: '#334155', color: 'white', border: 'none', borderRadius: '10px',
                         padding: '0.5rem 1rem', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Select All
              </button>
              <button
                onClick={bulkMarkDone}
                disabled={selectedItemIds.size === 0}
                style={{ background: selectedItemIds.size > 0 ? '#10b981' : '#334155',
                         color: 'white', border: 'none', borderRadius: '10px',
                         padding: '0.5rem 1.2rem', fontWeight: '800', fontSize: '1rem',
                         cursor: selectedItemIds.size > 0 ? 'pointer' : 'default',
                         opacity: selectedItemIds.size === 0 ? 0.5 : 1 }}
              >
                Mark Done
              </button>
              <button
                onClick={exitSelectMode}
                style={{ background: 'transparent', color: '#ef4444', border: '2px solid #ef4444',
                         borderRadius: '10px', padding: '0.5rem 1rem', fontWeight: '700',
                         fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}


{/* Right column: Completed items */}
            {completedItems.length > 0 && (
            <div style={{ flex: '0 0 300px', minWidth: 0, maxWidth: '300px', overflow: 'hidden', display: 'grid', gap: '0.5rem' }}>
                <div id="completed-section" style={{
                  textAlign: 'center',
                  padding: '0.5rem 0',
                  color: '#10b981',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '2px dashed #10b981'
                }}>
                  Completed
                </div>

                {[...completedItems].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).map(item => {
                  const sku = getSKU(item.name);
                  const photo = sku ? completionPhotos[sku] : null;
                  const completedStats = sku ? getStats(sku) : null;

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#f0fdf4',
                        borderRadius: '10px',
                        padding: '0.6rem 0.8rem 1.8rem 0.8rem',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        opacity: 0.85,
                        border: '1px solid #d1fae5',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Line 1: checkmark + item name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                        <span style={{
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '6px',
                          padding: '0.1rem 0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          flexShrink: 0
                        }}>
                          ✓
                        </span>
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: '#1e293b',
                          wordBreak: 'break-word',
                          textDecoration: oosItems.has(getDisplayName(item.name).toLowerCase()) ? 'line-through' : 'none',
                          opacity: oosItems.has(getDisplayName(item.name).toLowerCase()) ? 0.5 : 1
                        }}>
                          {getDisplayName(item.name)}
                        </span>
                        {notes[pdfDate]?.itemNotes?.[item.id]?.text && (
                          <span style={{ fontSize: '0.7rem', color: '#92400e', background: '#fef3c7', borderRadius: '4px', padding: '0.05rem 0.3rem', flexShrink: 0 }}>📝</span>
                        )}
                      </div>
                      {/* Line 2: cases + time + stats */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          <strong>{item.cases}</strong> cases
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {completedStats && (
                          <span
                            onClick={!isIPad ? () => setShowTimingEvents(sku) : undefined}
                            style={{
                              background: '#0f766e',
                              color: 'white',
                              borderRadius: '6px',
                              padding: '0.1rem 0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: !isIPad ? 'pointer' : 'default'
                            }}
                          >
                            {formatTimeWithUnits(completedStats.average)}/cs
                          </span>
                        )}
                        {photo && (
                          <button
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;';
                              modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
                              const wrapper = document.createElement('div');
                              wrapper.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;gap:0.75rem;max-width:100%;max-height:95%;';
                              const img = document.createElement('img');
                              img.src = photo.data;
                              img.style.cssText = 'max-width:100%;max-height:85vh;border-radius:12px;';
                              wrapper.appendChild(img);
                              const btnRow = document.createElement('div');
                              btnRow.style.cssText = 'display:flex;gap:0.75rem;align-items:center;';
                              const closeBtn = document.createElement('button');
                              closeBtn.textContent = 'Close';
                              closeBtn.style.cssText = 'background:#64748b;color:white;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-size:0.85rem;font-weight:700;cursor:pointer;';
                              closeBtn.onclick = () => modal.remove();
                              btnRow.appendChild(closeBtn);
                              if (!isIPad) {
                                const delBtn = document.createElement('button');
                                delBtn.textContent = 'Delete Photo';
                                delBtn.style.cssText = 'background:#ef4444;color:white;border:none;border-radius:8px;padding:0.5rem 1.2rem;font-size:0.85rem;font-weight:700;cursor:pointer;';
                                delBtn.onclick = async () => {
                                  if (!confirm('Delete this photo?')) return;
                                  await deleteCompletionPhotoFromDB(sku);
                                  setCompletionPhotos(prev => { const u = {...prev}; delete u[sku]; return u; });
                                  modal.remove();
                                };
                                btnRow.appendChild(delBtn);
                              }
                              wrapper.appendChild(btnRow);
                              modal.appendChild(wrapper);
                              document.body.appendChild(modal);
                            }}
                            style={{
                              background: '#6366f1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '0.7rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Photo
                          </button>
                        )}
                      </div>
                      {!readOnlyMode && (
                        <button
                          onClick={() => undoComplete(item)}
                          style={{
                            position: 'absolute',
                            bottom: '0.4rem',
                            right: '0.5rem',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.2rem 0.6rem',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
            )}
          </div>

        </>
        )}

        {/* Add Item Dialog */}
        {showAddItem && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.8rem',
                fontWeight: '800',
                color: '#1e293b',
                textAlign: 'center'
              }}>
                Add New Item
              </h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Organic Apples"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Instructions/Location *
                </label>
                <input
                  type="text"
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  placeholder="e.g., Cold room - top shelf"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: '1' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Cases *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemCases}
                    onChange={(e) => setNewItemCases(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ flex: '1' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Priority
                  </label>
                  <select
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="missing">Priority missing</option>
                    <option value="0">Shopping floor</option>
                    {historicalPriorities.filter(p => p !== 'missing' && p !== 0).map(p => (
                      <option key={p} value={p}>Priority {p}</option>
                    ))}
                    {[1, 2, 3, 4, 5].filter(p => !historicalPriorities.includes(p)).map(p => (
                      <option key={p} value={p}>Priority {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItemName('');
                    setNewItemLocation('');
                    setNewItemCases('1');
                    setNewItemPriority('missing');
                  }}
                  style={{
                    flex: '1',
                    background: '#e2e8f0',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addNewItem}
                  style={{
                    flex: '1',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Choice Dialog */}
        {!readOnlyMode && showPhotoChoice && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '3rem 2rem',
              maxWidth: '600px',
              width: '100%',
              textAlign: 'center'
            }}>
              {(() => {
                const sku = getSKU(showPhotoChoice.name);
                const existingPhoto = completionPhotos[sku];

                if (existingPhoto) {
                  return (
                    <>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: '800', color: '#1e293b' }}>
                        Task Complete!
                      </h3>
                      <p style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: '#64748b' }}>
                        Previous completion photo found:
                      </p>

                      <div style={{ marginBottom: '2rem' }}>
                        <img
                          src={existingPhoto.data}
                          style={{
                            width: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                          }}
                          alt="Existing completion photo"
                        />
                      </div>

                      <p style={{ margin: '0 0 2rem 0', fontSize: '1rem', color: '#64748b' }}>
                        What would you like to do with this photo?
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            const item = showPhotoChoice;
                            setShowPhotoChoice(null);
                            finalizeCompletion(item, existingPhoto);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '1.25rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                            minWidth: '140px'
                          }}
                        >
                          ✓ Keep
                        </button>

                        <button
                          onClick={() => {
                            setShowPhotoChoice(null);
                            setShowCompletionCamera(showPhotoChoice);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '1.25rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                            minWidth: '140px'
                          }}
                        >
                          📸 Retake
                        </button>

                        <button
                          onClick={async () => {
                            const item = showPhotoChoice;
                            setShowPhotoChoice(null);

                            await deleteCompletionPhotoFromDB(sku);
                            setCompletionPhotos(prev => {
                              const updated = {...prev};
                              delete updated[sku];
                              return updated;
                            });

                            finalizeCompletion(item, null);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '1.25rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                            minWidth: '140px'
                          }}
                        >
                          🗑️ Delete
                        </button>

                        <button
                          onClick={() => setShowPhotoChoice(null)}
                          style={{
                            background: 'white',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minWidth: '80px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span style={{ color: '#dc2626', fontSize: '1.2rem', fontWeight: '800', lineHeight: 1 }}>✕</span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <>
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: '800', color: '#1e293b' }}>
                        Task Complete!
                      </h3>
                      <p style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', color: '#64748b' }}>
                        Would you like to take a photo of the completed work?
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setShowPhotoChoice(null);
                              setShowCompletionCamera(showPhotoChoice);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '1.25rem 2.5rem',
                              fontSize: '1.2rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                              minWidth: '150px'
                            }}
                          >
                            📸 Take Photo
                          </button>

                          <button
                            onClick={() => {
                              const item = showPhotoChoice;
                              setShowPhotoChoice(null);
                              finalizeCompletion(item, null);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '1.25rem 2.5rem',
                              fontSize: '1.2rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              boxShadow: '0 8px 25px rgba(100, 116, 139, 0.4)',
                              minWidth: '150px'
                            }}
                          >
                            Skip photo
                          </button>
                        </div>

                        <button
                          onClick={() => setShowPhotoChoice(null)}
                          style={{
                            background: 'white',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minWidth: '80px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span style={{ color: '#dc2626', fontSize: '1.2rem', fontWeight: '800', lineHeight: 1 }}>✕</span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {/* Completion Camera Modal */}
        {!readOnlyMode && showCompletionCamera && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            padding: 0
          }}>
            {!photoTaken ? (
              <>
                <div style={{
                  background: '#1e293b',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    Take a picture of the completed case(s)
                  </h3>

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      ref={nativeCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPhotoData({ data: reader.result, timestamp: new Date().toISOString() });
                          setPhotoTaken(true);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => nativeCameraInputRef.current && nativeCameraInputRef.current.click()}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem 2rem',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                        flex: '1',
                        minWidth: '140px'
                      }}
                    >
                      📸 Take Photo
                    </button>

                    <button
                      onClick={() => finalizeCompletion(showCompletionCamera, null)}
                      style={{
                        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem 2rem',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 15px rgba(100, 116, 139, 0.3)',
                        flex: '1',
                        minWidth: '140px'
                      }}
                    >
                      Skip Photo
                    </button>

                    <button
                      onClick={() => setShowCompletionCamera(null)}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '1rem 2rem',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                        flex: '1',
                        minWidth: '140px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  background: '#1e293b',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.4rem',
                    fontWeight: '800',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    Review Photo
                  </h3>

                  <button
                    onClick={() => {
                      setPhotoTaken(false);
                      setPhotoData(null);
                    }}
                    style={{
                      background: 'transparent',
                      color: '#f59e0b',
                      border: '2px solid #f59e0b',
                      borderRadius: '12px',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '1rem',
                      width: '100%',
                      maxWidth: '300px',
                      margin: '0 auto'
                    }}
                  >
                    🔄 Retake Photo
                  </button>

                  <button
                    onClick={() => {
                      finalizeCompletion(showCompletionCamera, photoData);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '1.5rem 3rem',
                      cursor: 'pointer',
                      fontWeight: '800',
                      fontSize: '1.5rem',
                      boxShadow: '0 8px 30px rgba(16, 185, 129, 0.5)',
                      width: '100%',
                      maxWidth: '300px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '1.8rem' }}>✅</span>
                    Accept!
                  </button>
                </div>

                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#000',
                  padding: '1rem'
                }}>
                  <img
                    src={photoData.data}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      borderRadius: '8px'
                    }}
                    alt="Completion photo"
                  />
                </div>
              </>
            )}

          </div>
        )}

        {/* Storage Date Picker Modal */}
        {showStoragePicker && (
          <div
            onClick={() => setShowStoragePicker(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 30px 100px rgba(0,0,0,0.5)'
              }}
            >
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
                Select Data File to Load
              </h3>

              {availableDates.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <p style={{ marginBottom: '1rem' }}>No data files found in Storage.</p>
                  <p style={{ fontSize: '0.9rem' }}>Upload CSV files to Firebase Storage in folder: <code>produce-csv/</code></p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Files can have any name ending in <code>.csv</code></p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>The date will be read from the first line of each file</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {availableDates.map(fileInfo => {
                    const date = fileInfo.date;
                    const filename = fileInfo.filename;
                    const [year, month, day] = date.split('-');
                    const dateObj = new Date(year, month - 1, day);
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = dayNames[dateObj.getDay()];
                    const displayDate = `${dayName}, ${month}/${day}/${year}`;

                    return (
                      <button
                        key={filename}
                        onClick={() => {
                          setShowStoragePicker(false);
                          loadCSVFromStorage(fileInfo);
                        }}
                        style={{
                          padding: '1rem 1.5rem',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: '600',
                          fontSize: '1.05rem',
                          color: '#1e293b',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                          e.currentTarget.style.color = '#1e293b';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: '700' }}>{displayDate}</div>
                          <div style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: '400' }}>{filename}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setShowStoragePicker(false)}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Video Player Modal */}
        {playingVideo && videos[playingVideo] && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'clamp(0.5rem, 2vw, 2rem)',
              backdropFilter: 'blur(10px)'
            }}
            onClick={() => setPlayingVideo(null)}
          >
            {console.log('🎬 Video modal rendering. playingVideo:', playingVideo, 'Video src:', videoSrc)}
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: 'clamp(1rem, 3vw, 2rem)',
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 30px 100px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: '800', color: '#1e293b' }}>
                  Processing Instructions
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {!readOnlyMode && (
                    <button
                      onClick={async () => {
                        try {
                          const sku = playingVideo;
                          console.log('🗑️ Deleting video for SKU:', sku);

                          setPlayingVideo(null);

                          await deleteVideoFromDB(sku);
                          console.log('✅ Video deleted from Firebase Storage');

                          await new Promise(resolve => setTimeout(resolve, 300));

                          console.log('🔄 Reloading page...');
                          window.location.reload();

                        } catch (error) {
                          console.error('❌ Error deleting video:', error);
                          alert('Error deleting video. Please try reloading the page manually.');
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0.75rem 1.5rem',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                  <button
                    onClick={() => setPlayingVideo(null)}
                    style={{
                      background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '1.05rem',
                      boxShadow: '0 4px 15px rgba(100, 116, 139, 0.3)'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
              {videoError && (
                <div style={{
                  background: '#fef2f2',
                  border: '2px solid #dc2626',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontWeight: '700', color: '#dc2626', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    ⚠️ Video Error
                  </div>
                  <div style={{ color: '#991b1b', fontSize: '1rem', marginBottom: '1rem' }}>
                    Could not load video from Firebase Storage.
                  </div>
                  <div style={{ color: '#7f1d1d', fontSize: '0.95rem' }}>
                    <strong>Solution:</strong> Try reloading the page, or delete and re-upload this video.
                  </div>
                  <div style={{ color: '#7f1d1d', fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Error: {videoError}
                  </div>
                </div>
              )}
              {videoLoading && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#64748b' }}>
                    Loading video from cloud...
                  </div>
                </div>
              )}
              {!videoLoading && videoSrc && !videoError && (
                <video
                  ref={playbackVideoRef}
                  key={playingVideo}
                  controls
                  autoPlay
                  playsInline
                  crossOrigin="anonymous"
                  loop={false}
                  onLoadedMetadata={(e) => {
                    e.target.loop = false;
                    console.log('🔴 Video metadata loaded, loop set to:', e.target.loop);
                  }}
                  onLoadedData={() => console.log('✅ Video loaded successfully!')}
                  onError={(e) => {
                    const error = e.target.error;
                    console.error('❌ Video playback error:', {
                      code: error?.code,
                      message: error?.message,
                      videoSrc: videoSrc,
                      mediaErrorCode: error ?
                        ['MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'][error.code - 1]
                        : 'unknown'
                    });
                    setVideoError(`Media error: ${error?.code || 'unknown'} - Check if video file is valid webm format`);
                  }}
                  onEnded={(e) => {
                    console.log('🔴 Video ended event fired');
                    e.target.pause();
                    e.target.currentTime = e.target.duration;
                  }}
                  style={{
                    width: '100%',
                    borderRadius: '16px',
                    maxHeight: 'calc(90vh - 150px)',
                    background: '#000'
                  }}
                  src={videoSrc}
                />
              )}
            </div>
          </div>
        )}

        {/* Hidden input for item-level photo capture */}
        <input
          ref={itemPhotoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (!file || !itemPhotoTarget) return;
            const sku = getSKU(itemPhotoTarget.name);
            if (!sku) return;
            const reader = new FileReader();
            reader.onloadend = async () => {
              const pd = { data: reader.result, timestamp: new Date().toISOString() };
              await saveCompletionPhotoToDB(sku, pd, getDisplayName(itemPhotoTarget.name));
              setCompletionPhotos(prev => ({ ...prev, [sku]: { ...pd, name: getDisplayName(itemPhotoTarget.name) } }));
              setItemPhotoTarget(null);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
          }}
        />

        {/* Video Upload/Recording Section */}
        {!readOnlyMode && showVideoUpload && (() => {
          const item = items.find(i => i.id === showVideoUpload);
          if (!item) return null;

          return (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget && !isRecording) {
                  setShowVideoUpload(null);
                }
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.95)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                padding: '2rem'
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '1200px',
                  maxHeight: '90vh',
                  background: 'white',
                  borderRadius: '24px',
                  padding: '3rem',
                  overflowY: 'auto',
                  position: 'relative'
                }}
              >
                {!isRecording && (
                  <button
                    onClick={() => setShowVideoUpload(null)}
                    style={{
                      position: 'absolute',
                      top: '2rem',
                      right: '2rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      fontSize: '2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '300',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                )}

                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#1e293b',
                  marginBottom: '2rem',
                  paddingRight: '60px',
                  textDecoration: oosItems.has(getDisplayName(item.name).toLowerCase()) ? 'line-through' : 'none',
                  opacity: oosItems.has(getDisplayName(item.name).toLowerCase()) ? 0.5 : 1
                }}>
                  {getDisplayName(item.name)}
                </h2>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoUpload(e, item)}
                  style={{ display: 'none' }}
                />

                {recordingItemId === item.id && isRecording ? (
                  <div>
                    <div style={{ marginBottom: '2rem' }}>
                      <video
                        ref={videoPreviewRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          maxHeight: '60vh',
                          borderRadius: '16px',
                          background: '#000',
                          objectFit: 'contain'
                        }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '1.5rem',
                      flexWrap: 'wrap',
                      marginBottom: '1.5rem'
                    }}>
                      <button
                        onClick={stopRecording}
                        style={{
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '1.5rem 3rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '1.3rem',
                          boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        <span style={{ fontSize: '2rem' }}>⏹</span>
                        Stop & Save
                      </button>
                      <button
                        onClick={cancelRecording}
                        style={{
                          background: 'white',
                          color: '#64748b',
                          border: '3px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '1.5rem 3rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '1.3rem'
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      color: '#dc2626',
                      fontWeight: '700',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '2rem' }}>🔴</span>
                      Recording...
                    </div>
                  </div>
                ) : (
                  <div>
                    {!isPhone && (
                      <div style={{
                        marginBottom: '3rem',
                        textAlign: 'center',
                        padding: '3rem',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '16px'
                      }}>
                        <div style={{
                          fontWeight: '700',
                          marginBottom: '1rem',
                          color: '#1e293b',
                          fontSize: '1.5rem'
                        }}>
                          Add Processing Video
                        </div>
                        <div style={{
                          fontSize: '1.2rem',
                          color: '#64748b',
                          fontWeight: '500'
                        }}>
                          Record with camera or choose an existing file
                        </div>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '2rem',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={() => startRecording(item)}
                        style={{
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '16px',
                          padding: '2rem 3rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '1.3rem',
                          boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          minWidth: '250px',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ fontSize: '2rem' }}>📹</span>
                        Record Video
                      </button>

                      {!isPhone && (
                        <button
                          onClick={() => videoInputRef.current?.click()}
                          style={{
                            background: 'linear-gradient(135deg, #0f766e 0%, #14532d 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '2rem 3rem',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '1.3rem',
                            boxShadow: '0 6px 20px rgba(15, 118, 110, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            minWidth: '250px',
                            justifyContent: 'center'
                          }}
                        >
                          <span style={{ fontSize: '2rem' }}>📁</span>
                          Choose File
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Reckoning Modal */}
        {showReckoning && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '560px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', textAlign: 'center' }}>Before we start today...</h2>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#64748b', textAlign: 'center' }}>
                {reckoningItems.length} item{reckoningItems.length !== 1 ? 's' : ''} weren't finished yesterday. What should I do with them?
              </p>
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {reckoningItems.map(item => {
                  const decision = reckoningDecisions[item.id] ?? { action: 'carry', cases: item.cases };
                  const isDone = decision.action === 'done';
                  return (
                    <div key={item.id} style={{ border: '2px solid ' + (isDone ? '#bbf7d0' : '#fbbf24'), borderRadius: '12px', padding: '0.85rem 1rem', background: isDone ? '#f0fdf4' : '#fffbeb', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: isDone ? 0 : '0.6rem' }}>
                        <div style={{ background: isDone ? '#16a34a' : '#0f766e', color: 'white', borderRadius: '6px', padding: '0.25rem 0.55rem', fontSize: '0.95rem', fontWeight: '700', minWidth: '2.8rem', textAlign: 'center', flexShrink: 0 }}>
                          {isDone ? item.cases : decision.cases}
                        </div>
                        <span style={{ flex: 1, fontWeight: '700', fontSize: '1.05rem', color: '#1e293b', textDecoration: (isDone || oosItems.has(getDisplayName(item.name).toLowerCase())) ? 'line-through' : 'none', opacity: (isDone || oosItems.has(getDisplayName(item.name).toLowerCase())) ? 0.5 : 1 }}>
                          {getDisplayName(item.name)}
                        </span>
                        <button
                          onClick={() => setReckoningDecisions(d => ({ ...d, [item.id]: { ...d[item.id], action: isDone ? 'carry' : 'done' } }))}
                          style={{ padding: '0.35rem 0.8rem', borderRadius: '8px', border: 'none', background: isDone ? '#16a34a' : '#e2e8f0', color: isDone ? 'white' : '#475569', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0 }}
                        >
                          {isDone ? '✓ Done' : 'Mark Done'}
                        </button>
                      </div>
                      {!isDone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '600' }}>Cases to carry forward:</span>
                          <button onClick={() => setReckoningDecisions(d => ({ ...d, [item.id]: { ...d[item.id], cases: Math.max(1, (d[item.id]?.cases ?? item.cases) - 1) } }))} style={{ width: '1.8rem', height: '1.8rem', borderRadius: '50%', border: '2px solid #fbbf24', background: 'white', fontSize: '1rem', fontWeight: '700', color: '#92400e', cursor: 'pointer', lineHeight: 1 }}>−</button>
                          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#92400e', minWidth: '1.5rem', textAlign: 'center' }}>{decision.cases}</span>
                          <button onClick={() => setReckoningDecisions(d => ({ ...d, [item.id]: { ...d[item.id], cases: Math.min(item.cases, (d[item.id]?.cases ?? item.cases) + 1) } }))} style={{ width: '1.8rem', height: '1.8rem', borderRadius: '50%', border: '2px solid #fbbf24', background: 'white', fontSize: '1rem', fontWeight: '700', color: '#92400e', cursor: 'pointer', lineHeight: 1 }}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={finishReckoning}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', background: '#0f766e', color: 'white', fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer' }}
              >
                Let's go →
              </button>
            </div>
          </div>
        )}

        {/* Hamburger Menu Modal */}
        {showMenu && (
          <div
            onClick={() => { setShowMenu(false); setStorageFiles(null); }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px 24px 0 0',
                padding: '1.5rem',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '60vh',
                overflow: 'auto',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' }}>Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.8rem',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => { setShowMenu(false); setShowNotesBrowser(true); setNotesBrowserDate(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: '#f8fafc',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    position: 'relative'
                  }}
                >
                  <StickyNote size={22} />
                  Notes
                  {Object.keys(notes).length > 0 && (
                    <span style={{
                      position: 'absolute', top: '12px', left: '32px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#f59e0b'
                    }} />
                  )}
                </button>
                <a
                  href="https://inventory.intranet.psfc.coop/login/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: '#f8fafc',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    textDecoration: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <img src="/clover-icon.png" alt="" width="22" height="22" style={{ objectFit: 'contain' }} />
                  Open Clover
                </a>

                <button
                  onClick={async () => {
                    setLoadingStorageFiles(true);
                    setStorageFiles([]);
                    const files = await listAvailableCSVs();
                    setStorageFiles(files);
                    setLoadingStorageFiles(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: '#f0fdf4',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#065f46',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <Upload size={22} />
                  Load Clover data file
                </button>
                {loadingStorageFiles && (
                  <p style={{ fontSize: '0.9rem', color: '#64748b', padding: '0.25rem 0.5rem' }}>Loading files…</p>
                )}
                {storageFiles && storageFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {storageFiles.map(f => (
                      <button
                        key={f.filename}
                        onClick={async () => {
                          await loadCSVFromStorage(f);
                          setStorageFiles([]);
                          setShowMenu(false);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          color: '#1e293b',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        {f.filename}
                      </button>
                    ))}
                  </div>
                )}
                {!loadingStorageFiles && storageFiles !== null && storageFiles.length === 0 && (
                  <p style={{ fontSize: '0.9rem', color: '#64748b', padding: '0.25rem 0.5rem' }}>No files found in storage.</p>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowAddItem(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: '#f8fafc',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add New Item
                </button>


                <button
                  onClick={() => { setShowMenu(false); setShowMediaManager(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: '#f8fafc',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                  Manage Photos & Videos
                </button>

                {!isIPad && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('Mark ALL remaining items as done?')) return;
                      setShowMenu(false);
                      for (const item of items) { await finalizeCompletion(item, null); }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      background: '#fff1f2',
                      border: '2px solid #fecdd3',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#dc2626',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    ☢️ Mark ALL done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Changelog Modal */}
        {showChangelog && (
          <div
            onClick={() => setShowChangelog(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 30px 100px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1e293b' }}>
                  Changelog
                </h3>
                <button
                  onClick={() => setShowChangelog(false)}
                  style={{
                    background: 'white',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.15rem'
                  }}
                >
                  <span style={{ color: '#dc2626', fontSize: '1rem', fontWeight: '800', lineHeight: 1 }}>✕</span>
                  <span>Close</span>
                </button>
              </div>

              {commitsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
                  Loading commits...
                </div>
              ) : commits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '1.1rem' }}>
                  No commits found
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {commits.map((commit, index) => (
                    <div
                      key={commit.sha}
                      style={{
                        background: index === 0 ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        border: index === 0 ? '2px solid #6ee7b7' : '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.4 }}>
                            {commit.message}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem', display: 'flex', gap: '1rem' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{commit.sha}</span>
                            <span>{commit.date}</span>
                          </div>
                        </div>
                        {index === 0 && (
                          <span style={{
                            background: '#10b981',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap'
                          }}>
                            Latest
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timing Events Modal */}
        {showTimingEvents && timingEventsBySKU[showTimingEvents] && (
          <div
            onClick={() => setShowTimingEvents(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 30px 100px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
                    Processing History
                  </h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '1rem' }}>
                    SKU #{showTimingEvents}
                  </p>
                </div>
                <button
                  onClick={() => setShowTimingEvents(null)}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1.05rem',
                    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {timingEventsBySKU[showTimingEvents].map((event, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>
                            TOTAL TIME
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f766e', fontVariantNumeric: 'tabular-nums' }}>
                            {formatTime(event.totalTime)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>
                            CASES
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                            {event.cases}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.25rem' }}>
                            PER CASE
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>
                            {formatTime(event.timePerCase)}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                          EVENT #{index + 1} - {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {!isIPad && (
                      <button
                        onClick={() => deleteTimingEvent(showTimingEvents, index)}
                        style={{
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.75rem 1.5rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '0.95rem',
                          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600', marginBottom: '1rem' }}>
                  Average processing time per case
                </div>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Average</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f766e', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTimeWithUnits(getStats(showTimingEvents)?.average || 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Cases Timed</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>
                      {getStats(showTimingEvents)?.totalCases || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Manager Modal */}
        {showMediaManager && (() => {
          const allItems = [...items, ...completedItems];
          const skuToName = {};
          allItems.forEach(item => { const sku = getSKU(item.name); if (sku) skuToName[sku] = getDisplayName(item.name); });
          const allSKUs = [...new Set([...Object.keys(completionPhotos), ...Object.keys(videos)])];
          return (
            <div
              onClick={() => setShowMediaManager(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, overflow: 'auto' }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ background: 'white', minHeight: '100vh', padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#1e293b' }}>Photos & Videos</h2>
                  <button
                    onClick={() => setShowMediaManager(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.8rem', color: '#64748b', cursor: 'pointer' }}
                  >&times;</button>
                </div>

                {!photosLoaded ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', marginTop: '3rem' }}>Loading...</div>
                ) : allSKUs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', marginTop: '3rem' }}>No photos or videos found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {allSKUs.map(sku => {
                      const name = completionPhotos[sku]?.name || videos[sku]?.name || skuToName[sku] || `SKU #${sku}`;
                      const photo = completionPhotos[sku];
                      const hasVideo = videos[sku]?.exists;
                      const videoURL = mediaVideoURLs[sku];
                      return (
                        <div key={sku} style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 150px', fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>
                            {name}
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '400' }}>#{sku}</div>
                          </div>

                          {photo && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <img
                                src={photo.data}
                                alt={name}
                                style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e2e8f0' }}
                              />
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete photo for ${name}?`)) return;
                                  await deleteCompletionPhotoFromDB(sku);
                                  setCompletionPhotos(prev => { const u = {...prev}; delete u[sku]; return u; });
                                }}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                              >Delete Photo</button>
                            </div>
                          )}

                          {hasVideo && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              {videoURL ? (
                                <video
                                  src={videoURL}
                                  muted
                                  preload="metadata"
                                  style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e2e8f0', background: '#000' }}
                                  onLoadedMetadata={e => { e.target.currentTime = 0.1; }}
                                />
                              ) : (
                                <div style={{ width: '100px', height: '80px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                                </div>
                              )}
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete video for ${name}?`)) return;
                                  await deleteVideoFromDB(sku);
                                  setVideos(prev => { const u = {...prev}; delete u[sku]; return u; });
                                  setMediaVideoURLs(prev => { const u = {...prev}; delete u[sku]; return u; });
                                }}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                              >Delete Video</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Priority Editor Modal */}
        {showPriorityEditor && (
          <div
            onClick={() => setShowPriorityEditor(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
                  Manage Priorities
                </h2>
                <button
                  onClick={() => setShowPriorityEditor(false)}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem' }}>
                These are all the priorities that have been used. You can delete priorities that are no longer needed.
              </p>

              {historicalPriorities.length === 0 ? (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No priorities recorded yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {historicalPriorities.map(priority => (
                    <div
                      key={priority}
                      style={{
                        background: '#f8fafc',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'inline-block',
                          background: getPriorityColor(priority),
                          color: priority === 0 ? '#64748b' : 'white',
                          borderRadius: '10px',
                          padding: '0.5rem 1rem',
                          fontSize: '1.1rem',
                          fontWeight: '700'
                        }}>
                          {priority === 'missing' ? 'Priority missing' : priority === 0 ? 'Shopping floor' : `Priority ${priority}`}
                        </div>
                      </div>
                      {!readOnlyMode && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete priority "${priority === 'missing' ? 'missing' : priority === 0 ? 'Shopping floor' : priority}"? This won't affect existing items.`)) {
                              deletePriority(priority);
                            }
                          }}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Browser Overlay */}
        {showNotesBrowser && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
          }}>
            <div style={{
              background: 'white', borderRadius: '20px', padding: '1.5rem',
              maxWidth: '550px', width: '100%', maxHeight: '80vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              {!notesBrowserDate ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Notes</h2>
                    <button onClick={() => setShowNotesBrowser(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontSize: '1rem', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}>✕</button>
                  </div>
                  {Object.keys(notes).length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No notes yet</p>
                  ) : (
                    Object.keys(notes).sort().reverse().map(dateKey => {
                      const dateNotes = notes[dateKey];
                      const itemCount = dateNotes.itemNotes ? Object.keys(dateNotes.itemNotes).length : 0;
                      const freeformCount = dateNotes.freeformNotes ? Object.keys(dateNotes.freeformNotes).length : 0;
                      if (itemCount === 0 && freeformCount === 0) return null;
                      const d = new Date(dateKey + 'T00:00:00');
                      const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      return (
                        <div
                          key={dateKey}
                          onClick={() => setNotesBrowserDate(dateKey)}
                          style={{
                            padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0',
                            marginBottom: '0.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: dateKey === pdfDate ? '#f0fdf4' : 'white'
                          }}
                        >
                          <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.05rem' }}>{formatted}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {itemCount > 0 && `${itemCount} item${itemCount > 1 ? 's' : ''}`}
                            {itemCount > 0 && freeformCount > 0 && ' · '}
                            {freeformCount > 0 && `${freeformCount} note${freeformCount > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => setNotesBrowserDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b', padding: '0.2rem' }}>←</button>
                      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#1e293b' }}>
                        {new Date(notesBrowserDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </h2>
                    </div>
                    <button onClick={() => setShowNotesBrowser(false)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontSize: '1rem', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}>✕</button>
                  </div>

                  {/* Item Notes */}
                  {notes[notesBrowserDate]?.itemNotes && Object.keys(notes[notesBrowserDate].itemNotes).length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Item Notes</h3>
                      {Object.entries(notes[notesBrowserDate].itemNotes).map(([itemId, note]) => (
                        <div key={itemId} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.4rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.2rem' }}>{note.itemName || itemId}</div>
                          {editingFreeformNote === `item-${itemId}` ? (
                            <input
                              type="text"
                              value={freeformNoteText}
                              onChange={(e) => setFreeformNoteText(e.target.value)}
                              onBlur={() => { saveBrowserNote(notesBrowserDate, 'item', itemId, freeformNoteText); setEditingFreeformNote(null); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { saveBrowserNote(notesBrowserDate, 'item', itemId, freeformNoteText); setEditingFreeformNote(null); }
                                else if (e.key === 'Escape') setEditingFreeformNote(null);
                              }}
                              autoFocus
                              style={{ width: '100%', fontSize: '0.9rem', padding: '0.3rem', border: '1px solid #fbbf24', borderRadius: '4px', background: '#fffbeb', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <div
                              onClick={() => { setEditingFreeformNote(`item-${itemId}`); setFreeformNoteText(note.text); }}
                              style={{ fontSize: '0.9rem', color: '#78350f', cursor: 'pointer' }}
                            >
                              {note.text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Freeform Notes */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Day Notes</h3>
                      {notesBrowserDate === pdfDate && (
                        <button
                          onClick={() => { setEditingFreeformNote('new'); setFreeformNoteText(''); }}
                          style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                        >+ Add</button>
                      )}
                    </div>
                    {notes[notesBrowserDate]?.freeformNotes ? (
                      Object.entries(notes[notesBrowserDate].freeformNotes).map(([noteId, note]) => (
                        <div key={noteId} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.4rem' }}>
                          {editingFreeformNote === noteId ? (
                            <input
                              type="text"
                              value={freeformNoteText}
                              onChange={(e) => setFreeformNoteText(e.target.value)}
                              onBlur={() => { saveBrowserNote(notesBrowserDate, 'freeform', noteId, freeformNoteText); setEditingFreeformNote(null); }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { saveBrowserNote(notesBrowserDate, 'freeform', noteId, freeformNoteText); setEditingFreeformNote(null); }
                                else if (e.key === 'Escape') setEditingFreeformNote(null);
                              }}
                              autoFocus
                              style={{ width: '100%', fontSize: '0.9rem', padding: '0.3rem', border: '1px solid #fbbf24', borderRadius: '4px', background: '#fffbeb', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <div
                              onClick={() => { setEditingFreeformNote(noteId); setFreeformNoteText(note.text); }}
                              style={{ fontSize: '0.9rem', color: '#1e293b', cursor: 'pointer' }}
                            >
                              {note.text}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No day notes</p>
                    )}
                    {editingFreeformNote === 'new' && (
                      <div style={{ padding: '0.5rem 0.75rem', border: '2px solid #f59e0b', borderRadius: '8px', marginBottom: '0.4rem' }}>
                        <input
                          type="text"
                          value={freeformNoteText}
                          onChange={(e) => setFreeformNoteText(e.target.value)}
                          onBlur={() => { saveFreeformNote('new', freeformNoteText); setEditingFreeformNote(null); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { saveFreeformNote('new', freeformNoteText); setEditingFreeformNote(null); }
                            else if (e.key === 'Escape') setEditingFreeformNote(null);
                          }}
                          autoFocus
                          placeholder="Add a day note..."
                          style={{ width: '100%', fontSize: '0.9rem', padding: '0.3rem', border: '1px solid #fbbf24', borderRadius: '4px', background: '#fffbeb', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Daily Log History Overlay */}
        {showDailyLog && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
          }}>
            <div style={{
              background: 'white', borderRadius: '20px', padding: '1.5rem',
              maxWidth: '600px', width: '100%', maxHeight: '85vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              {!dailyLogData ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Daily Log</h2>
                    <button onClick={() => { setShowDailyLog(false); setDailyLogList(null); setDailyLogSearch(''); setDailyLogSearchResults(null); }} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontSize: '1rem', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}>✕</button>
                  </div>
                  <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input
                      type="text"
                      placeholder="Search items across all days..."
                      value={dailyLogSearch}
                      onChange={(e) => {
                        setDailyLogSearch(e.target.value);
                        clearTimeout(window._dlSearchTimer);
                        window._dlSearchTimer = setTimeout(() => searchDailyLogs(e.target.value), 300);
                      }}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: '#1e293b' }}
                    />
                    {dailyLogSearch && (
                      <button onClick={() => { setDailyLogSearch(''); setDailyLogSearchResults(null); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
                    )}
                  </div>

                  {dailyLogSearchResults ? (
                    <>
                      <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        {dailyLogSearchResults.totalHits || 0} result{dailyLogSearchResults.totalHits !== 1 ? 's' : ''} for "{dailyLogSearchResults.query}"
                      </p>
                      {(dailyLogSearchResults.results || []).map(dayResult => {
                        const d = new Date(dayResult.date + 'T00:00:00');
                        const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const sectionColors = { exceptions: '#fee2e2', pulls: '#dbeafe', processing: '#dcfce7', outOfStock: '#fef3c7', notes: '#fef3c7' };
                        const sectionText = { exceptions: '#991b1b', pulls: '#1e40af', processing: '#166534', outOfStock: '#92400e', notes: '#92400e' };
                        const sectionLabels = { exceptions: 'EXC', pulls: 'PULL', processing: 'PROC', outOfStock: 'O/S', notes: 'NOTE' };
                        return (
                          <div key={dayResult.date} style={{ marginBottom: '0.75rem' }}>
                            <p style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.25rem' }}>{dayResult.dayOfWeek} {formatted}</p>
                            {dayResult.hits.map((hit, i) => {
                              const name = hit.rawDescription || hit.itemName || hit.text || '';
                              const section = hit.section;
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                                  <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 5px', borderRadius: '4px', background: sectionColors[section] || '#f1f5f9', color: sectionText[section] || '#64748b', whiteSpace: 'nowrap', marginTop: '2px' }}>{sectionLabels[section] || section}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontWeight: '600' }}>{name}</span>
                                    {hit.supplierName && <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>{hit.supplierName}</span>}
                                    {hit.quantityReceived !== undefined && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}> {hit.quantityReceived ?? '?'}/{hit.quantityExpected ?? '?'}</span>}
                                    {hit.pullQuantity !== undefined && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}> {hit.pullQuantity} cases{hit.pullConfirmed ? ' ✓' : ''}</span>}
                                    {hit.cases !== undefined && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}> {hit.cases} cases</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      {dailyLogSearchResults.totalHits === 0 && (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>No matches found</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Last 7 Days</p>
                      {!dailyLogList ? (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Loading...</p>
                      ) : dailyLogList.length === 0 ? (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No daily logs yet</p>
                      ) : (
                        dailyLogList.map(log => {
                          const d = new Date(log.date + 'T00:00:00');
                          const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          return (
                            <div
                              key={log.date}
                              onClick={() => loadDailyLogDetail(log.date)}
                              style={{
                                padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0',
                                marginBottom: '0.5rem', cursor: 'pointer', background: 'white'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.05rem' }}>{formatted}</span>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: log.status === 'complete' ? '#34c759' : '#f59e0b' }} />
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {log.totalItemsExpected || 0} items · {log.totalCasesExpected || 0} cases
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                                {log.exceptionCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '1px 6px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b' }}>{log.exceptionCount} exc</span>}
                                {log.pullCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '1px 6px', borderRadius: '8px', background: '#dbeafe', color: '#1e40af' }}>{log.pullCount} pulls</span>}
                                {log.processingCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '1px 6px', borderRadius: '8px', background: '#dcfce7', color: '#166534' }}>{log.processingCount} processed</span>}
                                {log.noteCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '1px 6px', borderRadius: '8px', background: '#fef3c7', color: '#92400e' }}>{log.noteCount} notes</span>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => setDailyLogData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b', padding: '0.2rem' }}>←</button>
                      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#1e293b' }}>
                        {dailyLogData.dayOfWeek} {new Date(dailyLogData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </h2>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '8px', background: dailyLogData.status === 'complete' ? '#dcfce7' : '#fef9c3', color: dailyLogData.status === 'complete' ? '#166534' : '#854d0e' }}>{dailyLogData.status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <a href={`${DELIVERY_API}/daily-logs/${dailyLogData.date}/report`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', fontWeight: '600', color: '#007aff', textDecoration: 'none', padding: '4px 10px', border: '1px solid #007aff', borderRadius: '8px' }}>Report ↗</a>
                      <button onClick={() => { setShowDailyLog(false); setDailyLogData(null); setDailyLogList(null); }} style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontSize: '1rem', cursor: 'pointer', fontWeight: '700', color: '#64748b' }}>✕</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                    <span>{dailyLogData.totalItemsExpected || 0} items expected</span>
                    <span>{dailyLogData.totalCasesExpected || 0} cases expected</span>
                    <span>{dailyLogData.totalItemsReceived || 0} received</span>
                    {dailyLogData.totalItemsProcessed > 0 && <span>{dailyLogData.totalItemsProcessed} processed</span>}
                  </div>

                  {/* Exceptions */}
                  {(dailyLogData.exceptions || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.3rem' }}>Exceptions <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>{dailyLogData.exceptions.length}</span></p>
                      {dailyLogData.exceptions.map((e, i) => (
                        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', background: e.receivedStatus === 'SHORT' ? '#fee2e2' : e.receivedStatus === 'OVER' ? '#dbeafe' : '#fef3c7', color: e.receivedStatus === 'SHORT' ? '#991b1b' : e.receivedStatus === 'OVER' ? '#1e40af' : '#92400e' }}>{e.receivedStatus}</span>
                          <span style={{ fontWeight: '600' }}>{e.rawDescription}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{e.quantityReceived ?? '?'}/{e.quantityExpected ?? '?'}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', width: '100%' }}>{e.supplierName}</span>
                          {e.receivedNotes && <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic', width: '100%' }}>{e.receivedNotes}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pulls */}
                  {(dailyLogData.pulls || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.3rem' }}>Pulls <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>{dailyLogData.pulls.length}</span></p>
                      {dailyLogData.pulls.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '700', background: '#f1f5f9', borderRadius: '6px', padding: '1px 6px', minWidth: '1.5rem', textAlign: 'center' }}>{p.pullQuantity}</span>
                          <span style={{ fontWeight: '500', flex: 1 }}>{p.rawDescription}</span>
                          <span>{p.pullConfirmed ? '✓' : '○'}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.supplierName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Processing */}
                  {(dailyLogData.processing || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.3rem' }}>Processing <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>{dailyLogData.processing.length}</span></p>
                      {dailyLogData.processing.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '500', flex: 1 }}>{p.itemName}</span>
                          <span style={{ fontWeight: '600' }}>{p.cases || 0} cs</span>
                          {p.totalTime && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{Math.round(p.totalTime / 60)}m</span>}
                          {p.photoUrl && <a href={p.photoUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>📷</a>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Out of Stock */}
                  {(dailyLogData.outOfStock || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.3rem' }}>Out of Stock <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>{dailyLogData.outOfStock.length}</span></p>
                      {dailyLogData.outOfStock.map((o, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '500', flex: 1 }}>{o.rawDescription}</span>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{o.supplierName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {(dailyLogData.notes || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.3rem' }}>Notes <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px', fontWeight: '600' }}>{dailyLogData.notes.length}</span></p>
                      {dailyLogData.notes.map((n, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <span>{n.type === 'item' ? '📦' : n.type === 'delivery' ? '🚚' : '📝'}</span>
                          <div style={{ flex: 1 }}>
                            {n.itemName && <span style={{ fontWeight: '600', fontSize: '0.8rem', display: 'block' }}>{n.itemName}</span>}
                            <span style={{ color: '#1e293b' }}>{n.text}</span>
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>{n.source === 'produce-processor' ? 'PP' : 'DLV'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(dailyLogData.exceptions || []).length === 0 && (dailyLogData.pulls || []).length === 0 && (dailyLogData.processing || []).length === 0 && (dailyLogData.notes || []).length === 0 && (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>No data in this log yet</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
    </>
  );
};

export default ProduceProcessorApp;
