import { TIMER_MODES, customMinutes } from './timerState.js';

const elements = {
  body: document.body,
  dailyTotal: document.getElementById('daily-total'),
  durationInput: document.getElementById('duration-minutes'),
  durationLabel: document.querySelector('.duration-edit'),
  endSession: document.getElementById('end-session'),
  calendarOpen: document.getElementById('calendar-open'),
  historyOpen: document.getElementById('history-open'),
  labelsDropdown: document.getElementById('labels-dropdown'),
  labelsToggle: document.getElementById('labels-toggle'),
  mainTimer: document.getElementById('main-timer'),
  menuDetails: document.getElementById('topbar-menu'),
  menuPanel: document.getElementById('topbar-menu-panel'),
  menuToggle: document.getElementById('menu-toggle'),
  modeTabs: [...document.querySelectorAll('.mode-tab')],
  resetTimer: document.getElementById('reset-timer'),
  startPause: document.getElementById('start-pause'),
  statsClose: document.getElementById('stats-close'),
  statsOpen: document.getElementById('stats-open'),
  statsOverlay: document.getElementById('stats-overlay'),
};

let completedStudyTodayMs = 0;
let liveStudyEnabled = true;

function formatTimer(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(3, '0')}:${String(seconds).padStart(2, '0')}`;
}

function renderTimer({ activeMode, displayMs, elapsedMs, status }) {
  elements.mainTimer.textContent = formatTimer(displayMs);
  elements.dailyTotal.textContent = formatTimer(getLiveDailyMs(activeMode, elapsedMs, status));
  renderMode(activeMode);
  renderControls(status);
}

function renderMode(activeMode) {
  elements.body.dataset.mode = activeMode;
  elements.modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === activeMode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  const config = TIMER_MODES[activeMode];
  const isCountdown = config.clock === 'countdown';
  elements.durationLabel.hidden = !isCountdown;
  if (isCountdown) elements.durationInput.value = customMinutes[activeMode];
}

function renderControls(status) {
  elements.startPause.textContent =
    status === 'running' ? 'PAUSE' :
    status === 'paused' ? 'RESUME' : 'START';
  elements.endSession.hidden = status === 'idle';
}

function showStats() {
  elements.statsOverlay.hidden = false;
}

function hideStats() {
  elements.statsOverlay.hidden = true;
}

function toggleLabels() {
  const willOpen = elements.labelsDropdown.hidden;
  elements.labelsDropdown.hidden = !willOpen;
  elements.labelsToggle.setAttribute('aria-expanded', String(willOpen));
}

function closeMenu() {
  elements.menuDetails.open = false;
}

function addDailyStudyMs(durationMs) {
  completedStudyTodayMs += durationMs;
}

function setDailyStudyMs(durationMs) {
  completedStudyTodayMs = durationMs;
}

function setLiveStudyEnabled(enabled) {
  liveStudyEnabled = enabled;
}

function getLiveDailyMs(activeMode, elapsedMs, status) {
  if (!TIMER_MODES[activeMode].countsAsStudy) return completedStudyTodayMs;
  if (!liveStudyEnabled) return completedStudyTodayMs;
  if (status === 'idle') return completedStudyTodayMs;
  return completedStudyTodayMs + elapsedMs;
}

export {
  addDailyStudyMs,
  elements,
  formatTimer,
  hideStats,
  renderTimer,
  setDailyStudyMs,
  setLiveStudyEnabled,
  showStats,
  closeMenu,
  toggleLabels,
};
