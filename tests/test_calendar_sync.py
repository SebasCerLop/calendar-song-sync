from datetime import datetime, timedelta, timezone
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

ALL_DAY_CALENDAR = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Calendar Song Sync//EN
BEGIN:VEVENT
UID:holiday
DTSTART;VALUE=DATE:20261109
DTEND;VALUE=DATE:20261111
SUMMARY:Relax holiday
END:VEVENT
BEGIN:VEVENT
UID:recurring
DTSTART:20261109T140000Z
DTEND:20261109T150000Z
RRULE:FREQ=DAILY
SUMMARY:Coding practice
END:VEVENT
END:VCALENDAR
"""


class CalendarSyncTests(TestCase):
    def test_event_listing_preserves_all_day_dates_and_warns_about_recurrence(self) -> None:
        from ics import Calendar

        sync = CalendarSync(calendar_file="configured.ics")
        with patch.object(sync, "_read_calendar", return_value=Calendar(ALL_DAY_CALENDAR)):
            result = sync.get_events()
        self.assertTrue(result["configured"])
        self.assertTrue(result["has_recurring_events"])
        holiday = next(event for event in result["events"] if event["all_day"])
        self.assertEqual((holiday["start"], holiday["end"]), ("2026-11-09", "2026-11-11"))
        self.assertEqual(holiday["tag"], "Relax")

    def test_unconfigured_calendar_has_no_events(self) -> None:
        self.assertEqual(
            CalendarSync().get_events(),
            {"configured": False, "events": [], "has_recurring_events": False},
        )

    def test_calendar_feed_is_fetched_and_parsed(self) -> None:
        sync = CalendarSync(calendar_url="https://example.com/calendar.ics")
        with patch("src.calendar_sync.requests.get") as get:
            get.return_value.text = SAMPLE_CALENDAR
            result = sync.get_events()
        get.assert_called_once_with("https://example.com/calendar.ics", timeout=10)
        get.return_value.raise_for_status.assert_called_once_with()
        self.assertTrue(result["configured"])
        self.assertEqual(result["events"][0]["title"], "Coding Python project")

    def test_missing_calendar_file_is_not_treated_as_empty(self) -> None:
        with TemporaryDirectory() as directory:
            sync = CalendarSync(calendar_file=str(Path(directory) / "missing.ics"))
            with self.assertRaises(FileNotFoundError):
                sync.get_events()

    def test_all_day_event_uses_local_calendar_date(self) -> None:
        from ics import Calendar

        sync = CalendarSync()
        with patch.object(sync, "_read_calendar", return_value=Calendar(ALL_DAY_CALENDAR)):
            result = sync.get_current_activity(
                datetime(2026, 11, 10, 23, 30, tzinfo=timezone(timedelta(hours=-6)))
            )
        self.assertEqual(result, {"activity": "Relax holiday", "tag": "Relax"})

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
