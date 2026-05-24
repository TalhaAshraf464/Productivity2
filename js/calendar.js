import { getCalendarColorId } from './calendarColors.js';
import { getCalendarSettings, hasCalendarCredentials } from './calendarSettings.js';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const GOOGLE_API_SCRIPT = 'https://apis.google.com/js/api.js';
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let gapiReady = false;
let gisReady = false;
let tokenClient = null;

async function syncSessionToCalendar(session) {
  const event = buildCalendarEvent(session);
  const settings = getCalendarSettings();

  if (!settings.enabled) {
    return {
      calendarEventId: null,
      calendarEvent: event,
      calendarSynced: false,
      calendarSyncStatus: 'disabled',
    };
  }

  if (!hasCalendarCredentials()) {
    return {
      calendarEventId: null,
      calendarEvent: event,
      calendarSynced: false,
      calendarSyncStatus: 'not_configured',
    };
  }

  if (!window.gapi?.client?.getToken?.()) {
    return makeSyncResult(event, 'auth_required');
  }

  try {
    const response = await window.gapi.client.calendar.events.insert({
      calendarId: settings.calendarId,
      resource: event,
    });
    return {
      calendarEventId: response.result.id,
      calendarEvent: event,
      calendarSynced: true,
      calendarSyncStatus: 'synced',
    };
  } catch (error) {
    console.error('Google Calendar insert failed', error);
    return makeSyncResult(event, 'failed');
  }
}

async function authorizeCalendar() {
  const settings = getCalendarSettings();
  if (!hasCalendarCredentials()) {
    throw new Error('Save your Client ID, API key, and Calendar ID first.');
  }

  await ensureGoogleClients(settings);

  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      window.gapi.client.setToken(response);
      resolve(response);
    };

    const prompt = window.gapi.client.getToken() ? '' : 'consent';
    tokenClient.requestAccessToken({ prompt });
  });
}

function signOutCalendar() {
  const token = window.gapi?.client?.getToken?.();
  if (!token) return;
  window.google.accounts.oauth2.revoke(token.access_token);
  window.gapi.client.setToken('');
}

function buildCalendarEvent(session) {
  return {
    summary: getEventTitle(session),
    description: getEventDescription(session),
    colorId: getCalendarColorId(session),
    start: { dateTime: new Date(session.startTime).toISOString() },
    end: { dateTime: new Date(session.endTime).toISOString() },
  };
}

async function ensureGoogleClients(settings) {
  await Promise.all([loadScript(GOOGLE_API_SCRIPT), loadScript(GOOGLE_IDENTITY_SCRIPT)]);
  await initGapi(settings.apiKey);
  initGis(settings.clientId);
}

function initGapi(apiKey) {
  if (gapiReady) return Promise.resolve();
  return new Promise((resolve, reject) => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiReady = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

function initGis(clientId) {
  if (gisReady) return;
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {},
  });
  gisReady = true;
}

function loadScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

function makeSyncResult(event, calendarSyncStatus) {
  return {
    calendarEventId: null,
    calendarEvent: event,
    calendarSynced: false,
    calendarSyncStatus,
  };
}

function getEventTitle(session) {
  if (session.type === 'study') {
    const label = session.labels[0] || 'Unlabeled';
    return `Study - ${label}`;
  }

  if (session.type === 'break') {
    return session.timerMode === 'long-break' ? 'Long Break' : 'Short Break';
  }

  return `Chore - ${session.choreDescription || 'Untitled chore'}`;
}

function getEventDescription(session) {
  const lines = [
    `Mode: ${formatMode(session.timerMode)}`,
    `Duration: ${formatDuration(session.durationMs)}`,
    'Logged by Productivity Timer App',
  ];

  if (session.type === 'study') lines.splice(1, 0, `Labels: ${session.labels.join(', ') || 'None'}`);
  if (session.type === 'chore') lines.splice(1, 0, `Chore color: ${session.choreColor || 'gray'}`);

  return lines.join('\n');
}

function formatMode(mode) {
  return mode
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDuration(durationMs) {
  const minutes = Math.round(durationMs / 60000);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export { authorizeCalendar, buildCalendarEvent, signOutCalendar, syncSessionToCalendar };
