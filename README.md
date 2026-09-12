# HOLD

**The Action Button is the key.** Software can propose. Only a press can commit.

HOLD is a presence OS for iPhone: every kit on the device feeds one physical button. Heartbeats, sealed places, Watch Mode, and Emergency SOS are invalid until the Action Button signs them.

This is a high-fidelity web simulation of a native UIKit / iOS 27 app — same product, same gestures, live sensors in the browser (geolocation, DeviceMotion, orientation, battery, vibration). Open it, bind the device, and treat the orange capsule on the left as the hardware Action Button.

## Gestures

| Action Button | What it commits |
| --- | --- |
| Single press | Heartbeat — signed presence at this fix |
| Double press | Seal a place — geofence at current location |
| Triple press | Emergency SOS — works while locked |
| Long press | Arm Watch Mode (dead-man's switch) |
| Shake (`S`) | Cancel a countdown |
| Side button | Lock (after Face ID enroll) |

Keyboard: **Space** = Action Button, **S** = shake.

## iOS 27 kits (live surfaces)

Not a list — each kit is a screen, widget, or sheet the Action Button can sign:

- **WeatherKit** — lock widget + hourly strip on Hold
- **MapKit / Core Location** — radar, tiles, sealed places
- **LocalAuthentication / Face ID** — unlocks the phone; never signs an action
- **Emergency SOS** — triple-press, satellite copy, locked
- **HealthKit Medical ID** — visible on lock without unlocking
- **Crash Detection** — press if you're OK
- **ActivityKit** — Dynamic Island + Watch live activity
- **Control Center** — grabber on lock: torch, Focus, kit tiles
- **WidgetKit / PassKit / UserNotifications** — sheets from Hold and ID

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints. First launch shows onboarding — press the Action Button to bind this device.

```bash
npm run build      # production
npm run typecheck  # TypeScript
```

## Stack

TanStack Start · React 19 · Tailwind v4 · Zustand (persisted locally) · Web Geolocation / DeviceMotion / Battery / Vibration.

No accounts. Presence lives on-device.

## Product rule

Face ID authenticates the *session*. The Action Button authenticates the *act*. If a control can fire without a press, it does not belong in HOLD.
