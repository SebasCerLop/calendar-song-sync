"use strict";

const elements = Object.fromEntries(
  ["month-title", "calendar", "prev", "next", "today", "notice", "activity", "activity-tag", "music", "music-status", "agenda", "selected-date"].map(
    id => [id, document.getElementById(id)]
  )
);
const now = new Date();
let selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let month = new Date(selected.getFullYear(), selected.getMonth(), 1);
let events = [];
let currentTag = null;
let requestId = 0;

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function eventOnDay(event, date) {
  const day = dateKey(date);
  if (event.all_day) return event.start <= day && day < event.end;
  const start = new Date(event.start);
  const end = new Date(event.end);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return start < nextDay && end > dayStart;
}

function eventTime(event) {
  if (event.all_day) return "All day";
  const format = date => new Intl.DateTimeFormat(undefined, {hour: "numeric", minute: "2-digit"}).format(new Date(date));
  return `${format(event.start)} – ${format(event.end)}`;
}

function render() {
  elements["month-title"].textContent = new Intl.DateTimeFormat(undefined, {month: "long", year: "numeric"}).format(month);
  elements.calendar.replaceChildren();
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const todayKey = dateKey(new Date());
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dayEvents = events.filter(event => eventOnDay(event, date));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day";
    button.classList.toggle("outside", date.getMonth() !== month.getMonth());
    button.classList.toggle("selected", dateKey(date) === dateKey(selected));
    button.classList.toggle("today", dateKey(date) === todayKey);
    button.setAttribute("aria-label", `${new Intl.DateTimeFormat(undefined, {dateStyle: "full"}).format(date)}, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`);
    button.setAttribute("aria-pressed", String(dateKey(date) === dateKey(selected)));
    if (dateKey(date) === todayKey) button.setAttribute("aria-current", "date");
    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = date.getDate();
    button.append(number);
    if (dayEvents.length) {
      const eventLabel = document.createElement("span");
      eventLabel.className = "day-event";
      eventLabel.textContent = dayEvents[0].title;
      button.append(eventLabel);
      if (dayEvents.length > 1) {
        const more = document.createElement("span");
        more.className = "day-more";
        more.textContent = `+${dayEvents.length - 1} more`;
        button.append(more);
      }
    }
    button.addEventListener("click", () => {
      selected = date;
      month = new Date(date.getFullYear(), date.getMonth(), 1);
      render();
    });
    elements.calendar.append(button);
  }
  elements["selected-date"].textContent = new Intl.DateTimeFormat(undefined, {weekday: "long", month: "long", day: "numeric"}).format(selected);
  elements.agenda.replaceChildren();
  const dayEvents = events.filter(event => eventOnDay(event, selected));
  if (!dayEvents.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Nothing planned here yet. A little room to breathe.";
    elements.agenda.append(empty);
  }
  for (const event of dayEvents) {
    const item = document.createElement("div");
    item.className = "agenda-item";
    const marker = document.createElement("span");
    marker.className = "agenda-marker";
    const details = document.createElement("div");
    const time = document.createElement("div");
    time.className = "agenda-time";
    time.textContent = eventTime(event);
    const title = document.createElement("div");
    title.className = "agenda-title";
    title.textContent = event.title;
    const tag = document.createElement("div");
    tag.className = "agenda-tag";
    tag.textContent = event.tag;
    details.append(time, title, tag);
    item.append(marker, details);
    elements.agenda.append(item);
  }
}

async function loadCalendar() {
  const id = ++requestId;
  try {
    const response = await fetch("/api/events");
    if (!response.ok) throw new Error(`Calendar request failed (HTTP ${response.status}).`);
    const data = await response.json();
    if (id !== requestId) return;
    events = data.events;
    const notices = [];
    if (!data.configured) notices.push("No calendar connected yet. Set CALENDAR_FILE or CALENDAR_URL before starting the app.");
    if (data.has_recurring_events) notices.push("Recurring events currently show only their original occurrence.");
    elements.notice.textContent = notices.join(" ");
    elements.notice.hidden = notices.length === 0;
    elements.notice.classList.remove("error");
  } catch (error) {
    if (id !== requestId) return;
    events = [];
    elements.notice.textContent = `Could not load your calendar. ${error.message} Check the calendar source and server logs.`;
    elements.notice.hidden = false;
    elements.notice.classList.add("error");
  }
  render();
}

async function loadActivity() {
  try {
    const response = await fetch("/api/current-activity");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const activity = await response.json();
    elements.activity.textContent = activity.activity;
    elements["activity-tag"].textContent = `${activity.tag} · Your current activity`;
    currentTag = activity.tag;
    elements.music.disabled = false;
  } catch (error) {
    elements.activity.textContent = "Activity unavailable";
    elements["activity-tag"].textContent = `Could not load activity (${error.message}).`;
    currentTag = null;
    elements.music.disabled = true;
  }
}

elements.prev.addEventListener("click", () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); render(); });
elements.next.addEventListener("click", () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); render(); });
elements.today.addEventListener("click", () => {
  const today = new Date();
  selected = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  month = new Date(selected.getFullYear(), selected.getMonth(), 1);
  render();
});
elements.music.addEventListener("click", async () => {
  elements.music.disabled = true;
  elements["music-status"].textContent = "Opening YouTube Music...";
  try {
    const response = await fetch("/api/trigger-media", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({tag: currentTag})
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    elements["music-status"].textContent = "YouTube Music search opened.";
  } catch (error) {
    elements["music-status"].textContent = `Could not open YouTube Music (${error.message}).`;
  } finally {
    elements.music.disabled = !currentTag;
  }
});

render();
loadCalendar();
loadActivity();
setInterval(() => { loadCalendar(); loadActivity(); }, 60000);
