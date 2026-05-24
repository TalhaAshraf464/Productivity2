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

      const store = db.createObjectStore(SESSION_STORE, { keyPath: 'id', autoIncrement: true });
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
    const request = index.getAll(IDBKeyRange.bound(start, end));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllSessions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readonly');
    const request = transaction.objectStore(SESSION_STORE).getAll();

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
      if (!session) return resolve(null);
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

async function deleteSession(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readwrite');
    const request = transaction.objectStore(SESSION_STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearSessions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readwrite');
    const request = transaction.objectStore(SESSION_STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function importSessions(sessions) {
  const db = await openDb();
  const existingIds = new Set((await getAllSessions()).map((session) => session.id));
  const newSessions = sessions.filter((session) => !existingIds.has(session.id));

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);

    newSessions.forEach((session) => store.put(normalizeSession(session)));
    transaction.oncomplete = () => resolve({ imported: newSessions.length, skipped: sessions.length - newSessions.length });
    transaction.onerror = () => reject(transaction.error);
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

async function replaceLabelInSessions(oldLabel, newLabel) {
  const sessions = await getSessionsByLabel(oldLabel);
  return updateSessions(sessions.map((session) => ({
    ...session,
    labels: session.labels.map((label) => label === oldLabel ? newLabel : label),
  })));
}

async function removeLabelFromSessions(labelToRemove) {
  const sessions = await getSessionsByLabel(labelToRemove);
  return updateSessions(sessions.map((session) => ({
    ...session,
    labels: session.labels.filter((label) => label !== labelToRemove),
  })));
}

async function updateSessions(sessions) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSION_STORE, 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);
    sessions.forEach((session) => store.put(normalizeSession(session)));
    transaction.oncomplete = () => resolve(sessions.length);
    transaction.onerror = () => reject(transaction.error);
  });
}

function getSessionsForToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return getSessionsByDateRange(start, end);
}

function normalizeSession(session) {
  const normalized = {
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
  if (session.id !== undefined) normalized.id = session.id;
  return normalized;
}

export {
  clearSessions,
  deleteSession,
  getAllSessions,
  getSessionsByDateRange,
  getSessionsByLabel,
  getSessionsForToday,
  importSessions,
  removeLabelFromSessions,
  replaceLabelInSessions,
  saveSession,
  updateSessionCalendarSync,
};
