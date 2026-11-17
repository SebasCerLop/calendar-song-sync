# Calendar Song Sync mobile app

This Expo project is the initial iOS and Android base for Calendar Song Sync.
It currently includes a native calendar dashboard layout with a selected day,
current-activity card, and agenda placeholder. The mobile app is separate from
the existing FastAPI dashboard and is ready to connect to its API in a later
phase.

## Run locally

From the repository root:

```powershell
cd mobile
npm start
```

Then scan the QR code with Expo Go, or use:

```powershell
npm run android
npm run ios
```

The iOS command requires macOS for a native simulator/build. Expo Go can be
used on a physical iOS device from Windows.

## Song of the Day

The base app includes a daily-track card with Play/Pause controls and a
background-playback audio mode. Set `EXPO_PUBLIC_DAILY_SONG_URL` before
starting Expo to replace the demo track:

```powershell
$env:EXPO_PUBLIC_DAILY_SONG_URL = "https://example.com/daily-song.mp3"
npm start
```

Use an audio source you are authorized to stream. The default URL is a demo
track and should be replaced before production use.

## Build for the web

```powershell
npm run build:web
npm run preview:web
```

The static export is written to `mobile/dist`. A GitHub Actions workflow at
`.github/workflows/deploy-mobile-web.yml` builds and publishes the web app
through GitHub Pages whenever `app-base` is pushed. Enable Pages in the
repository settings with **Source: GitHub Actions**. The initial public URL
will be based on the repository name unless a custom domain is configured.
