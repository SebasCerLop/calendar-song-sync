# Calendar Song Sync

A local calendar dashboard and Python API that read calendar events, identify
the current activity, and open a YouTube Music search for a selected tag.

## Introduction

Calendar Song Sync connects scheduled activities with music discovery. This
first Python/FastAPI milestone looks up the active calendar event and makes it
easy to open a YouTube Music search for its activity. Music searches are
triggered explicitly; this version does not start playback automatically.

## Features

- Read an iCalendar (`.ics`) file or an iCalendar feed URL.
- Browse a month view and select a day to see its events.
- Choose a color theme, background style, or personal background image.
- Find the event active now and infer its tag from its categories or title.
- Return `Free Time` / `Relax` when no event is active or no calendar is set.
- Open a YouTube Music search through an explicit API request.

## Requirements

- Python 3.10 or later
- A local `.ics` file or an iCalendar feed URL (optional)

## Run locally

From the project directory, create and activate a virtual environment and
install the pinned dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On Windows, after setup, double-click `launcher\start_app.bat` to start the
backend and open the calendar dashboard in your default browser. Keep the
launcher window open while using the app; press Ctrl+C in that window to stop
the server.

Choose at most one calendar source. A local file is read from disk; a feed URL
is fetched when the current-activity endpoint is called. To use one with the
launcher, set the variable in the same terminal before running the batch file,
or set it in your Windows environment settings before launching.

```powershell
$env:CALENDAR_FILE = "C:\path\to\calendar.ics"
# Alternatively:
# $env:CALENDAR_URL = "https://example.com/calendar.ics"
python -m src.main
```

The dashboard is at `http://127.0.0.1:8000`. If neither calendar variable is
set, it shows an empty calendar and the activity endpoint returns the free-time
response. Events are read-only; recurring events currently show only their
original occurrence. Dates and times are displayed in your browser's local
timezone.

### Customize the appearance

Open **Appearance** in the top bar to choose a theme and a plain or gradient
background. You can also select a PNG, JPEG, or WebP image up to 1 MB, or
remove it later. Your selection and image are stored in the browser on this
device, not uploaded to the server. Browser storage must be available; clearing
site data or using another browser removes or separates these settings.

## API

### Get calendar events

`GET /api/events` returns the configured-source status, events, and an
indicator when recurrence rules are present. All-day event end dates are
exclusive.

### Get the current activity

`GET /api/current-activity`

Example response:

```json
{
  "activity": "Coding Python project",
  "tag": "Coding"
}
```

Supported inferred tags are `Coding`, `Workout`, `Meeting`, and `Relax`.
Unrecognized event titles or categories are tagged `Other`.

### Open a music search

`POST /api/trigger-media`

Request:

```json
{
  "tag": "Workout"
}
```

The API opens a YouTube Music search in the machine's system browser. This
starter does not control playback or authenticate with a music account.

Interactive API documentation is available at `http://127.0.0.1:8000/docs`
while the local server is running.

## Run tests

```powershell
python -m unittest discover -s tests -v
```

For the appearance logic tests, if Node.js is installed:

```powershell
node --test tests\test_appearance.cjs
```

## Privacy

Keep personal calendar files and feed URLs out of source control. Calendar
files (`*.ics`), local environment files, and virtual environments are ignored
by Git.
