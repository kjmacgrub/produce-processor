import { useState, useEffect, useRef } from 'react';
import { ref, onValue, get, set, remove, push, child, update } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from './firebase';
import { Upload, Play, Package, ClipboardList, Video, Timer, Eye, Pencil, Clock, AlertCircle } from 'lucide-react';

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
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingItemId, setRecordingItemId] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);

  const [showTimingEvents, setShowTimingEvents] = useState(null);
  const [pdfDate, setPdfDate] = useState('');
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
  const [completionMediaStream, setCompletionMediaStream] = useState(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationEditText, setLocationEditText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
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

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const completionVideoRef = useRef(null);
  const completionCanvasRef = useRef(null);
  const playbackVideoRef = useRef(null);

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

  // Handle completion camera stream
  useEffect(() => {
    if (!showCompletionCamera) { setPhotoTaken(false); setPhotoData(null); return; }
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        setCompletionMediaStream(stream);
        setTimeout(() => {
          if (completionVideoRef.current) {
            completionVideoRef.current.srcObject = stream;
            completionVideoRef.current.play().catch(e => console.log('Video play failed:', e));
          }
        }, 100);
      } catch (error) { console.error('Error accessing camera:', error); alert('Could not access camera.'); }
    };
    startCamera();
    return () => { if (completionMediaStream) { completionMediaStream.getTracks().forEach(track => track.stop()); setCompletionMediaStream(null); } };
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

  // Load completion photos from Firebase
  useEffect(() => {
    if (!db) return;
    const photosRef = ref(db, 'completionPhotos');
    const unsub = onValue(photosRef, (snapshot) => { const data = snapshot.val(); if (data) { setCompletionPhotos(data); } else { setCompletionPhotos({}); } });
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
      const loadedVideos = await loadAllVideosFromDB();
      setVideos(loadedVideos);
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

  // Pull-to-refresh detection
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e) => { if (window.scrollY === 0) startY = e.touches[0].clientY; };
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
  }, [isPulling, pullDistance, isProcessing, pdfDate]);

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

  const saveCompletionPhotoToDB = async (sku, pd) => {
    try {
      const idb = await openDB();
      const tx = idb.transaction(['completionPhotos'], 'readwrite');
      tx.objectStore('completionPhotos').put({ id: sku, data: pd.data, timestamp: pd.timestamp });
      if (db) await set(ref(db, `completionPhotos/${sku}`), { data: pd.data, timestamp: pd.timestamp });
    } catch (error) { console.error('Error saving completion photo:', error); alert('Error saving photo.'); }
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
    } catch (error) { console.error('Error uploading video:', error); throw error; }
  };

  const deleteVideoFromStorage = async (sku) => {
    if (!storage) return;
    try {
      await deleteObject(sRef(storage, `produce-videos/${sku}.webm`));
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
      const result = await listAll(sRef(storage, 'produce-pdfs'));
      const csvFiles = result.items.filter(item => item.name.toLowerCase().endsWith('.csv'));
      const filesWithDates = await Promise.all(csvFiles.map(async (fileRef) => {
        try {
          const url = await getDownloadURL(fileRef);
          const response = await fetch(url);
          const text = await response.text();
          const firstLine = text.split(/\r?\n/)[0];
          const dateMatch = firstLine.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) return { filename: fileRef.name, date: dateMatch[1], fileType: 'csv' };
          return null;
        } catch (error) { return null; }
      }));
      const validFiles = filesWithDates.filter(Boolean);
      validFiles.sort((a, b) => b.date.localeCompare(a.date));
      return validFiles;
    } catch (error) { console.error('Error listing files:', error); return []; }
  };

  const loadCSVFromStorage = async (fileInfo) => {
    if (!storage || !db || readOnlyMode) return;
    try {
      const storageRef = sRef(storage, `produce-pdfs/${fileInfo.filename}`);
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
      const itemsWithIds = parsedItems.map((item, index) => ({ id: `item-${Date.now()}-${index}`, ...item }));
      const itemsObject = {};
      itemsWithIds.forEach(item => { itemsObject[item.id] = item; });
      await set(ref(db, 'items'), itemsObject);
      await set(ref(db, 'completedItems'), {});
      await set(ref(db, 'totalCases'), totalCases);
      setOriginalTotalCases(totalCases);
      let csvDate = dateHint;
      if (!csvDate) {
        const dateMatch = lines[0].match(/(\d{4}-\d{2}-\d{2})/);
        csvDate = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
      }
      await set(ref(db, 'pdfDate'), csvDate);
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
      const itemsRef2 = ref(db, 'items');
      await remove(itemsRef2);
      const newItems = {};
      parsedItems.forEach(item => { const key = push(child(ref(db), 'items')).key; newItems[key] = item; });
      await update(itemsRef2, newItems);
      await remove(ref(db, 'completedItems'));
      if (dateMatch) await set(ref(db, 'pdfDate'), dateMatch[1]);
      await set(ref(db, 'originalTotalCases'), totalCases);
      const newPriorities = [...new Set(parsedItems.map(item => item.priority))];
      const snap = await get(ref(db, 'historicalPriorities'));
      const currentPriorities = firebaseToArray(snap.val());
      const combined = [...new Set([...currentPriorities, ...newPriorities])].sort((a, b) => {
        const aN = typeof a === 'number' && a > 0, bN = typeof b === 'number' && b > 0;
        if (aN && bN) return a - b; if (aN) return -1; if (bN) return 1;
        if (a === 'missing') return -1; if (b === 'missing') return 1; return 0;
      });
      await set(ref(db, 'historicalPriorities'), combined);
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

  const handleVideoUpload = (event, item) => {
    if (readOnlyMode) return;
    const file = event.target.files[0];
    if (!file) return;
    const sku = getSKU(item.name);
    if (!sku) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await saveVideoToDB(sku, { data: e.target.result, name: file.name, type: file.type });
        setShowVideoUpload(null);
        await new Promise(resolve => setTimeout(resolve, 300));
        window.location.reload();
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
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
          await saveVideoToDB(sku, { data: blob, name: `recording-${Date.now()}.webm`, type: blob.type });
          setIsRecording(false); setRecordingItemId(null); setShowVideoUpload(null);
          await new Promise(resolve => setTimeout(resolve, 300));
          window.location.reload();
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

  const markComplete = async (item) => { if (readOnlyMode || !db) return; setShowPhotoChoice(item); };

  const finalizeCompletion = async (item, pd) => {
    if (readOnlyMode || !db) return;
    const sku = getSKU(item.name);
    if (pd && sku) { await saveCompletionPhotoToDB(sku, pd); setCompletionPhotos(prev => ({ ...prev, [sku]: pd })); }
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
    <div style={{
      minHeight: '100vh',
      background: readOnlyMode
        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #0f766e 0%, #14532d 100%)',
      padding: '2rem',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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

        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem',
          position: 'relative',
          boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
          border: '14px solid #3a6b1e',
          backgroundImage: `
            linear-gradient(white, white),
            url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10,50 Q20,30 30,50 T50,50 T70,50 T90,50' stroke='%23543b2c' stroke-width='3' fill='none'/%3E%3Cpath d='M15,45 Q20,38 25,35 Q22,40 20,45 Q18,42 15,45 Z' fill='%234a8526'/%3E%3Cpath d='M35,55 Q40,48 45,45 Q42,50 40,55 Q38,52 35,55 Z' fill='%233a6b1e'/%3E%3Cpath d='M55,45 Q60,38 65,35 Q62,40 60,45 Q58,42 55,45 Z' fill='%234a8526'/%3E%3Cpath d='M75,55 Q80,48 85,45 Q82,50 80,55 Q78,52 75,55 Z' fill='%232d5016'/%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,10 Q30,20 50,30 T50,50 T50,70 T50,90' stroke='%23543b2c' stroke-width='3' fill='none'/%3E%3Cpath d='M45,15 Q38,20 35,25 Q40,22 45,20 Q42,18 45,15 Z' fill='%234a8526'/%3E%3Cpath d='M55,35 Q48,40 45,45 Q50,42 55,40 Q52,38 55,35 Z' fill='%233a6b1e'/%3E%3Cpath d='M45,55 Q38,60 35,65 Q40,62 45,60 Q42,58 45,55 Z' fill='%234a8526'/%3E%3Cpath d='M55,75 Q48,80 45,85 Q50,82 55,80 Q52,78 55,75 Z' fill='%232d5016'/%3E%3C/svg%3E")
          `,
          backgroundPosition: 'center, top, left',
          backgroundSize: 'auto, 100% 14px, 14px 100%',
          backgroundRepeat: 'no-repeat, repeat-x, repeat-y',
          backgroundClip: 'padding-box, border-box, border-box',
          backgroundOrigin: 'padding-box, border-box, border-box'
        }}>

          {/* Date display */}
          <div style={{
            fontSize: '2.2rem',
            fontWeight: '700',
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '0.75rem'
          }}>
            {pdfDate ? formatDateWithDay(pdfDate) : 'No data file loaded'}
          </div>

          {/* Centered title */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{
              margin: 0,
              fontSize: '3rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #0f766e 0%, #14532d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              Produce Processing
            </h1>

            <div style={{
              fontSize: '0.9rem',
              color: '#64748b',
              fontWeight: '700',
              marginTop: '0.5rem',
              letterSpacing: '0.05em'
            }}>
              v2.152
            </div>

            {/* Progress Bar and Metrics */}
            <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '600px', margin: '1.5rem auto 0' }}>
              {(() => {
                const completedCases = completedItems.reduce((sum, item) => sum + item.cases, 0);
                const remainingCases = originalTotalCases - completedCases;
                const remainingItems = items.length;
                const completedPercentage = originalTotalCases > 0 ? (completedCases / originalTotalCases) * 100 : 0;

                  return (
                    <div>
                      <div style={{
                        width: '100%',
                        height: '40px',
                        background: '#e2e8f0',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        <div
                          style={{
                            width: `${completedPercentage}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                            transition: 'width 0.5s ease',
                            borderRadius: '20px',
                            cursor: 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}
                        >
                          {completedCases > 0 && (
                            <div style={{
                              color: 'white',
                              fontWeight: '800',
                              fontSize: '1.1rem',
                              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              userSelect: 'none'
                            }}>
                              {completedCases}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{
                        marginTop: '1.5rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: '#64748b',
                          marginBottom: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Remaining
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '3rem',
                          flexWrap: 'wrap'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '3.5rem',
                              fontWeight: '900',
                              color: '#0f766e',
                              lineHeight: '1',
                              marginBottom: '0.25rem'
                            }}>
                              {remainingCases}
                            </div>
                            <div style={{
                              fontSize: '1.5rem',
                              fontWeight: '700',
                              color: '#64748b'
                            }}>
                              cases
                            </div>
                          </div>

                          <div>
                            <div style={{
                              fontSize: '3.5rem',
                              fontWeight: '900',
                              color: '#0f766e',
                              lineHeight: '1',
                              marginBottom: '0.25rem'
                            }}>
                              {remainingItems}
                            </div>
                            <div style={{
                              fontSize: '1.5rem',
                              fontWeight: '700',
                              color: '#64748b'
                            }}>
                              {remainingItems === 1 ? 'item' : 'items'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
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

        {/* No items message - Work mode */}
        {items.length === 0 && !readOnlyMode && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 25px 70px rgba(0,0,0,0.25)'
          }}>
            <Upload size={72} style={{ color: '#0f766e', marginBottom: '1.5rem' }} />
            <h2 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '2rem', fontWeight: '700' }}>
              Load File to Begin
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
              Select a date to load processing data
            </p>
            <button
              onClick={async () => {
                const dates = await listAvailableCSVs();
                setAvailableDates(dates);
                setShowStoragePicker(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #14532d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '1.25rem 3.5rem',
                fontSize: '1.2rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(15, 118, 110, 0.4)'
              }}
            >
              📋 Load New Day
            </button>
          </div>
        )}

        {/* No items message - View mode */}
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

        {/* Add Item Button */}
        {!readOnlyMode && items.length > 0 && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAddItem(true)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>+</span> Add Item
            </button>
          </div>
        )}

        {/* Items List */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {[...items].sort((a, b) => {
              const priorityA = a.priority === 'missing' ? 9999 : a.priority;
              const priorityB = b.priority === 'missing' ? 9999 : b.priority;
              return priorityA - priorityB;
            }).map(item => {
            const sku = getSKU(item.name);
            const stats = sku ? getStats(sku) : null;
            const hasVideo = sku ? videos[sku] : null;

            return (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: activeItem?.id === item.id
                    ? '0 8px 35px rgba(15, 118, 110, 0.3)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  border: activeItem?.id === item.id ? '3px solid #0f766e' : '3px solid transparent',
                  transform: activeItem?.id === item.id ? 'scale(1.02)' : 'scale(1)',
                  position: 'relative'
                }}
              >
                {/* Vegetable/Fruit corner decorations */}
                {(() => {
                  const produceEmojis = ['🍅', '🥒', '🌽', '🍆', '🥬', '🥦', '🫑', '🌶️', '🥕', '🧅', '🧄', '🥔', '🍠', '🫘', '🍄', '🥜', '🫚'];

                  const getEmojiForPosition = (position) => {
                    const str = item.id + position;
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) {
                      hash = ((hash << 5) - hash) + str.charCodeAt(i);
                      hash = hash & hash;
                    }
                    return produceEmojis[Math.abs(hash) % produceEmojis.length];
                  };

                  return (
                    <>
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '2.5rem',
                        opacity: 0.6
                      }}>{getEmojiForPosition('top-right')}</div>
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        fontSize: '2.5rem',
                        opacity: 0.6
                      }}>{getEmojiForPosition('bottom-left')}</div>
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        fontSize: '2.5rem',
                        opacity: 0.6
                      }}>{getEmojiForPosition('bottom-right')}</div>
                    </>
                  );
                })()}

                {/* Header Info */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '2rem',
                      fontWeight: '800',
                      color: '#1e293b',
                      letterSpacing: '-0.01em',
                      textAlign: 'left',
                      fontFamily: 'Georgia, "Times New Roman", Times, serif'
                    }}>
                      {getDisplayName(item.name)}
                    </h3>
                  </div>

                  {/* Line 2: Cases + Done button + Start Timer button */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.6rem', color: '#64748b', flexShrink: 0 }}>
                      <Package size={26} />
                      <span style={{ fontWeight: '600' }}>{item.cases} cases</span>
                    </div>

                    {!readOnlyMode && (
                      <button
                        onClick={() => markComplete(item)}
                        style={{
                          background: (itemsInProcess[item.id] || itemsPaused[item.id])
                            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: (itemsInProcess[item.id] || itemsPaused[item.id]) ? '#fbbf24' : 'white',
                          border: (itemsInProcess[item.id] || itemsPaused[item.id]) ? '2px solid #fbbf24' : 'none',
                          borderRadius: '12px',
                          padding: '1.2rem 2rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          boxShadow: (itemsInProcess[item.id] || itemsPaused[item.id])
                            ? '0 4px 15px rgba(251, 191, 36, 0.3)'
                            : '0 4px 15px rgba(16, 185, 129, 0.3)',
                          flex: '0 0 auto',
                          minWidth: '180px',
                          justifyContent: 'center'
                        }}
                      >
                        {(itemsInProcess[item.id] || itemsPaused[item.id]) ? 'Timing...' : 'Done'}
                      </button>
                    )}

                    {!readOnlyMode && !itemsInProcess[item.id] && !itemsPaused[item.id] && (
                      <>
                        <button
                          onClick={() => handleBeginProcessing(item.id)}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '1.2rem 2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                            flex: '0 0 auto',
                            minWidth: '180px',
                            justifyContent: 'center'
                          }}
                        >
                          Start Timer
                        </button>
                        {(() => {
                          const sku = getSKU(item.name);
                          const stats = sku ? getStats(sku) : null;
                          return stats ? (
                            <span
                              onClick={!isIPad ? () => setShowTimingEvents(sku) : undefined}
                              style={{
                                fontSize: '1.1rem',
                                color: '#0f766e',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                cursor: !isIPad ? 'pointer' : 'default',
                                textDecoration: !isIPad ? 'underline' : 'none',
                                textDecorationStyle: 'dotted',
                                textUnderlineOffset: '3px'
                              }}
                            >
                              avg {formatTimeWithUnits(stats.average)}/case
                            </span>
                          ) : null;
                        })()}
                      </>
                    )}
                  </div>

                  {/* Line 3: Instructions on left, Buttons on right */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                    {/* Instructions panel - editable */}
                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '2px solid #fbbf24',
                      flex: '1 1 auto',
                      minWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: '#92400e',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem'
                      }}>
                        Instructions
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        color: '#78350f',
                        flex: '1',
                        position: 'relative'
                      }}>
                        {editingLocation === item.id ? (
                          <input
                            type="text"
                            value={locationEditText}
                            onChange={(e) => setLocationEditText(e.target.value)}
                            onBlur={() => {
                              updateLocation(item.id, locationEditText);
                              setEditingLocation(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateLocation(item.id, locationEditText);
                                setEditingLocation(null);
                              } else if (e.key === 'Escape') {
                                setEditingLocation(null);
                              }
                            }}
                            autoFocus
                            style={{
                              fontSize: '1.8rem',
                              fontWeight: '600',
                              color: '#78350f',
                              background: 'white',
                              border: '2px solid #fbbf24',
                              borderRadius: '8px',
                              padding: '0.5rem',
                              textAlign: 'center',
                              width: '100%'
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => {
                              if (!readOnlyMode) {
                                setEditingLocation(item.id);
                                setLocationEditText(item.location);
                              }
                            }}
                            style={{
                              fontWeight: '600',
                              cursor: readOnlyMode ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem'
                            }}
                          >
                            <span>{item.location}</span>
                            {!readOnlyMode && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ opacity: 0.5 }}
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video button */}
                    {!readOnlyMode && (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'stretch' }}>
                        {hasVideo ? (
                          <button
                            onClick={() => {
                              console.log('Video button clicked. SKU:', sku);
                              console.log('Video data exists:', !!videos[sku]);
                              console.log('Video data:', videos[sku]);
                              setPlayingVideo(sku);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '1rem 1.5rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.6rem',
                              fontWeight: '700',
                              fontSize: '1.1rem',
                              boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)',
                              minWidth: '180px',
                              minHeight: '100%'
                            }}
                          >
                            <Play size={22} />
                            Watch
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowVideoUpload(item.id)}
                            style={{
                              background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '1rem 1.5rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.6rem',
                              fontWeight: '700',
                              fontSize: '1.1rem',
                              boxShadow: '0 4px 15px rgba(100, 116, 139, 0.2)',
                              minWidth: '180px',
                              minHeight: '100%'
                            }}
                          >
                            <Video size={22} />
                            Make video
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority dropdown */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  {!readOnlyMode ? (
                    <select
                      value={item.priority}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'EDIT') {
                          setShowPriorityEditor(true);
                        } else {
                          updatePriority(item.id, val);
                        }
                      }}
                      style={{
                        background: '#1e293b',
                        color: '#fbbf24',
                        border: '2px solid #fbbf24',
                        borderRadius: '10px',
                        padding: '0.5rem 1rem',
                        fontSize: '1rem',
                        fontWeight: '700',
                        width: '33.33%',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <option value={item.priority}>
                        {item.priority === 'missing' ? 'Priority missing' : item.priority === 0 ? 'Shopping floor' : `Priority ${item.priority}`}
                      </option>
                      {historicalPriorities.filter(p => p !== item.priority).map(p => (
                        <option key={p} value={p}>
                          {p === 'missing' ? 'Priority missing' : p === 0 ? 'Shopping floor' : `Priority ${p}`}
                        </option>
                      ))}
                      <option value="EDIT" style={{ fontStyle: 'italic', borderTop: '1px solid #ccc' }}>
                        ✏️ Edit priorities...
                      </option>
                    </select>
                  ) : (
                    <div style={{
                      background: '#1e293b',
                      color: '#fbbf24',
                      border: '2px solid #fbbf24',
                      borderRadius: '10px',
                      padding: '0.4rem 1rem',
                      fontSize: '1rem',
                      fontWeight: '700',
                      textAlign: 'center',
                      width: '33.33%'
                    }}>
                      {item.priority === 'missing' ? 'Priority missing' : item.priority === 0 ? 'Shopping floor' : `Priority ${item.priority}`}
                    </div>
                  )}
                </div>

              </div>
            );
          })}

            {/* Completed Items Section */}
            {completedItems.length > 0 && (
              <>
                <div style={{
                  textAlign: 'center',
                  padding: '1rem 0',
                  color: '#94a3b8',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderTop: '2px dashed #e2e8f0',
                  marginTop: '0.5rem'
                }}>
                  Completed
                </div>

                {[...completedItems].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).map(item => {
                  const sku = getSKU(item.name);
                  const photo = sku ? completionPhotos[sku] : null;

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#f0fdf4',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        opacity: 0.75,
                        border: '2px solid #d1fae5'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.9rem',
                            fontWeight: '700'
                          }}>
                            ✓
                          </div>
                          <h3 style={{
                            margin: 0,
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: '#1e293b'
                          }}>
                            {getDisplayName(item.name)}
                          </h3>
                        </div>
                        <div style={{ fontSize: '1.1rem', color: '#64748b' }}>
                          <strong>{item.cases}</strong> cases • {item.location}
                        </div>
                      </div>

                      {/* Completion Photo */}
                      {photo && (
                        <div style={{
                          width: '200px',
                          flexShrink: 0
                        }}>
                          <img
                            src={photo.data}
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem;';
                              modal.onclick = () => modal.remove();

                              const img = document.createElement('img');
                              img.src = photo.data;
                              img.style.cssText = 'max-width: 100%; max-height: 100%; border-radius: 16px;';
                              modal.appendChild(img);

                              document.body.appendChild(modal);
                            }}
                          />
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            textAlign: 'center',
                            marginTop: '0.5rem'
                          }}>
                            📸 Completion photo
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'right' }}>
                          {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {!readOnlyMode && (
                          <button
                            onClick={() => undoComplete(item)}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '0.75rem 1.5rem',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '0.95rem',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ↶ Undo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

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

                            if (db) {
                              await remove(ref(db, `completionPhotos/${sku}`));
                            }
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
                          Skip
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
                    <button
                      onClick={() => {
                        if (completionVideoRef.current && completionCanvasRef.current) {
                          const video = completionVideoRef.current;
                          const canvas = completionCanvasRef.current;
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(video, 0, 0);

                          canvas.toBlob((blob) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const photoDataObj = {
                                data: reader.result,
                                timestamp: new Date().toISOString()
                              };
                              setPhotoData(photoDataObj);
                              setPhotoTaken(true);

                              if (completionMediaStream) {
                                completionMediaStream.getTracks().forEach(track => track.stop());
                                setCompletionMediaStream(null);
                              }
                            };
                            reader.readAsDataURL(blob);
                          }, 'image/jpeg', 0.9);
                        }
                      }}
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
                      onClick={() => {
                        if (completionMediaStream) {
                          completionMediaStream.getTracks().forEach(track => track.stop());
                          setCompletionMediaStream(null);
                        }
                        finalizeCompletion(showCompletionCamera, null);
                      }}
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
                      onClick={() => {
                        if (completionMediaStream) {
                          completionMediaStream.getTracks().forEach(track => track.stop());
                          setCompletionMediaStream(null);
                        }
                        setShowCompletionCamera(null);
                      }}
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

                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#000',
                  padding: '1rem'
                }}>
                  <video
                    ref={completionVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      borderRadius: '8px'
                    }}
                  />
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
                    onClick={async () => {
                      setPhotoTaken(false);
                      setPhotoData(null);
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                          video: {
                            facingMode: 'environment',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                          },
                          audio: false
                        });
                        setCompletionMediaStream(stream);

                        setTimeout(() => {
                          if (completionVideoRef.current) {
                            completionVideoRef.current.srcObject = stream;
                            completionVideoRef.current.play().catch(e => {
                              console.log('Video play failed, but stream should still work:', e);
                            });
                          }
                        }, 100);
                      } catch (error) {
                        console.error('Error restarting camera:', error);
                      }
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

            <canvas ref={completionCanvasRef} style={{ display: 'none' }} />
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
                  <p style={{ fontSize: '0.9rem' }}>Upload CSV files to Firebase Storage in folder: <code>produce-pdfs/</code></p>
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
              padding: '2rem',
              backdropFilter: 'blur(10px)'
            }}
            onClick={() => setPlayingVideo(null)}
          >
            {console.log('🎬 Video modal rendering. playingVideo:', playingVideo, 'Video src:', videoSrc)}
            <div
              style={{
                background: 'white',
                borderRadius: '24px',
                padding: '2rem',
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 30px 100px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#1e293b' }}>
                  Processing Instructions
                </h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
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
                  paddingRight: '60px'
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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

        {/* Floating Timers - Multiple Support, Bottom-Right */}
        {(() => {
          const activeTimerIds = [
            ...Object.keys(itemsInProcess).filter(id => itemsInProcess[id]),
            ...Object.keys(itemsPaused).filter(id => itemsPaused[id])
          ];

          if (activeTimerIds.length === 0) return null;

          const bottomTimers = activeTimerIds.slice(0, 2);
          const stackedTimers = activeTimerIds.slice(2, 4);

          const renderTimer = (timerId) => {
            const timerItem = [...items, ...completedItems].find(i => i.id === timerId);
            if (!timerItem) return null;

            const isPaused = itemsPaused[timerId];
            const elapsed = elapsedTimes[timerId] || 0;

            return (
              <div
                key={timerId}
                style={{
                  background: isPaused
                    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#fbbf24',
                  border: isPaused ? '3px solid #64748b' : '3px solid #fbbf24',
                  borderRadius: '20px',
                  padding: '1.5rem 2rem',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  minWidth: '280px',
                  maxWidth: '320px',
                  position: 'relative'
                }}>
                  {/* Cancel button at top center */}
                  <button
                    onClick={() => {
                      setItemsInProcess(prev => ({ ...prev, [timerId]: false }));
                      setItemsPaused(prev => ({ ...prev, [timerId]: false }));
                      setElapsedTimes(prev => ({ ...prev, [timerId]: 0 }));
                      setStartTimes(prev => {
                        const newTimes = { ...prev };
                        delete newTimes[timerId];
                        return newTimes;
                      });
                    }}
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#ef4444',
                      color: 'white',
                      border: '2px solid #dc2626',
                      borderRadius: '20px',
                      padding: '0.4rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                      transition: 'all 0.2s',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dc2626';
                      e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                    }}
                  >
                    ✕ Cancel
                  </button>

                  {/* Item name */}
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    color: '#fbbf24',
                    maxWidth: '250px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getDisplayName(timerItem.name)}
                  </div>

                  {/* Timer display */}
                  <div style={{
                    fontSize: '3.5rem',
                    fontWeight: '900',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: '1',
                    letterSpacing: '-0.02em',
                    color: '#fbbf24'
                  }}>
                    {formatTime(elapsed)}
                  </div>

                  {/* Time per case and historic average */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    color: '#94a3b8'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                        Per Case
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#fbbf24',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {formatTime(Math.floor(elapsed / timerItem.cases))}
                      </div>
                    </div>

                    {(() => {
                      const sku = getSKU(timerItem.name);
                      const stats = sku ? getStats(sku) : null;
                      if (!stats) return null;

                      return (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                            Avg
                          </div>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#0f766e',
                            fontVariantNumeric: 'tabular-nums'
                          }}>
                            {formatTime(stats.average)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status and buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexDirection: 'column',
                    width: '100%'
                  }}>
                    {isPaused && (
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#94a3b8'
                      }}>
                        Paused
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      width: '100%'
                    }}>
                      <button
                        onClick={() => handleBeginProcessing(timerId)}
                        style={{
                          background: isPaused ? '#fbbf24' : 'transparent',
                          color: isPaused ? '#1e293b' : '#fbbf24',
                          border: isPaused ? 'none' : '2px solid #fbbf24',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          flex: '1'
                        }}
                        onMouseEnter={(e) => {
                          if (isPaused) {
                            e.currentTarget.style.background = '#f59e0b';
                          } else {
                            e.currentTarget.style.background = '#fbbf24';
                            e.currentTarget.style.color = '#1e293b';
                          }
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (isPaused) {
                            e.currentTarget.style.background = '#fbbf24';
                          } else {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#fbbf24';
                          }
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {isPaused ? 'Restart' : 'Pause'}
                      </button>

                      <button
                        onClick={() => markComplete(timerItem)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          flex: '1'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#059669';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#10b981';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              );
            };

          return (
            <>
              {/* Bottom row: First 2 timers side by side */}
              <div style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'row-reverse',
                gap: '1rem',
                alignItems: 'flex-end'
              }}>
                {bottomTimers.map(timerId => renderTimer(timerId))}
              </div>

              {/* Stacked timers: 3rd and 4th stack vertically on right */}
              {stackedTimers.length > 0 && (
                <div style={{
                  position: 'fixed',
                  bottom: 'calc(2rem + 280px + 1rem)',
                  right: '2rem',
                  zIndex: 999,
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  gap: '1rem',
                  alignItems: 'flex-end'
                }}>
                  {stackedTimers.map(timerId => renderTimer(timerId))}
                </div>
              )}
            </>
          );
        })()}

      </div>
    </div>
  );
};

export default ProduceProcessorApp;
