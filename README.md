# To-do app

A small practice app. It works the same way a real business app works, just with
much simpler data.

**Live demo:** https://celinacham.github.io/todo-app/

## Two ways this app runs

The same screen works in two modes, and it tells you which one you're in.

| | On your machine | The published demo |
|---|---|---|
| Started by | `start-todo-app.bat` | Just a link |
| Data lives in | `todo.db`, a real database | The visitor's own browser |
| Shared between people | Not yet | No — each visitor has their own |
| Purpose | The actual app | Something to click and comment on |

When the page loads it asks whether the engine is there. If it answers, the real
database is used. If it doesn't — as on the demo — the page falls back to
browser storage and says so on screen, rather than quietly pretending the data
went somewhere.

That fallback exists because GitHub Pages can only serve files; it can't keep a
program running. Any version of this that several people share will need the
engine hosted somewhere.

## Running it

Double-click **start-todo-app.bat**.

A black window appears and your browser opens at `http://localhost:4321`.

**Leave the black window open** — that window *is* the app. Closing it stops the
app. Your tasks are saved either way; they'll still be there next time.

## Updating the published demo

The website is served from a separate branch called `gh-pages`, which holds a
copy of the `public/` folder. After changing anything in `public/`:

```
git add -A
git commit -m "what changed"
git push origin main
git subtree push --prefix public origin gh-pages
```

The last line is the one that updates the website; the site refreshes about a
minute later. Pushing to `main` alone updates the code but not the demo.

## Using it

| Action | How |
|---|---|
| Add a task | Type in the box, press Enter |
| Mark it done | Click the checkbox |
| Rename it | Click the text, type, press Enter |
| Delete it | Click the × on the right |
| Filter | Use All / To do / Done |
| Tidy up | "Clear completed" |

Everything saves the moment you do it. There is no save button and nothing to
lose if the app closes unexpectedly.

## What the files are

| File | What it does |
|---|---|
| `start-todo-app.bat` | The thing you double-click |
| `server.js` | The engine. Holds the rules and talks to the database |
| `public/index.html` | The screen you see and click |
| `public/fonts/` | The AddVita brand fonts, kept here so the app works offline |
| `todo.db` | Your actual data. Created automatically on first run |

## Brand styling

Taken from *AddVita Brand Guidelines – working file – 20250505.pptx*.

| Colour | Hex | Used for |
|---|---|---|
| Indigo (primary) | `#414288` | Title, Add button, checkboxes, active filter |
| Sky (primary) | `#80A1D4` | The ADDVITA wordmark, focus outlines |
| Plum (secondary) | `#682D63` | Delete, and the Add button on hover |
| Orange (secondary) | `#FF8811` | The remaining-task count, and nothing else |
| Grey (secondary) | `#D6D6D6` | Borders and dividers |

Type follows the brand hierarchy: **KoHo Regular** for the title, **Roboto** for
body text, **Roboto ExtraBold** for the button and other emphasis.

The font files in `public/fonts/` come from the AddVita brand pack. Roboto is
distributed under the SIL Open Font License (`public/fonts/OFL.txt`); KoHo is a
Google Fonts release under the same licence, though the brand-pack copy shipped
without its licence file. Both are free to redistribute with the app.

Orange appears exactly once on screen, on purpose. An accent colour used
everywhere stops reading as an accent.

The colour values live at the top of `public/index.html`, under
`AddVita brand palette` — change them in that one place and the whole app
follows. There's a dark version of each just below it, for when Windows is set
to dark mode.

## How this relates to the masterfile

This app is the same three-part shape any replacement for the masterfile would
have, which is the point of building it:

**1. The database (`todo.db`) replaces the grid of cells.**
In Excel, anything can go in any cell. Here the rules live in the database
itself: a task cannot have an empty title, ids are never reused, and a record is
either fully written or not written at all. In the masterfile version those
rules become your real ones — a subsidiary code must exist, a period must be a
valid period, debits must equal credits.

**2. The engine (`server.js`) replaces the formulas.**
Calculations live in one place instead of being copied across thousands of
cells. Nobody can overwrite a formula by pasting over it, because the formula
isn't in the sheet — it runs on the way out.

**3. The screen (`index.html`) replaces the worksheet view.**
People only see the fields they're meant to touch. There's no way to delete a
column or drag a formula into the wrong row, because those aren't things the
screen lets you do.

The lag disappears for a related reason: Excel recalculates the whole workbook
constantly, while a database only touches the rows you asked for. That
difference grows as the file does.

## Two honest limitations

This version is **single-user and has no login**. Anyone on this computer who
runs it sees the same tasks. That's fine for practice and deliberately kept out
of the way — user accounts, permissions, and an audit trail of who changed what
are the next things to learn, and they're what a control file genuinely needs.

It also only runs **on this machine**. Nothing on the network can reach it. A
shared version would need to live somewhere your team can reach, which is a
separate conversation about hosting.

## If something goes wrong

**"node is not recognized"** — Node isn't on this machine. It was there when
this was built, so this would mean it was removed.

**"address already in use"** — the app is already running in another window.
Close that window first.

**Browser shows "can't reach this page"** — the black window probably closed.
Start it again, and give it two seconds before refreshing.

**Start completely fresh** — close the app and delete `todo.db`. A new empty one
is created on the next run. Nothing else is affected.
