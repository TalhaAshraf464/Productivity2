import { getAvailableLabels } from './labels.js';
import { getSessionsByDateRange } from './storage.js';
import { renderChart } from './chart.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const NINETY_MIN_MS = 90 * 60 * 1000;
const PERIODS = {
  week: { days: 7, chart: 'bar' },
  month: { days: 30, chart: 'bar' },
  year: { days: 365, chart: 'line' },
  all: { days: null, chart: 'line' },
};

const statsElements = {
  activeDays: document.getElementById('stats-active-days'),
  chart: document.getElementById('stats-chart'),
  close: document.getElementById('stats-close'),
  hours: document.getElementById('stats-hours'),
  label: document.getElementById('stats-label'),
  overlay: document.getElementById('stats-overlay'),
  period: document.getElementById('stats-period'),
  streak: document.getElementById('stats-streak'),
};

function initStats() {
  statsElements.close.addEventListener('click', closeStats);
  statsElements.label.addEventListener('change', refreshStats);
  statsElements.period.addEventListener('change', refreshStats);
  statsElements.overlay.addEventListener('click', (event) => {
    if (event.target === statsElements.overlay) closeStats();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !statsElements.overlay.hidden) closeStats();
  });
}

async function openStats() {
  populateLabelFilter();
  statsElements.overlay.hidden = false;
  await refreshStats();
}

function closeStats() {
  statsElements.overlay.hidden = true;
}

function populateLabelFilter() {
  const current = statsElements.label.value || 'total';
  statsElements.label.replaceChildren(new Option('Total Study Time', 'total'));

  getAvailableLabels().forEach((label) => {
    statsElements.label.appendChild(new Option(label, label));
  });

  const values = [...statsElements.label.options].map((option) => option.value);
  statsElements.label.value = values.includes(current) ? current : 'total';
}

async function refreshStats() {
  const period = PERIODS[statsElements.period.value];
  const range = getRange(period);
  const sessions = await getSessionsByDateRange(range.start, range.end);
  const studySessions = filterStudySessions(sessions, statsElements.label.value);
  const totalsByDay = groupByDay(studySessions);
  const buckets = buildBuckets(totalsByDay, range.start, range.end);

  renderSummary(totalsByDay);
  renderChart(statsElements.chart, buckets, period.chart);
}

function filterStudySessions(sessions, selectedLabel) {
  return sessions.filter((session) => {
    if (session.type !== 'study') return false;
    if (selectedLabel === 'total') return true;
    return session.labels.includes(selectedLabel);
  });
}

function groupByDay(sessions) {
  const totals = new Map();
  sessions.forEach((session) => {
    const key = dayStart(session.startTime);
    totals.set(key, (totals.get(key) || 0) + session.durationMs);
  });
  return totals;
}

function renderSummary(totalsByDay) {
  const dailyTotals = [...totalsByDay.values()];
  const totalMs = dailyTotals.reduce((sum, value) => sum + value, 0);
  const activeDays = dailyTotals.filter((value) => value >= NINETY_MIN_MS).length;

  statsElements.hours.textContent = (totalMs / 3600000).toFixed(1);
  statsElements.activeDays.textContent = String(activeDays);
  statsElements.streak.textContent = String(getStreak(totalsByDay));
}

function getRange(period) {
  const end = Date.now();
  if (period.days === null) return { start: 0, end };
  return {
    start: dayStart(end - (period.days - 1) * DAY_MS),
    end,
  };
}

function buildBuckets(totalsByDay, start, end) {
  const firstDay = start === 0 ? getFirstDataDay(totalsByDay, end) : dayStart(start);
  const buckets = [];
  let cursor = firstDay;
  const lastDay = dayStart(end);

  while (cursor <= lastDay) {
    buckets.push({
      label: formatBucketLabel(cursor),
      value: (totalsByDay.get(cursor) || 0) / 3600000,
    });
    cursor = nextDay(cursor);
  }
  return buckets;
}

function getStreak(totalsByDay) {
  let cursor = dayStart(Date.now());
  if ((totalsByDay.get(cursor) || 0) < NINETY_MIN_MS) cursor = previousDay(cursor);

  let streak = 0;
  while ((totalsByDay.get(cursor) || 0) >= NINETY_MIN_MS) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}

function getFirstDataDay(totalsByDay, fallback) {
  if (totalsByDay.size === 0) return dayStart(fallback);
  return Math.min(...totalsByDay.keys());
}

function dayStart(timestamp) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function nextDay(timestamp) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + 1);
  return date.getTime();
}

function previousDay(timestamp) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() - 1);
  return date.getTime();
}

function formatBucketLabel(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export { initStats, openStats };
