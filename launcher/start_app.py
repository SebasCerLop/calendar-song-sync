import sys
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

try:
    import uvicorn
except ImportError as exc:
    print(
        "Cannot start the app: dependencies are missing. "
        "Install them with .venv\\Scripts\\python.exe -m pip install -r requirements.txt.",
        file=sys.stderr,
    )
    raise SystemExit(1) from exc


APP_URL = "http://127.0.0.1:8000/"


class AppServer(uvicorn.Server):
    async def startup(self, sockets=None):
        await super().startup(sockets=sockets)
        if not self.started:
            return

        print(f"Calendar Song Sync is ready at {APP_URL}", flush=True)
        try:
            opened = webbrowser.open(APP_URL)
        except (OSError, webbrowser.Error) as exc:
            print(f"Could not open the browser: {exc}", file=sys.stderr, flush=True)
            return
        if not opened:
            print(
                f"Could not open the browser. Open {APP_URL} manually.",
                file=sys.stderr,
                flush=True,
            )


def main():
    config = uvicorn.Config("src.main:app", host="127.0.0.1", port=8000)
    AppServer(config).run()


if __name__ == "__main__":
    main()
