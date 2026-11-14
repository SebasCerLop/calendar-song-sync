# Calendar Song Sync app base

This folder is the Windows entry point for running and validating the app.
The implementation remains in the repository's `src/` folder; these scripts
do not copy or fork the application code.

## Build and validate

From the repository root, double-click `app-base\build_app.bat`, or run:

```powershell
app-base\build_app.bat
```

The build step installs the pinned Python dependencies, runs the Python tests,
and runs the JavaScript appearance tests and syntax checks when Node.js is
available.

## Run

After building, double-click `app-base\run_app.bat`. It starts the local
dashboard and opens `http://127.0.0.1:8000/` in the default browser. Keep the
window open while using the app and press Ctrl+C to stop it.
