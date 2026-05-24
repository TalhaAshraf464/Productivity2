import { loadTimerMinutes } from './settings.js';

const TIMER_MODES = {
  pomodoro: {
    clock: 'countdown',
    defaultMinutes: 25,
    countsAsStudy: true,
  },
  'short-break': {
    clock: 'countdown',
    defaultMinutes: 5,
    countsAsStudy: false,
  },
  'long-break': {
    clock: 'countdown',
    defaultMinutes: 15,
    countsAsStudy: false,
  },
  stopwatch: {
    clock: 'countup',
    defaultMinutes: null,
    countsAsStudy: true,
  },
};

const defaultMinutes = Object.fromEntries(
  Object.entries(TIMER_MODES).map(([mode, config]) => [mode, config.defaultMinutes])
);

const customMinutes = loadTimerMinutes(defaultMinutes);

const timerState = {
  activeMode: 'pomodoro',
  status: 'idle',
  durationMs: customMinutes.pomodoro * 60 * 1000,
  sessionStart: null,
  segmentStart: null,
  accumulatedMs: 0,
  intervalId: null,
};

export { TIMER_MODES, customMinutes, timerState };
