from urllib.parse import urlencode
import webbrowser

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from src.calendar_sync import create_calendar_sync


app = FastAPI(title="Calendar Song Sync API", version="1.0")
calendar_sync = create_calendar_sync()


class MediaRequest(BaseModel):
    tag: str = Field(min_length=1, max_length=100)


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="127.0.0.1", port=8000)
