const DB_NAME = 'productivity-timer';
const DB_VERSION = 1;
const SESSION_STORE = 'sessions';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(SESSION_STORE)) return;

      const store = db.createObjectStore(SESSION_STORE, {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('startTime', 'startTime', { unique: false });
      store.createIndex('labels', 'labels', { unique: false, multiEntry: true });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function saveSession(session) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);
    const request = store.add(normalizeSession(session));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getSessionsByDateRange(start, end) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readonly');
    const index = transaction.objectStore(SESSION_STORE).index('startTime');
    const range = IDBKeyRange.bound(start, end);
    const request = index.getAll(range);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateSessionCalendarSync(id, syncResult) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const session = request.result;
      if (!session) {
        resolve(null);
        return;
      }
      session.calendarSynced = syncResult.calendarSynced;
      session.calendarSyncStatus = syncResult.calendarSyncStatus;
      session.calendarEventId = syncResult.calendarEventId;
      const putRequest = store.put(session);
      putRequest.onsuccess = () => resolve(session);
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getSessionsByLabel(label) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readonly');
    const index = transaction.objectStore(SESSION_STORE).index('labels');
    const request = index.getAll(label);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getSessionsForToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return getSessionsByDateRange(start, end);
}

function normalizeSession(session) {
  return {
    type: session.type,
    timerMode: session.timerMode,
    startTime: session.startTime,
    endTime: session.endTime,
    durationMs: session.durationMs,
    completedNormally: session.completedNormally,
    labels: Array.isArray(session.labels) ? session.labels : [],
    choreDescription: session.choreDescription || null,
    choreColor: session.choreColor || null,
    calendarSynced: session.calendarSynced || false,
    calendarSyncStatus: session.calendarSyncStatus || 'pending',
    calendarEventId: session.calendarEventId || null,
  };
}

export {
  getSessionsByDateRange,
  getSessionsByLabel,
  getSessionsForToday,
  saveSession,
  updateSessionCalendarSync,
};
