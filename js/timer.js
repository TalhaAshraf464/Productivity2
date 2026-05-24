import { TIMER_MODES, timerState } from './timerState.js';

let onTickCallback = null;
let onFinishCallback = null;
let onSessionEndCallback = null;

function getModeConfig() {
  return TIMER_MODES[timerState.activeMode];
}

function getElapsedMs() {
  if (timerState.segmentStart === null) return timerState.accumulatedMs;
  return timerState.accumulatedMs + Date.now() - timerState.segmentStart;
}

function getDisplayMs() {
  const elapsedMs = getElapsedMs();
  if (getModeConfig().clock === 'countdown') {
    return Math.max(0, timerState.durationMs - elapsedMs);
  }
  return elapsedMs;
}

function getStatus() {
  return timerState.status;
}

function getActiveMode() {
  return timerState.activeMode;
}

function getDurationMinutes() {
  return Math.round(timerState.durationMs / 60000);
}

function startTimer() {
  if (timerState.status === 'running') return;

  if (timerState.status === 'idle') {
    timerState.sessionStart = Date.now();
    timerState.accumulatedMs = 0;
  }

  timerState.segmentStart = Date.now();
  timerState.status = 'running';
  timerState.intervalId = window.setInterval(tick, 250);
  tick();
}

function pauseTimer() {
  if (timerState.status !== 'running') return;
  timerState.accumulatedMs = getElapsedMs();
  timerState.segmentStart = null;
  clearTimerInterval();
  timerState.status = 'paused';
  emitTick();
}

function resetTimer() {
  clearTimerInterval();
  timerState.status = 'idle';
  timerState.sessionStart = null;
  timerState.segmentStart = null;
  timerState.accumulatedMs = 0;
  emitTick();
}

function endSession() {
  if (timerState.status === 'idle') return null;
  timerState.accumulatedMs = getElapsedMs();
  timerState.segmentStart = null;
  clearTimerInterval();

  const session = buildSession(false);
  resetTimer();
  if (session && onSessionEndCallback) onSessionEndCallback(session);
  return session;
}

function setActiveMode(mode) {
  if (!TIMER_MODES[mode] || timerState.status !== 'idle') return false;
  timerState.activeMode = mode;
  emitTick();
  return true;
}

function setDurationMinutes(minutes) {
  if (timerState.status !== 'idle') return false;
  const safeMinutes = Math.max(1, Math.min(500, minutes));
  timerState.durationMs = safeMinutes * 60 * 1000;
  emitTick();
  return true;
}

function onTick(callback) {
  onTickCallback = callback;
}

function onFinish(callback) {
  onFinishCallback = callback;
}

function onSessionEnd(callback) {
  onSessionEndCallback = callback;
}

function tick() {
  if (getModeConfig().clock === 'countdown' && getElapsedMs() >= timerState.durationMs) {
    timerState.accumulatedMs = timerState.durationMs;
    timerState.segmentStart = null;
    clearTimerInterval();
    timerState.status = 'idle';

    const session = buildSession(true);
    timerState.sessionStart = null;
    timerState.accumulatedMs = 0;
    emitTick();
    if (session && onSessionEndCallback) onSessionEndCallback(session);
    if (onFinishCallback) onFinishCallback(session);
    return;
  }

  emitTick();
}

function emitTick() {
  if (!onTickCallback) return;
  onTickCallback({
    activeMode: timerState.activeMode,
    displayMs: getDisplayMs(),
    elapsedMs: getElapsedMs(),
    status: timerState.status,
  });
}

function buildSession(completedNormally) {
  if (!timerState.sessionStart || timerState.accumulatedMs < 1000) return null;
  return {
    startTime: timerState.sessionStart,
    endTime: Date.now(),
    durationMs: Math.round(timerState.accumulatedMs),
    completedNormally,
    timerMode: timerState.activeMode,
    countsAsStudy: getModeConfig().countsAsStudy,
  };
}

function clearTimerInterval() {
  window.clearInterval(timerState.intervalId);
  timerState.intervalId = null;
}

export {
  endSession,
  getActiveMode,
  getDisplayMs,
  getDurationMinutes,
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
};
