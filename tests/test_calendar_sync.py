from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from src.calendar_sync import CalendarSync
from src.main import MediaRequest, trigger_media


SAMPLE_CALENDAR = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Calendar Song Sync//EN
BEGIN:VEVENT
UID:coding-event
DTSTART:20261109T140000Z
DTEND:20261109T150000Z
SUMMARY:Coding Python project
CATEGORIES:Coding
END:VEVENT
END:VCALENDAR
"""


class CalendarSyncTests(TestCase):
    def test_reads_calendar_file(self) -> None:
        with TemporaryDirectory() as directory:
            calendar_file = Path(directory) / "calendar.ics"
            calendar_file.write_text(SAMPLE_CALENDAR, encoding="utf-8")
            sync = CalendarSync(calendar_file=str(calendar_file))

            result = sync.get_current_activity(
                datetime(2026, 11, 9, 14, 30, tzinfo=timezone.utc)
            )

        self.assertEqual(
            result,
            {"activity": "Coding Python project", "tag": "Coding"},
        )

    def test_returns_matching_event_and_tag(self) -> None:
        sync = CalendarSync()
        with patch.object(sync, "_read_calendar") as read_calendar:
            from ics import Calendar

            read_calendar.return_value = Calendar(SAMPLE_CALENDAR)
            result = sync.get_current_activity(
                datetime(2026, 11, 9, 14, 30, tzinfo=timezone.utc)
            )

        self.assertEqual(
            result,
            {"activity": "Coding Python project", "tag": "Coding"},
        )

    def test_event_end_is_exclusive(self) -> None:
        sync = CalendarSync()
        with patch.object(sync, "_read_calendar") as read_calendar:
            from ics import Calendar

            read_calendar.return_value = Calendar(SAMPLE_CALENDAR)
            result = sync.get_current_activity(
                datetime(2026, 11, 9, 15, 0, tzinfo=timezone.utc)
            )

        self.assertEqual(result, {"activity": "Free Time", "tag": "Relax"})

    def test_media_trigger_opens_youtube_music_search(self) -> None:
        with patch("src.main.webbrowser.open", return_value=True) as open_browser:
            response = trigger_media(MediaRequest(tag="Workout mix"))

        self.assertEqual(response["status"], "success")
        self.assertEqual(response["tag_received"], "Workout mix")
        open_browser.assert_called_once()

    def test_media_trigger_reports_browser_failure(self) -> None:
        with patch("src.main.webbrowser.open", return_value=False):
            from fastapi import HTTPException

            with self.assertRaises(HTTPException) as error:
                trigger_media(MediaRequest(tag="Workout"))

        self.assertEqual(error.exception.status_code, 503)
