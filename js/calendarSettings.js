const SETTINGS_KEY = 'productivity.calendarSettings';

const defaultSettings = {
  apiKey: '',
  calendarId: 'primary',
  clientId: '',
  enabled: false,
};

let handlers = {};
let settings = loadCalendarSettings();
let overlay = null;

function initCalendarSettings(nextHandlers = {}) {
  handlers = nextHandlers;
  buildDialog();
  document.getElementById('calendar-open').addEventListener('click', openCalendarSettings);
}

function getCalendarSettings() {
  return { ...settings };
}

function hasCalendarCredentials() {
  return Boolean(settings.enabled && settings.clientId && settings.apiKey && settings.calendarId);
}

function openCalendarSettings() {
  renderForm();
  overlay.hidden = false;
}

function closeCalendarSettings() {
  overlay.hidden = true;
}

function buildDialog() {
  overlay = document.createElement('section');
  overlay.className = 'stats-overlay';
  overlay.id = 'calendar-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="stats-panel">
      <button class="stats-close" id="calendar-close" type="button" aria-label="Close calendar settings">&times;</button>
      <h2 class="stats-title">Calendar Settings</h2>
      <form class="calendar-form" id="calendar-form">
        <label class="mode-switch" for="calendar-enabled">
          <input id="calendar-enabled" type="checkbox">
          <span class="switch-track" aria-hidden="true"></span>
          <span>Enable sync</span>
        </label>
        <label class="filter-group" for="calendar-client-id">
          OAuth Client ID
          <input id="calendar-client-id" type="text" autocomplete="off">
        </label>
        <label class="filter-group" for="calendar-api-key">
          API Key
          <input id="calendar-api-key" type="text" autocomplete="off">
        </label>
        <label class="filter-group" for="calendar-id">
          Calendar ID
          <input id="calendar-id" type="text" autocomplete="off">
        </label>
        <div class="backup-actions">
          <button class="backup-btn" id="calendar-setup" type="button">Setup Checklist</button>
          <button class="backup-btn" id="calendar-connect" type="button">Connect Google</button>
          <button class="backup-btn" id="calendar-disconnect" type="button">Disconnect</button>
        </div>
        <button class="backup-btn" type="submit">Save Settings</button>
        <p class="calendar-note" id="calendar-status"></p>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', closeFromBackdrop);
  overlay.querySelector('#calendar-close').addEventListener('click', closeCalendarSettings);
  overlay.querySelector('#calendar-setup').addEventListener('click', () => handlers.onSetup?.());
  overlay.querySelector('#calendar-connect').addEventListener('click', connectGoogle);
  overlay.querySelector('#calendar-disconnect').addEventListener('click', disconnectGoogle);
  overlay.querySelector('#calendar-form').addEventListener('submit', saveForm);
}

function renderForm() {
  overlay.querySelector('#calendar-enabled').checked = settings.enabled;
  overlay.querySelector('#calendar-client-id').value = settings.clientId;
  overlay.querySelector('#calendar-api-key').value = settings.apiKey;
  overlay.querySelector('#calendar-id').value = settings.calendarId;
  overlay.querySelector('#calendar-status').textContent = getStatusText();
}

function saveForm(event) {
  event.preventDefault();
  saveSettingsFromForm();
  renderForm();
}

async function connectGoogle() {
  saveSettingsFromForm();
  try {
    await handlers.onConnect?.();
    setCalendarStatus('Connected. Future sessions can be sent to Google Calendar.');
  } catch (error) {
    setCalendarStatus(error.message || 'Could not connect to Google Calendar.');
  }
}

async function disconnectGoogle() {
  try {
    await handlers.onDisconnect?.();
    setCalendarStatus('Disconnected from Google Calendar.');
  } catch (error) {
    setCalendarStatus(error.message || 'Could not disconnect.');
  }
}

function closeFromBackdrop(event) {
  if (event.target === overlay) closeCalendarSettings();
}

function getStatusText() {
  if (!settings.enabled) return 'Sync is disabled. Sessions still save locally.';
  if (!hasCalendarCredentials()) return 'Add credentials before real Google Calendar sync can run.';
  return 'Credentials saved. Google API auth is the next integration step.';
}

function loadCalendarSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettingsFromForm() {
  settings = {
    enabled: overlay.querySelector('#calendar-enabled').checked,
    clientId: overlay.querySelector('#calendar-client-id').value.trim(),
    apiKey: overlay.querySelector('#calendar-api-key').value.trim(),
    calendarId: overlay.querySelector('#calendar-id').value.trim() || 'primary',
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function setCalendarStatus(message) {
  overlay.querySelector('#calendar-status').textContent = message;
}

export { getCalendarSettings, hasCalendarCredentials, initCalendarSettings };
