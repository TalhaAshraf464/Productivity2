import {
  endSession,
  getActiveMode,
  getDisplayMs,
  getElapsedMs,
  getStatus,
  onFinish,
  onSessionEnd,
  onTick,
  pauseTimer,
  resetTimer,
  setActiveMode,
  setDurationMinutes,
  startTimer,
} from './timer.js';
import { getChoreDetails, initActivity, isChoreMode, setActivityLocked } from './activity.js';
import { authorizeCalendar, signOutCalendar, syncSessionToCalendar } from './calendar.js';
import { initCalendarSettings } from './calendarSettings.js';
import { TIMER_MODES, customMinutes } from './timerState.js';
import { getSelectedLabels, initLabels } from './labels.js';
import { getSessionsForToday, saveSession, updateSessionCalendarSync } from './storage.js';
import { initStats, openStats } from './stats.js';
import {
  addDailyStudyMs,
  elements,
  renderTimer,
  setDailyStudyMs,
  setLiveStudyEnabled,
  toggleLabels,
} from './ui.js';

function init() {
  attachEvents();
  initLabels();
  initActivity(renderCurrentState);
  initCalendarSettings({
    onConnect: authorizeCalendar,
    onDisconnect: signOutCalendar,
  });
  initStats();
  onTick(() => renderCurrentState());
  onFinish(() => renderCurrentState());
  onSessionEnd((session) => {
    decorateSession(session);
    saveSession(session)
      .then((sessionId) => syncSessionToCalendar(session)
        .then((result) => updateSessionCalendarSync(sessionId, result).then(() => result)))
      .then((result) => {
        if (result.calendarSyncStatus !== 'disabled') console.log('Calendar sync result', result);
      })
      .catch((error) => console.error('Could not save or sync session', error));
    if (session.type === 'study') addDailyStudyMs(session.durationMs);
    renderCurrentState();
    console.log('Session ended', session);
  });
  applyMode('pomodoro');
  loadSavedDailyTotal();
}

function attachEvents() {
  elements.modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => applyMode(tab.dataset.mode));
  });
  elements.startPause.addEventListener('click', toggleTimer);
  elements.resetTimer.addEventListener('click', resetTimer);
  elements.endSession.addEventListener('click', endSession);
  elements.durationInput.addEventListener('change', updateDuration);
  elements.labelsToggle.addEventListener('click', toggleLabels);
  elements.statsOpen.addEventListener('click', openStats);
}

function toggleTimer() {
  if (getStatus() === 'running') {
    pauseTimer();
    return;
  }
  startTimer();
}

function applyMode(mode) {
  if (getStatus() !== 'idle') endSession();
  if (!setActiveMode(mode)) return;

  const config = TIMER_MODES[mode];
  if (config.clock === 'countdown') {
    setDurationMinutes(customMinutes[mode]);
  }
  renderCurrentState();
}

function updateDuration(event) {
  const minutes = Math.max(1, Math.min(500, Number.parseInt(event.target.value, 10) || 1));
  event.target.value = minutes;
  customMinutes[getActiveMode()] = minutes;
  setDurationMinutes(minutes);
}

function renderCurrentState() {
  setLiveStudyEnabled(shouldCountAsStudy());
  setActivityLocked(getStatus() !== 'idle');
  renderTimer({
    activeMode: getActiveMode(),
    displayMs: getDisplayMs(),
    elapsedMs: getElapsedMs(),
    status: getStatus(),
  });
}

function decorateSession(session) {
  if (!TIMER_MODES[session.timerMode].countsAsStudy) {
    session.type = 'break';
    session.labels = [];
    return;
  }

  if (isChoreMode()) {
    session.type = 'chore';
    session.labels = [];
    Object.assign(session, getChoreDetails());
    return;
  }

  session.type = 'study';
  session.labels = getSelectedLabels();
}

function shouldCountAsStudy() {
  return TIMER_MODES[getActiveMode()].countsAsStudy && !isChoreMode();
}

async function loadSavedDailyTotal() {
  try {
    const sessions = await getSessionsForToday();
    const totalMs = sessions
      .filter((session) => session.type === 'study')
      .reduce((sum, session) => sum + session.durationMs, 0);
    setDailyStudyMs(totalMs);
    renderCurrentState();
  } catch (error) {
    console.error('Could not load today total', error);
  }
}

init();
