import { clearSessions, deleteSession, getAllSessions, importSessions } from './storage.js';

const historyElements = {
  open: document.getElementById('history-open'),
};

let overlay = null;
let list = null;
let status = null;
let onDataChanged = null;

function initHistory(callback = null) {
  onDataChanged = callback;
  buildHistoryDialog();
  historyElements.open.addEventListener('click', openHistory);
}

async function openHistory() {
  overlay.hidden = false;
  list.textContent = 'Loading...';

  try {
    const sessions = await getAllSessions();
    renderSessions(sessions);
  } catch (error) {
    list.textContent = 'Could not load session history.';
    console.error('Could not load history', error);
  }
}

function closeHistory() {
  overlay.hidden = true;
}

function buildHistoryDialog() {
  overlay = document.createElement('section');
  overlay.className = 'stats-overlay';
  overlay.id = 'history-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="stats-panel">
      <button class="stats-close" id="history-close" type="button" aria-label="Close session history">&times;</button>
      <h2 class="stats-title">Session History</h2>
      <div class="backup-actions history-actions">
        <button class="backup-btn" id="history-export" type="button">Export JSON</button>
        <button class="backup-btn" id="history-import" type="button">Import JSON</button>
        <button class="backup-btn danger-btn" id="history-clear" type="button">Clear All</button>
        <input id="history-import-file" type="file" accept="application/json,.json" hidden>
      </div>
      <p class="backup-note" id="history-status"></p>
      <div class="history-list" id="history-list"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  list = overlay.querySelector('#history-list');
  status = overlay.querySelector('#history-status');
  overlay.querySelector('#history-close').addEventListener('click', closeHistory);
  overlay.querySelector('#history-export').addEventListener('click', exportHistory);
  overlay.querySelector('#history-clear').addEventListener('click', clearHistory);
  overlay.querySelector('#history-import').addEventListener('click', () => {
    overlay.querySelector('#history-import-file').click();
  });
  overlay.querySelector('#history-import-file').addEventListener('change', importHistory);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeHistory();
  });
}

async function clearHistory() {
  const ok = window.confirm('Are you sure you want to delete all saved sessions? This cannot be undone.');
  if (!ok) return;
  await clearSessions();
  status.textContent = 'Deleted all saved sessions.';
  renderSessions([]);
  if (onDataChanged) onDataChanged();
}

async function exportHistory() {
  const sessions = await getAllSessions();
  const payload = {
    exportedAt: new Date().toISOString(),
    sessions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `productivity-sessions-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  status.textContent = `Exported ${sessions.length} sessions.`;
}

async function importHistory(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const sessions = Array.isArray(payload) ? payload : payload.sessions;
    if (!Array.isArray(sessions)) throw new Error('Backup file does not contain sessions.');

    const result = await importSessions(sessions);
    status.textContent = `Imported ${result.imported} sessions. Skipped ${result.skipped} duplicates.`;
    renderSessions(await getAllSessions());
    if (onDataChanged) onDataChanged();
  } catch (error) {
    status.textContent = error.message || 'Could not import backup.';
  } finally {
    event.target.value = '';
  }
}

function renderSessions(sessions) {
  list.replaceChildren();
  const recentSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

  if (recentSessions.length === 0) {
    list.textContent = 'No sessions saved yet.';
    return;
  }

  recentSessions.forEach((session) => {
    list.appendChild(createSessionRow(session));
  });
}

function createSessionRow(session) {
  const row = document.createElement('article');
  row.className = 'history-row';

  const title = document.createElement('div');
  title.className = 'history-title';
  title.textContent = getSessionTitle(session);

  const meta = document.createElement('div');
  meta.className = 'history-meta';
  meta.textContent = [
    formatDate(session.startTime),
    formatDuration(session.durationMs),
    formatMode(session.timerMode),
    `Calendar: ${session.calendarSyncStatus || 'pending'}`,
  ].join(' | ');

  const actions = document.createElement('div');
  actions.className = 'history-row-actions';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'history-delete-btn';
  deleteButton.type = 'button';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => deleteHistorySession(session));

  actions.appendChild(deleteButton);
  row.append(title, meta, actions);
  return row;
}

async function deleteHistorySession(session) {
  const ok = window.confirm(`Are you sure you want to delete this session?\n\n${getSessionTitle(session)}`);
  if (!ok) return;
  await deleteSession(session.id);
  status.textContent = 'Deleted session.';
  renderSessions(await getAllSessions());
  if (onDataChanged) onDataChanged();
}

function getSessionTitle(session) {
  if (session.type === 'study') return `Study - ${session.labels.join(', ') || 'Unlabeled'}`;
  if (session.type === 'break') return session.timerMode === 'long-break' ? 'Long Break' : 'Short Break';
  return `Chore - ${session.choreDescription || 'Untitled chore'}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(durationMs) {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function formatMode(mode) {
  return mode
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export { initHistory };
