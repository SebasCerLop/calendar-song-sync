import os
import re
from datetime import datetime, tzinfo
from pathlib import Path
from typing import Iterable, Optional

import requests
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

    def get_current_activity(self, now: Optional[datetime] = None) -> dict[str, str]:
        current_time = now or datetime.now().astimezone()
        if current_time.tzinfo is None:
            current_time = current_time.astimezone()

        calendar = self._read_calendar()
        for event in calendar.events:
            if event.begin is None or event.end is None:
                continue

            start = self._as_local_datetime(
                event.begin.datetime, current_time.tzinfo
            )
            end = self._as_local_datetime(event.end.datetime, current_time.tzinfo)
            if start <= current_time < end:
                activity = event.name or "Untitled event"
                return {
                    "activity": activity,
                    "tag": self._get_tag(activity, event.categories),
                }

        return {"activity": "Free Time", "tag": "Relax"}


def create_calendar_sync() -> CalendarSync:
    return CalendarSync(
        calendar_url=os.getenv("CALENDAR_URL"),
        calendar_file=os.getenv("CALENDAR_FILE"),
    )
