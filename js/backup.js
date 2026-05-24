const LAST_AUTO_BACKUP_KEY = 'productivity.lastAutoBackupAt';
const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

function createBackupPayload(sessions) {
  return {
    exportedAt: new Date().toISOString(),
    sessions,
  };
}

function downloadBackup(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getBackupFileName();
  link.click();
  URL.revokeObjectURL(url);
}

function getBackupFileName() {
  const timestamp = new Date().toISOString()
    .replace('T', '-')
    .replace('Z', '')
    .replaceAll(':', '-')
    .replace('.', '-');
  return `productivity-sessions-${timestamp}.json`;
}

async function saveJsonBackup(getSessions) {
  const sessions = await getSessions();
  downloadBackup(createBackupPayload(sessions));
  localStorage.setItem(LAST_AUTO_BACKUP_KEY, String(Date.now()));
  return sessions.length;
}

async function runWeeklyAutoBackup(getSessions) {
  const lastBackupAt = Number(localStorage.getItem(LAST_AUTO_BACKUP_KEY) || 0);
  if (Date.now() - lastBackupAt < BACKUP_INTERVAL_MS) return false;

  const sessions = await getSessions();
  if (sessions.length === 0) return false;

  downloadBackup(createBackupPayload(sessions));
  localStorage.setItem(LAST_AUTO_BACKUP_KEY, String(Date.now()));
  return true;
}

function getLastBackupLabel() {
  const lastBackupAt = Number(localStorage.getItem(LAST_AUTO_BACKUP_KEY) || 0);
  if (!lastBackupAt) return 'No backup saved from this browser yet.';
  return `Last JSON backup: ${new Date(lastBackupAt).toLocaleString()}.`;
}

export { getLastBackupLabel, runWeeklyAutoBackup, saveJsonBackup };
