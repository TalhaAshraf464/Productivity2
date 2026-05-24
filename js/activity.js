const activityElements = {
  choreColor: document.getElementById('chore-color'),
  choreDescription: document.getElementById('chore-description'),
  choreFields: document.getElementById('chore-fields'),
  choreToggle: document.getElementById('chore-toggle'),
  labelsSection: document.querySelector('.labels-section'),
};

let onChangeCallback = null;

function initActivity(callback) {
  onChangeCallback = callback;
  activityElements.choreToggle.addEventListener('change', renderActivity);
  renderActivity();
}

function isChoreMode() {
  return activityElements.choreToggle.checked;
}

function getChoreDetails() {
  return {
    choreColor: activityElements.choreColor.value,
    choreDescription: activityElements.choreDescription.value.trim(),
  };
}

function setActivityLocked(locked) {
  activityElements.choreToggle.disabled = locked;
  activityElements.choreDescription.disabled = locked;
  activityElements.choreColor.disabled = locked;
}

function renderActivity() {
  const choreMode = isChoreMode();
  activityElements.choreFields.hidden = !choreMode;
  activityElements.labelsSection.classList.toggle('is-disabled', choreMode);
  activityElements.labelsSection.setAttribute('aria-disabled', String(choreMode));
  if (onChangeCallback) onChangeCallback();
}

export { getChoreDetails, initActivity, isChoreMode, setActivityLocked };
