const DISMISSED_KEY = 'productivity.setupDismissed';

let overlay = null;

function initSetupChecklist() {
  buildDialog();
  if (localStorage.getItem(DISMISSED_KEY) !== 'true') openSetupChecklist();
}

function openSetupChecklist() {
  renderChecklist();
  overlay.hidden = false;
}

function closeSetupChecklist() {
  overlay.hidden = true;
}

function buildDialog() {
  overlay = document.createElement('section');
  overlay.className = 'stats-overlay';
  overlay.id = 'setup-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="stats-panel">
      <button class="stats-close" id="setup-close" type="button" aria-label="Close setup checklist">&times;</button>
      <h2 class="stats-title">Setup Checklist</h2>
      <div class="setup-list" id="setup-list"></div>
      <div class="backup-actions setup-actions">
        <button class="backup-btn" id="setup-dismiss" type="button">Do Not Show Again</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#setup-close').addEventListener('click', closeSetupChecklist);
  overlay.querySelector('#setup-dismiss').addEventListener('click', dismissChecklist);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeSetupChecklist();
  });
}

function renderChecklist() {
  const list = overlay.querySelector('#setup-list');
  list.replaceChildren();
  getChecklistItems().forEach((item) => list.appendChild(createChecklistItem(item)));
}

function createChecklistItem(item) {
  const row = document.createElement('article');
  row.className = 'setup-item';

  const title = document.createElement('div');
  title.className = 'history-title';
  title.textContent = item.title;

  const detail = document.createElement('div');
  detail.className = 'history-meta';
  detail.textContent = item.detail;

  row.append(title, detail);
  return row;
}

function getChecklistItems() {
  return [
    {
      title: 'Export a backup before deploying',
      detail: 'Open History and use Export JSON so your local IndexedDB sessions are portable.',
    },
    {
      title: 'Use this exact origin in Google Cloud',
      detail: `Authorized JavaScript origin: ${location.origin}`,
    },
    {
      title: 'For GitHub Pages, add the deployed origin too',
      detail: 'Use the scheme and host only, for example https://username.github.io.',
    },
    {
      title: 'Keep OAuth app in Testing while developing',
      detail: 'Add your own Google account as a test user before trying Calendar sync.',
    },
    {
      title: 'Connect Google after saving settings',
      detail: 'The app saves sessions locally first; Calendar sync only runs after Connect Google succeeds.',
    },
  ];
}

function dismissChecklist() {
  localStorage.setItem(DISMISSED_KEY, 'true');
  closeSetupChecklist();
}

export { initSetupChecklist, openSetupChecklist };
