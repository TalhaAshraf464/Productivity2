import { removeLabelFromSessions } from './storage.js';

const LABELS_KEY = 'productivity.labels';
const SELECTED_LABELS_KEY = 'productivity.selectedLabels';
const DEFAULT_LABELS = ['Physics', 'Math', 'ML', 'Coding', 'Research', 'Writing'];

const labelElements = {
  addForm: document.getElementById('add-label-form'),
  input: document.getElementById('new-label'),
  list: document.getElementById('labels-list'),
  selected: document.getElementById('selected-labels'),
  statsSelect: document.getElementById('stats-label'),
};

let availableLabels = loadLabels();
let selectedLabels = loadSelectedLabels();

function initLabels() {
  labelElements.addForm.addEventListener('submit', addLabel);
  renderLabels();
  renderStatsOptions();
}

function getSelectedLabels() {
  return [...selectedLabels];
}

function getAvailableLabels() {
  return [...availableLabels];
}

function addLabel(event) {
  event.preventDefault();
  const label = normalizeLabel(labelElements.input.value);
  if (!label) return;

  if (!availableLabels.includes(label)) {
    availableLabels.push(label);
    saveLabels();
  }

  if (!selectedLabels.includes(label)) selectedLabels.push(label);
  saveSelectedLabels();
  labelElements.input.value = '';
  renderLabels();
  renderStatsOptions();
}

function toggleLabel(label) {
  selectedLabels = selectedLabels.includes(label)
    ? selectedLabels.filter((item) => item !== label)
    : [...selectedLabels, label];
  saveSelectedLabels();
  renderLabels();
}

function renderLabels() {
  renderSelectedLabels();
  renderLabelOptions();
}

function renderSelectedLabels() {
  labelElements.selected.replaceChildren();

  if (selectedLabels.length === 0) {
    const placeholder = document.createElement('span');
    placeholder.className = 'none-placeholder';
    placeholder.textContent = 'No labels selected';
    labelElements.selected.appendChild(placeholder);
    return;
  }

  selectedLabels.forEach((label) => {
    const chip = document.createElement('span');
    chip.className = 'label-chip';
    chip.textContent = label;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${label}`);
    remove.addEventListener('click', () => toggleLabel(label));

    chip.appendChild(remove);
    labelElements.selected.appendChild(chip);
  });
}

function renderLabelOptions() {
  labelElements.list.replaceChildren();

  availableLabels.forEach((label) => {
    const row = document.createElement('div');
    row.className = 'label-option-row';

    const button = document.createElement('button');
    const isSelected = selectedLabels.includes(label);
    button.type = 'button';
    button.className = `label-option${isSelected ? ' selected' : ''}`;
    button.dataset.label = label;
    button.textContent = label;
    button.setAttribute('aria-pressed', String(isSelected));
    button.addEventListener('click', () => toggleLabel(label));

    const remove = document.createElement('button');
    remove.className = 'label-delete-btn';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${label}`);
    remove.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteLabel(label);
    });

    row.append(button, remove);
    labelElements.list.appendChild(row);
  });
}

async function deleteLabel(labelToDelete) {
  const ok = window.confirm(`Are you sure you want to delete "${labelToDelete}"?\n\nThis removes it from the label list and past saved sessions.`);
  if (!ok) return;

  availableLabels = availableLabels.filter((label) => label !== labelToDelete);
  selectedLabels = selectedLabels.filter((label) => label !== labelToDelete);
  saveLabels();
  saveSelectedLabels();
  await removeLabelFromSessions(labelToDelete);
  renderLabels();
  renderStatsOptions();
}

function renderStatsOptions() {
  if (!labelElements.statsSelect) return;

  const current = labelElements.statsSelect.value || 'total';
  labelElements.statsSelect.replaceChildren(new Option('Total Study Time', 'total'));

  availableLabels.forEach((label) => {
    labelElements.statsSelect.appendChild(new Option(label, label));
  });

  const values = [...labelElements.statsSelect.options].map((option) => option.value);
  labelElements.statsSelect.value = values.includes(current) ? current : 'total';
}

function loadLabels() {
  try {
    const saved = JSON.parse(localStorage.getItem(LABELS_KEY));
    if (Array.isArray(saved) && saved.length > 0) return saved.map(normalizeLabel).filter(Boolean);
  } catch {
    return DEFAULT_LABELS;
  }
  return DEFAULT_LABELS;
}

function loadSelectedLabels() {
  try {
    const saved = JSON.parse(localStorage.getItem(SELECTED_LABELS_KEY));
    if (Array.isArray(saved)) return saved.map(normalizeLabel).filter(Boolean);
  } catch {
    return [];
  }
  return [];
}

function saveLabels() {
  localStorage.setItem(LABELS_KEY, JSON.stringify(availableLabels));
}

function saveSelectedLabels() {
  localStorage.setItem(SELECTED_LABELS_KEY, JSON.stringify(selectedLabels));
}

function normalizeLabel(label) {
  return label.trim().replace(/\s+/g, ' ');
}

export { getAvailableLabels, getSelectedLabels, initLabels };
