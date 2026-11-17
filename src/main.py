from urllib.parse import quote, urlencode
import webbrowser
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.calendar_sync import create_calendar_sync


app = FastAPI(title="Calendar Song Sync API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:4173",
        "http://localhost:4173",
        "https://sebascerlop.github.io",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
calendar_sync = create_calendar_sync()
static_directory = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=static_directory), name="static")


class MediaRequest(BaseModel):
    tag: str = Field(min_length=1, max_length=100)


MEDIA_QUERIES = {
    "Coding": "focus instrumental coding music",
    "Workout": "high energy workout music",
    "Meeting": "calm professional focus music",
    "Relax": "calming ambient relaxation music",
    "Other": "music discovery mix",
}


@app.get("/", include_in_schema=False)
def dashboard() -> FileResponse:
    return FileResponse(static_directory / "index.html")


@app.get("/api/events")
def get_events() -> dict:
    """Return events from the configured calendar."""
    return calendar_sync.get_events()


@app.get("/api/current-activity")
def get_current_activity() -> dict[str, str]:
    """Return the active calendar event and its detected activity tag."""
    return calendar_sync.get_current_activity()


@app.post("/api/trigger-media")
def trigger_media(request: MediaRequest) -> dict[str, str]:
    """Open a YouTube Music search for the requested activity."""
    media_url = (
        "https://music.youtube.com/search?"
        + urlencode({"q": request.tag})
    )
    if not webbrowser.open(media_url):
        raise HTTPException(
            status_code=503,
            detail="Could not open YouTube Music in the system browser.",
        )

    return {
        "status": "success",
        "tag_received": request.tag,
        "media_url": media_url,
    }


@app.get("/api/recommendations")
def get_recommendations(tag: str = "Relax") -> dict:
    """Return privacy-friendly music search recommendations for an activity tag."""
    normalized_tag = tag if tag in MEDIA_QUERIES else "Other"
    query = MEDIA_QUERIES[normalized_tag]

    return {
        "tag": normalized_tag,
        "query": query,
        "providers": [
            {
                "name": "YouTube Music",
                "url": f"https://music.youtube.com/search?q={quote(query)}",
            },
            {
                "name": "Spotify",
                "url": f"https://open.spotify.com/search/{quote(query, safe='')}",
            },
            {
                "name": "Apple Music",
                "url": f"https://music.apple.com/us/search?term={quote(query)}",
            },
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="127.0.0.1", port=8000)
