# Calendar Song Sync

A local Python API that reads calendar events, identifies the current activity,
and opens a YouTube Music search for a selected tag.

## Features

- Read an iCalendar (`.ics`) file or an iCalendar feed URL.
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

Choose at most one calendar source. A local file is read from disk; a feed URL
is fetched when the current-activity endpoint is called.

```powershell
$env:CALENDAR_FILE = "C:\path\to\calendar.ics"
# Alternatively:
# $env:CALENDAR_URL = "https://example.com/calendar.ics"
python -m src.main
```

The API listens on `http://127.0.0.1:8000`. If neither calendar variable is set,
the activity endpoint returns the free-time response.

## API

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

## Privacy

Keep personal calendar files and feed URLs out of source control. Calendar
files (`*.ics`), local environment files, and virtual environments are ignored
by Git.
