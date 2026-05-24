## Current goal for this run of Codex:
- Now we will code the statsitics page. Check the new section i added about ths stats page as well as the new screenshot i attached with the pomfocus.io stats page design and use these to inform the coding


## Gneral project desccription
- The goal is to build a productivity app, similar to pommfocus.org in design but with different features.
- I want it to be a web app. There will be a big timer that can either count down (for pomodoro style study sessions) or in another setting it counts up from 0 so that I can study for as long as I want. 
- i want to have a very advanced data tracking setup. The app should keep track of each study session and how much im studying every day. There should be labels under which i can segmant what im doing. For example, if i set the label to Physics, then the time i spend studying is stored under Phyics so i can track how much time im spending studying Physics specifically out of my total study time, instead of just total study time. There should be many labels like Physics, Math etc At the same time, the app should also store total cumulative time studied. It should be possible to pick multiple labels at once. 
- For every run of the timer, it should store how much time studied but also what label to put it under.
- I will also want a advanced graphiing system. For example, lets say I want to track how much I ve studiied per day over a year, i should be with a few clicks able to generate a graph of total study time peer day over 2026. Simialrly, for any other lavbel like if i wanna plot my studytime in ML over the past month. The data for the webapp should be stored in a way where it can quicly be retrieved for things like this. 
- I also want there to be a smaller timer on the screen which tracks total time studied in a certain day cumulativbve rather than just the big main timer.

## Statistics Page Logic
- Now lets make the statistics page
- There should be two filters to apply. One is the list of labels. I can either select a label like Physics for eg or I can select an alternate option of total study time. The second label selects the time frame, for example past week, past month, past year, and all time. 
- After selecting this label, the program displays e numbers: numbers of hours studied in that time frame, number of days I studied more than 90 minutes in that time frame and my total daily streak which is the number of conseutive days ive been studying. The streak dies if i spend a day without studying more than 90 minutes. 
- Secondly, below these numbers, there will be a graph plotting my study time over this time period.
- Preferably, i would like to be able to select more than one label in which case if plots both labels on the same graph, and total study time diaplayed should be time_label_1+time_label_2. if this isinconveneitn to implement you can skip this one and keep it to just oone label or total study time at a time

## Website design
- I want the website to look very similar to the pomfocus.io site, with how smooth and nice it looks. The exception is the colour, i want the colour theme to be blue while the timer is on, and red while the timer is set to break mode.
- There will be one main big timer just like in pomfocus.io with start, pause, reset buttons and the break mode option. There will also be a second timer somewhere to the side which counts up total cumulative time studied for that whole given day across all study sessions that day.
- Make the style look as similar to pomfocus.io as i will show you in attached screenshtos as possible, but dont add buttons that correspond to features of pomfocus that arent in thei program like the settings the signin or the add tasks
- There will be a dropdown bar with all the labels. One or more labels can be selected at once. There will be an optuion to "add label" where i can enter a name and that becomes a new lavel option for the program.
- Have a button that will lead to a statistics sectio later but dont implement it yet
- Don't forget to implement functionality to switch between countup and coutdown and also to set the time for countdown. I want the timers to be in MMM:SS format

## Coding style
- We will work with js, css and html. If more lannguages are needed for some task, prompt and ask me about it before proceeding
- Make the code undersstandable and verye asy to debug
- Keep files under ~200 lines; split when they grow
- Prefer plain objects over classes unless state + behavior genuinely co-locate
- No unnecessary abstractions — write it the obvious way first

## What I don't want
- Don't add new dependencies without asking
- Don't add comments that restate what code does; comments explain *why*
- Don't write tests unless I ask for them on a given task


## Storage
storage.js — Data Layer

All data access goes through this module. No other file touches IndexedDB directly.

One IndexedDB object store: sessions
Each session: { id, startTime, endTime, durationMs, labels: [] }
Two indexes: startTime (date-range queries) and labels (multiEntry, for per-label queries)
Exposed functions:
saveSession(session) — write a completed session
getSessionsByDateRange(start, end) — returns all sessions in a date range
getSessionsByLabel(label) — returns all sessions with a given label
getSessionsForToday() — convenience wrapper for the daily cumulative timer
Keeping all IndexedDB logic here means the storage backend can be swapped without touching the rest of the app.

Labels are stored as plain strings inside each session's labels array. The available label list (e.g. Physics, Math, ML) lives separately — either hardcoded or in localStorage — and is not managed by storage.js.


