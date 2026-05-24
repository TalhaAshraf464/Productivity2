# GPT.md — Productivity Timer Web App Specification

## Project Goal

Build a modular productivity web app using plain **HTML, CSS, and JavaScript**. The app should work as a Pomfocus-style timer with extra study/chore tracking, detailed internal statistics, and Google Calendar logging.

The app should be developed incrementally, with clean separation between timer logic, storage, stats, UI rendering, and Google Calendar integration.

The long-term goal is a web app that lets the user track exactly how time was spent throughout the day, internally through stats and externally through Google Calendar events.

---

## Core App Concept

The app has three main areas:

1. **Timer Page**
   - Main timer with multiple timing modes.
   - Study/chore toggle.
   - Study labels.
   - Chore description and color choice.
   - Small total-study-time-today timer in the top-right corner.

2. **Stats Page**
   - User selects a label and a time period.
   - App instantly graphs study time for that label over the chosen period.
   - Includes a "Total Study Time" option in addition to individual labels.

3. **Calendar Sync**
   - When a timer session ends, the app logs that session to Google Calendar.
   - Study sessions, breaks, and chores are logged differently.

---

## Recommended Development Order

Build the app in the following order.

### Phase 1 — Basic Timer

Implement:

- Pomodoro timer
- Short break timer
- Long break timer
- Stopwatch
- Start / pause / resume / reset / end session buttons
- Basic UI
- State management for running timer

Do not implement stats or Google Calendar yet.

### Phase 2 — Local Storage and Session Logging

Implement IndexedDB storage.

Every completed session should be saved locally as a session record.

Use `localStorage` only for small preferences, such as:

- default Pomodoro length
- default short break length
- default long break length
- selected theme
- last selected study label
- Google Calendar settings if needed

Use IndexedDB for all real data:

- study sessions
- break sessions
- chore sessions
- labels
- calendar sync status

### Phase 3 — Study vs Chore Mode

Add:

- Study/chore toggle checkbox
- Study label selector
- Add-new-label option
- Chore textbox
- Chore color picker or color dropdown

### Phase 4 — Daily Total Study Timer

Add the small timer in the top-right corner.

It should show total study time completed today.

It should also tick live during active study sessions.

It should **not** tick during:

- short breaks
- long breaks
- chore mode
- paused timers

### Phase 5 — Stats Page

Add:

- label selector
- time period selector
- graph rendering
- aggregation by day
- bar/line graphs depending on selected time period

### Phase 6 — Calendar Export / Google Calendar Integration

Start with internal session logging first. Then add Google Calendar.

The app should create a Google Calendar event only when a session ends.

For stopwatch mode, logging happens when the user manually presses **End Session**.

---

## Timer Modes

The main timer has four modes:

1. **Pomodoro**
2. **Short Break**
3. **Long Break**
4. **Stopwatch**

### Pomodoro Mode

Pomodoro mode counts down from a user-selected duration.

Example:

```text
25:00 -> 00:00
```

When the timer reaches zero:

- The session ends automatically.
- A session record is saved.
- If in study mode, the time counts toward study stats.
- If Google Calendar sync is enabled, a calendar event is created.

### Short Break Mode

Short break counts down from a user-selected duration.

Break time does **not** count toward study stats.

When it ends:

- Save a break session.
- Log to calendar as a red event.

### Long Break Mode

Long break works the same way as short break.

Break time does **not** count toward study stats.

When it ends:

- Save a break session.
- Log to calendar as a red event.

### Stopwatch Mode

Stopwatch starts at zero and counts upward until the user manually ends it.

Example:

```text
00:00 -> 00:01 -> 00:02 -> ...
```

When the user presses **End Session**:

- The stopwatch stops.
- A session record is saved.
- Calendar event is created if calendar sync is enabled.

Stopwatch mode should not auto-end.

---

## Study vs Chore Logic

The app has two broad modes:

1. **Study mode**
2. **Chore mode**

This is separate from timer mode.

Example combinations:

```text
Pomodoro + Study mode
Pomodoro + Chore mode
Stopwatch + Study mode
Stopwatch + Chore mode
Short Break
Long Break
```

Break modes are always breaks. They should not count as study or chore.

---

## Study Mode

Study mode is the default.

In study mode:

- The user selects one study label.
- The session counts toward total study time.
- The session counts toward that label's study time.
- The top-right daily study timer ticks while the timer is actively running.
- The Google Calendar event should use a blue shade based on the selected label.

### Study Labels

The user should be able to:

- select an existing label
- create a new label
- optionally rename or delete labels later

Each study session must have exactly one label.

Examples:

```text
Physics
ML
Math
Coding
Research
Writing
```

There should also be a virtual stats option called:

```text
Total Study Time
```

This is not a real label stored on sessions. It is a stats filter that includes all study sessions.

---

## Chore Mode

Chore mode is enabled with a small checkbox or square toggle on the timer page.

When chore mode is active:

- Study labels are disabled or hidden.
- A chore description textbox is shown.
- A chore color picker or dropdown is shown.
- The session does **not** count toward study time.
- The top-right daily study timer does **not** tick.
- The session is excluded from study stats.
- The chore should still be logged to Google Calendar when the session ends.

The chore textbox describes what the user is doing.

Examples:

```text
Laundry
Cleaning room
Admin work
Cooking
Bank work
```

### Chore Colors

The user can choose a calendar color for the chore event.

The available chore colors should **not** be:

- white
- black
- blue
- red

Reason:

- blue is reserved for study sessions
- red is reserved for breaks
- white/black are poor calendar colors

Suggested chore color options:

```text
green
yellow
purple
orange
teal
pink
brown
gray
```

---

## Calendar Logging Rules

Calendar logging happens when a session ends.

A session ends when:

- Pomodoro reaches zero
- Short break reaches zero
- Long break reaches zero
- User presses **End Session** in stopwatch mode
- User manually ends a running countdown session, if manual ending is allowed

Do **not** create calendar events continuously while a timer is running.

Do **not** create calendar events when the user pauses the timer.

Do **not** create calendar events when the user resets a timer before any meaningful time has elapsed.

A good minimum threshold is:

```text
Do not save or sync sessions shorter than 60 seconds unless the user confirms.
```

---

## Google Calendar Event Types

### Study Event

For study sessions:

- Event title should include the label.
- Event color should be a shade of blue assigned to that label.
- Event duration should match actual start/end time.
- Event description should include useful metadata.

Example event title:

```text
Study — Physics
```

Example event description:

```text
Mode: Pomodoro
Label: Physics
Duration: 50 minutes
Logged by Productivity Timer App
```

### Break Event

For short and long breaks:

- Event title should indicate break type.
- Event color should be red.
- Breaks do not count toward study stats.

Example titles:

```text
Short Break
Long Break
```

Example description:

```text
Mode: Short Break
Duration: 5 minutes
Logged by Productivity Timer App
```

### Chore Event

For chores:

- Event title should use the chore textbox.
- Event color should use the color selected by the user.
- Chores do not count toward study stats.

Example title:

```text
Chore — Laundry
```

Example description:

```text
Mode: Chore
Duration: 30 minutes
Logged by Productivity Timer App
```

---

## Important Google Calendar API Note

Google Calendar's API does not accept arbitrary hex colors directly for events in the normal simple event color system.

It uses predefined `colorId` values.

Therefore:

- Internally, the app can store friendly color names.
- When syncing to Google Calendar, map friendly colors to Google Calendar `colorId` values.
- Study labels should map to available blue-ish Google Calendar colors where possible.
- Breaks should map to a red-ish Google Calendar color.
- Chores should map to other available Google Calendar colors.

Example internal mapping:

```js
const GOOGLE_CALENDAR_COLORS = {
  blue1: "1",
  blue2: "9",
  green: "2",
  purple: "3",
  red: "11",
  yellow: "5",
  orange: "6",
  teal: "7",
  gray: "8"
};
```

The exact mapping should be verified during implementation.

---

## Data Model

Use IndexedDB for persistent structured data.

Recommended wrapper:

```text
Dexie.js
```

Dexie makes IndexedDB much easier to use.

---

## IndexedDB Tables

Recommended tables:

```text
sessions
labels
settings
calendarSync
```

### sessions

Stores all completed timer sessions.

Example schema:

```js
{
  id: "uuid",
  type: "study" | "break" | "chore",
  timerMode: "pomodoro" | "shortBreak" | "longBreak" | "stopwatch",

  labelId: "label_uuid_or_null",
  labelNameSnapshot: "Physics",

  choreDescription: null,
  choreColor: null,

  startTime: "2026-05-23T14:00:00.000Z",
  endTime: "2026-05-23T14:50:00.000Z",
  durationSeconds: 3000,

  completedNormally: true,
  manuallyEnded: false,

  calendarSynced: false,
  calendarEventId: null,

  createdAt: "2026-05-23T14:50:05.000Z",
  updatedAt: "2026-05-23T14:50:05.000Z"
}
```

### labels

Stores study labels.

Example schema:

```js
{
  id: "uuid",
  name: "Physics",
  calendarColorKey: "blue1",
  createdAt: "2026-05-23T14:00:00.000Z",
  updatedAt: "2026-05-23T14:00:00.000Z"
}
```

### settings

Stores app-level settings.

Example schema:

```js
{
  key: "defaultPomodoroMinutes",
  value: 25
}
```

Other settings:

```text
defaultShortBreakMinutes
defaultLongBreakMinutes
lastSelectedLabelId
calendarEnabled
calendarId
theme
```

### calendarSync

Stores calendar sync details if needed.

Example schema:

```js
{
  id: "uuid",
  sessionId: "session_uuid",
  provider: "google",
  calendarEventId: "google_event_id",
  status: "pending" | "synced" | "failed",
  lastAttemptAt: "2026-05-23T14:50:05.000Z",
  errorMessage: null
}
```

---

## Session Classification Logic

When a timer session ends, classify it before saving.

Pseudocode:

```js
function classifySession(timerMode, isChoreMode) {
  if (timerMode === "shortBreak" || timerMode === "longBreak") {
    return "break";
  }

  if (isChoreMode) {
    return "chore";
  }

  return "study";
}
```

Rules:

```text
Pomodoro + study mode = study session
Pomodoro + chore mode = chore session
Stopwatch + study mode = study session
Stopwatch + chore mode = chore session
Short break = break session
Long break = break session
```

---

## Daily Total Study Timer Logic

The small top-right timer shows total study time for the current local day.

It should equal:

```text
completed study sessions today
+
currently running active study session time
```

It should not include:

- chores
- breaks
- paused time
- reset sessions
- sessions shorter than minimum threshold if they were not saved

### Calculation

On page load:

1. Query all study sessions from today.
2. Sum their `durationSeconds`.
3. Display the result.

While a study session is actively running:

1. Add the current live elapsed time to the completed total.
2. Update the display every second.

If the timer is paused:

- Do not increase the live total.

If chore mode is active:

- Do not increase the study total.

If break mode is active:

- Do not increase the study total.

---

## Stats Page

The stats page should let the user select:

1. **Label**
2. **Time period**

### Label Options

The label dropdown should include:

```text
Total Study Time
Physics
ML
Math
Coding
...
```

`Total Study Time` means all study sessions regardless of label.

Chores and breaks should never appear in study stats.

### Time Period Options

The time period dropdown should include:

```text
Past Week
Past Month
Past Year
All Time
```

All periods should be aggregated by day.

This means the graph x-axis is always days.

Examples:

```text
Past Week: one bar per day
Past Month: one bar per day
Past Year: one point per day
All Time: one point per day
```

### Graph Types

Use:

```text
Past Week -> bar graph
Past Month -> bar graph
Past Year -> continuous line graph
All Time -> continuous line graph
```

Recommended charting library:

```text
Chart.js
```

### Stats Query Logic

Pseudocode:

```js
async function getStudyTimeByDay({ labelId, period }) {
  const dateRange = getDateRange(period);

  const sessions = await db.sessions
    .where("type")
    .equals("study")
    .filter(session => {
      const inRange = session.startTime >= dateRange.start &&
                      session.startTime <= dateRange.end;

      const labelMatches =
        labelId === "TOTAL" || session.labelId === labelId;

      return inRange && labelMatches;
    })
    .toArray();

  return aggregateSessionsByLocalDay(sessions);
}
```

### Aggregation by Day

Each day's total should be the sum of duration for saved study sessions that started on that local day.

For MVP, assign the full session duration to the day it started.

Later improvement:

- If a session crosses midnight, split its duration across both days.

---

## Recommended File Structure

Use modular JavaScript files.

```text
/productivity-app
  index.html
  stats.html
  settings.html

  /css
    base.css
    timer.css
    stats.css
    settings.css

  /js
    app.js
    timer.js
    timerState.js
    db.js
    labels.js
    sessions.js
    stats.js
    charts.js
    calendar.js
    calendarColors.js
    utils.js
    dateUtils.js
    settings.js
    ui.js

  /assets
    icons/
```

---

## Module Responsibilities

### app.js

Main entry point.

Responsibilities:

- initialize app
- load settings
- initialize IndexedDB
- attach UI event listeners
- restore last selected label
- render initial timer state

### timer.js

Timer engine.

Responsibilities:

- start timer
- pause timer
- resume timer
- reset timer
- end session
- emit timer tick events
- distinguish countdown vs stopwatch

### timerState.js

Stores current runtime state.

Example state:

```js
{
  timerMode: "pomodoro",
  isRunning: false,
  isPaused: false,
  isChoreMode: false,
  selectedLabelId: "uuid",
  choreDescription: "",
  choreColor: "green",
  startTime: null,
  pausedAt: null,
  totalPausedSeconds: 0,
  targetDurationSeconds: 1500,
  elapsedSeconds: 0,
  remainingSeconds: 1500
}
```

### db.js

IndexedDB/Dexie setup.

Responsibilities:

- define database
- define tables
- export database object

### sessions.js

Session creation and querying.

Responsibilities:

- create session object
- save session
- query sessions by date
- query study sessions
- calculate daily study total

### labels.js

Study label management.

Responsibilities:

- create label
- list labels
- update label
- delete label
- assign calendar blue shade

### stats.js

Stats calculations.

Responsibilities:

- filter sessions by label
- filter sessions by date range
- aggregate study time by day
- prepare chart data

### charts.js

Chart rendering.

Responsibilities:

- create Chart.js graph
- destroy old graph before rendering new one
- switch chart type based on selected time period

### calendar.js

Google Calendar integration.

Responsibilities:

- authenticate user
- create calendar event
- map session type to calendar event
- handle sync errors
- store calendar event ID after successful sync

### calendarColors.js

Color mapping.

Responsibilities:

- map study labels to blue shades
- map breaks to red
- map chore colors to Google Calendar color IDs

### dateUtils.js

Date helpers.

Responsibilities:

- get local day start/end
- format durations
- get past week/month/year ranges
- generate all dates in range
- convert dates to ISO strings

### settings.js

Settings persistence.

Responsibilities:

- save defaults
- load defaults
- update timer durations
- store calendar settings

### ui.js

DOM rendering.

Responsibilities:

- update timer display
- show/hide study/chore controls
- update daily study total
- render labels
- show errors
- show success messages

---

## Timer Ending Flow

When a timer ends, run this flow:

```text
1. Stop timer interval.
2. Calculate actual elapsed active time.
3. Ignore paused time.
4. If duration is below minimum threshold, ask user whether to save.
5. Classify session as study, break, or chore.
6. Build session object.
7. Save session to IndexedDB.
8. Update daily study total.
9. If Google Calendar sync is enabled, create calendar event.
10. Save calendar event ID or sync failure.
11. Reset UI for next session.
```

Pseudocode:

```js
async function handleSessionEnd({ completedNormally, manuallyEnded }) {
  stopTimer();

  const durationSeconds = calculateActiveDuration();

  if (durationSeconds < 60) {
    const shouldSave = confirm("This session was under 1 minute. Save it?");
    if (!shouldSave) {
      resetTimerUI();
      return;
    }
  }

  const sessionType = classifySession(currentState.timerMode, currentState.isChoreMode);

  const session = buildSessionObject({
    type: sessionType,
    timerMode: currentState.timerMode,
    startTime: currentState.startTime,
    endTime: new Date(),
    durationSeconds,
    completedNormally,
    manuallyEnded
  });

  const savedSession = await saveSession(session);

  updateDailyStudyTotalUI();

  if (await isCalendarEnabled()) {
    try {
      const eventId = await createCalendarEventFromSession(savedSession);
      await markSessionCalendarSynced(savedSession.id, eventId);
    } catch (error) {
      await markSessionCalendarFailed(savedSession.id, error.message);
      showCalendarSyncError(error);
    }
  }

  resetTimerUI();
}
```

---

## Calendar Event Creation Pseudocode

```js
function buildCalendarEventFromSession(session) {
  if (session.type === "study") {
    return {
      summary: `Study — ${session.labelNameSnapshot}`,
      description: buildStudyDescription(session),
      start: { dateTime: session.startTime },
      end: { dateTime: session.endTime },
      colorId: getColorIdForStudyLabel(session.labelId)
    };
  }

  if (session.type === "break") {
    const title = session.timerMode === "shortBreak"
      ? "Short Break"
      : "Long Break";

    return {
      summary: title,
      description: buildBreakDescription(session),
      start: { dateTime: session.startTime },
      end: { dateTime: session.endTime },
      colorId: getBreakRedColorId()
    };
  }

  if (session.type === "chore") {
    return {
      summary: `Chore — ${session.choreDescription || "Untitled Chore"}`,
      description: buildChoreDescription(session),
      start: { dateTime: session.startTime },
      end: { dateTime: session.endTime },
      colorId: getColorIdForChoreColor(session.choreColor)
    };
  }
}
```

---

## UI Requirements

### Timer Page

The timer page should include:

- large central timer display
- mode buttons:
  - Pomodoro
  - Short Break
  - Long Break
  - Stopwatch
- start button
- pause/resume button
- reset button
- end session button
- small daily study total timer in top-right corner
- study/chore checkbox
- study label dropdown
- add label button
- chore description textbox
- chore color selector

### UI Behavior

When study mode is active:

- show label dropdown
- show add label button
- hide chore textbox
- hide chore color selector

When chore mode is active:

- hide or disable label dropdown
- show chore textbox
- show chore color selector
- top-right study timer should not tick

When break mode is active:

- hide study/chore controls or disable them
- breaks should be treated as their own category

---

## Stats Page UI

The stats page should include:

- label dropdown
- time period dropdown
- graph area
- total time summary
- optional average per day summary
- optional best day summary

Example stats summary:

```text
Physics — Past Week
Total: 12h 30m
Daily average: 1h 47m
Best day: Wednesday, 3h 10m
```

---

## Local-First Philosophy

The app should work even without Google Calendar connected.

Core functionality must not depend on Google Calendar.

The order of importance is:

```text
1. Save sessions locally
2. Show correct stats locally
3. Sync to Google Calendar if enabled
```

If Google Calendar sync fails:

- do not delete local session
- mark session as `calendarSynced: false`
- store error message
- allow retry later

---

## GitHub Pages Compatibility

The app should initially be deployable on GitHub Pages.

That means:

- no required backend for MVP
- static HTML/CSS/JS only
- IndexedDB for local browser storage
- Google Calendar OAuth must use frontend-compatible auth if implemented without backend

However, Google Calendar integration may become easier and more secure with a backend or serverless function later.

For MVP:

1. Build local timer and stats first.
2. Add export options.
3. Add Google Calendar API integration after the data model is stable.

---

## Optional Export Features

Add later:

- export sessions as CSV
- export sessions as JSON backup
- import sessions from JSON backup
- export calendar events as `.ics`

These are useful before full Google Calendar sync exists.

---

## Important Implementation Rules

Follow these rules while coding:

1. Keep timer logic separate from UI logic.
2. Keep storage logic separate from timer logic.
3. Store raw sessions, not precomputed stats.
4. Calculate stats from session records.
5. Use local time for daily stats.
6. Use ISO timestamps for storage.
7. Always save locally before trying Google Calendar sync.
8. Never count chores as study.
9. Never count breaks as study.
10. Stopwatch sessions end only when the user presses **End Session**.
11. Each study session has exactly one label.
12. The stats page always aggregates by day.
13. The `Total Study Time` stats option includes all study labels.
14. Do not create calendar events while a timer is still running.
15. Do not lose data if calendar sync fails.

---

## MVP Definition

The first complete version should support:

- Pomodoro countdown
- short break countdown
- long break countdown
- stopwatch
- study mode
- chore mode
- one label per study session
- adding labels
- saving sessions to IndexedDB
- daily study total timer
- stats page with label + period selection
- graph by day
- no required Google Calendar sync yet

Google Calendar can be implemented after the MVP works locally.

---

## Success Criteria

The app is working correctly when:

1. A study Pomodoro session saves with the right label.
2. The daily study timer increases only during study time.
3. Chores are saved but excluded from study stats.
4. Breaks are saved but excluded from study stats.
5. Stats correctly show daily totals for selected labels.
6. `Total Study Time` correctly includes all study sessions.
7. Stopwatch sessions save only when manually ended.
8. Calendar events are created only after sessions end.
9. Calendar sync failure does not delete local session data.
10. The codebase remains modular enough to add features without rewriting everything.

---

## Suggested First Coding Prompt

Use this prompt to begin implementation:

```text
Build Phase 1 of the productivity timer app described in GPT.md.

Use plain HTML, CSS, and JavaScript.

Implement:
- Pomodoro countdown
- short break countdown
- long break countdown
- stopwatch
- start/pause/resume/reset/end session buttons
- clean modular timer logic
- basic responsive UI
- no stats page yet
- no Google Calendar yet
- no IndexedDB yet unless necessary

Create separate files:
index.html
css/base.css
css/timer.css
js/app.js
js/timer.js
js/timerState.js
js/ui.js

Follow the architecture and rules in GPT.md.
```

---

## Suggested Second Coding Prompt

```text
Now implement Phase 2 from GPT.md.

Add Dexie.js and IndexedDB storage.

Create:
js/db.js
js/sessions.js
js/dateUtils.js

When a timer session ends, save a session record locally.

Implement session classification:
- study
- break
- chore

For now, default all Pomodoro and Stopwatch sessions to study.
Break modes should save as break sessions.

Do not implement Google Calendar yet.
```

---

## Suggested Third Coding Prompt

```text
Now implement Phase 3 from GPT.md.

Add:
- study/chore checkbox
- study label dropdown
- add-new-label feature
- chore description textbox
- chore color selector
- label storage in IndexedDB

Each study session must save exactly one label.
Chore sessions must save description and color.
Chores must not count as study.
```

---

## Suggested Fourth Coding Prompt

```text
Now implement Phase 4 and 5 from GPT.md.

Add:
- top-right total study time today timer
- stats.html
- stats.js
- charts.js
- Chart.js graph rendering

Stats page requirements:
- label dropdown including Total Study Time
- time period dropdown with Past Week, Past Month, Past Year, All Time
- aggregate all data by day
- bar graph for week/month
- line graph for year/all time
```

---

## Suggested Fifth Coding Prompt

```text
Now implement Google Calendar integration from GPT.md.

Calendar rules:
- create event only when a session ends
- study sessions are blue shades by label
- breaks are red
- chores use selected chore color
- save locally before calendar sync
- store calendar event ID after successful sync
- if sync fails, keep local session and mark it unsynced
```
