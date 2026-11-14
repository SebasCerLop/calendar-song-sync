import os
import re
from datetime import datetime, timedelta, tzinfo
from pathlib import Path
from typing import Iterable, Optional

import requests
from dateutil.rrule import rrulestr
from ics import Calendar


ACTIVITY_TAGS = ("Coding", "Workout", "Meeting", "Relax")


class CalendarSync:
    def __init__(
        self,
        calendar_url: Optional[str] = None,
        calendar_file: Optional[str] = None,
    ) -> None:
        self.calendar_url = calendar_url
        self.calendar_file = calendar_file

    def _read_calendar(self) -> Calendar:
        if self.calendar_url:
            response = requests.get(self.calendar_url, timeout=10)
            response.raise_for_status()
            return Calendar(response.text)

        if self.calendar_file:
            calendar_text = Path(self.calendar_file).read_text(encoding="utf-8")
            return Calendar(calendar_text)

        return Calendar()

    @staticmethod
    def _get_tag(summary: str, categories: Iterable[object]) -> str:
        category_names = {str(category).casefold() for category in categories}
        for tag in ACTIVITY_TAGS:
            if tag.casefold() in category_names:
                return tag

        normalized_summary = summary.casefold()
        for tag in ACTIVITY_TAGS:
            if re.search(r"\b" + re.escape(tag.casefold()) + r"\b", normalized_summary):
                return tag

        return "Other"

    @staticmethod
    def _as_local_datetime(value: datetime, local_timezone: tzinfo) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=local_timezone)
        return value

    @staticmethod
    def _recurrence_rule(event: object) -> Optional[str]:
        for line in event.extra:
            if line.name == "RRULE":
                return line.value
        return None

    @classmethod
    def _event_data(cls, event: object, start: datetime) -> dict:
        activity = event.name or "Untitled event"
        all_day = event.all_day
        duration = event.end.datetime - event.begin.datetime
        end = start + duration
        return {
            "title": activity,
            "tag": cls._get_tag(activity, event.categories),
            "start": start.strftime("%Y-%m-%d") if all_day else start.isoformat(),
            "end": end.strftime("%Y-%m-%d") if all_day else end.isoformat(),
            "all_day": all_day,
        }

    def _expanded_events(
        self, calendar: Calendar, window_start: datetime, window_end: datetime
    ) -> tuple[list[dict], bool]:
        events = []
        has_recurring_events = False
        for event in calendar.events:
            if event.begin is None or event.end is None:
                continue
            start = event.begin.datetime
            rule = self._recurrence_rule(event)
            if not rule:
                if event.all_day:
                    in_window = (
                        window_start.date() <= start.date() < window_end.date()
                    )
                else:
                    comparable_start = self._as_local_datetime(
                        start, window_start.tzinfo
                    )
                    in_window = window_start <= comparable_start < window_end
                if in_window:
                    events.append(self._event_data(event, start))
                continue

            has_recurring_events = True
            recurrence = rrulestr(rule, dtstart=start)
            recurrence_start = (
                window_start.replace(tzinfo=None)
                if start.tzinfo is None
                else window_start
            )
            recurrence_end = (
                window_end.replace(tzinfo=None)
                if start.tzinfo is None
                else window_end
            )
            occurrences = recurrence.between(recurrence_start, recurrence_end, inc=True)
            events.extend(self._event_data(event, occurrence) for occurrence in occurrences)
        events.sort(key=lambda event: (event["start"], event["title"]))
        return events, has_recurring_events

    def get_events(self, now: Optional[datetime] = None) -> dict:
        current_time = now or datetime.now().astimezone()
        if current_time.tzinfo is None:
            current_time = current_time.astimezone()
        calendar = self._read_calendar()
        window_start = current_time - timedelta(days=366)
        window_end = current_time + timedelta(days=366)
        events, has_recurring_events = self._expanded_events(
            calendar, window_start, window_end
        )
        return {
            "configured": bool(self.calendar_url or self.calendar_file),
            "events": events,
            "has_recurring_events": has_recurring_events,
        }

    def get_current_activity(self, now: Optional[datetime] = None) -> dict[str, str]:
        current_time = now or datetime.now().astimezone()
        if current_time.tzinfo is None:
            current_time = current_time.astimezone()

        events = self.get_events(current_time)["events"]
        for event in events:
            if event["all_day"]:
                active = event["start"] <= current_time.date().isoformat() < event["end"]
            else:
                start = self._as_local_datetime(
                    datetime.fromisoformat(event["start"]), current_time.tzinfo
                )
                end = self._as_local_datetime(
                    datetime.fromisoformat(event["end"]), current_time.tzinfo
                )
                active = start <= current_time < end
            if active:
                return {
                    "activity": event["title"],
                    "tag": event["tag"],
                }

        return {"activity": "Free Time", "tag": "Relax"}


def create_calendar_sync() -> CalendarSync:
    return CalendarSync(
        calendar_url=os.getenv("CALENDAR_URL"),
        calendar_file=os.getenv("CALENDAR_FILE"),
    )
