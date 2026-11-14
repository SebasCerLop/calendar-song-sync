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
