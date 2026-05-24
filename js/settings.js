const TIMER_SETTINGS_KEY = 'productivity.timerMinutes';

function loadTimerMinutes(defaults) {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(TIMER_SETTINGS_KEY)) };
  } catch {
    return { ...defaults };
  }
}

function saveTimerMinute(mode, minutes) {
  const current = loadTimerMinutes({});
  current[mode] = minutes;
  localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(current));
}

export { loadTimerMinutes, saveTimerMinute };
