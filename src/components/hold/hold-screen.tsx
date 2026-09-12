import {
  Bell,
  CloudSun,
  CreditCard,
  Fingerprint,
  HeartPulse,
  MapPinned,
  Siren,
  Clock3,
} from "lucide-react";
import {
  formatCoord,
  formatRelative,
  holdIdLabel,
  kindLabel,
  situationLine,
} from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useSensors } from "@/lib/hold/sensors";
import { useNow } from "@/lib/hold/use-now";
import { useWorld } from "@/lib/hold/world";
import { MapKitView } from "./map-kit";

export function HoldScreen() {
  const now = useNow(1000);
  const { fix, battery, charging, motion } = useSensors();
  const { weather, place } = useWorld();
  const events = useHold((s) => s.events);
  const places = useHold((s) => s.places);
  const deviceId = useHold((s) => s.deviceId);
  const watchArmed = useHold((s) => s.watchArmed);
  const faceEnrolled = useHold((s) => s.faceEnrolled);
  const medical = useHold((s) => s.medical);
  const openSheet = useHold((s) => s.openSheet);
  const setTab = useHold((s) => s.setTab);
  const lock = useHold((s) => s.lock);
  const last = events[0];

  return (
    <div className="screen-scroll">
      <h1 className="large-title">Hold</h1>
      <p className="subhead">
        {situationLine({
          weather: weather?.label ?? null,
          temp: weather?.tempC ?? null,
          locality: place?.locality ?? null,
          motion,
          watchArmed,
        })}
      </p>

      <button
        type="button"
        className="kit-hero"
        onClick={() => openSheet("weather")}
        aria-label="Open WeatherKit"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] text-subtle uppercase">
              <CloudSun className="size-3.5" />
              WeatherKit
            </p>
            <p className="mt-2 mb-0 text-4xl font-semibold tracking-tight tabular-nums">
              {weather ? `${weather.tempC}°` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="m-0 text-sm font-medium">{weather?.label ?? "Model"}</p>
            <p className="mt-1 mb-0 text-xs text-muted">
              {place?.locality ?? "CoreLocation"}
              {weather ? `  ·  ${weather.windKmh} km/h` : ""}
            </p>
          </div>
        </div>
        {weather?.hours?.length ? (
          <div className="hours hours-in">
            {weather.hours.map((h, i) => (
              <div key={`${h.hour}-${i}`} className="hour">
                <p className="hour-t">{i === 0 ? "Now" : h.hour}</p>
                <p className="hour-v tabular-nums">{h.tempC}°</p>
              </div>
            ))}
          </div>
        ) : null}
      </button>

      <div className="kit-grid">
        <button type="button" className="kit-tile kit-tile-map" onClick={() => setTab("map")} aria-label="Open MapKit">
          <p className="kit-k"><MapPinned className="size-3.5" /> MapKit</p>
          <div className="kit-map"><MapKitView fix={fix} places={places} compact /></div>
        </button>
        <button type="button" className="kit-tile" onClick={() => openSheet("health")} aria-label="Open HealthKit">
          <p className="kit-k"><HeartPulse className="size-3.5" /> HealthKit</p>
          <p className="kit-v">{medical.signedAt ? medical.blood : "Unsigned"}</p>
          <p className="kit-s">{medical.name || "Medical ID"}</p>
        </button>
        <button type="button" className="kit-tile" onClick={() => setTab("sos")} aria-label="Open Emergency SOS">
          <p className="kit-k"><Siren className="size-3.5" /> Emergency</p>
          <p className="kit-v">SOS</p>
          <p className="kit-s">Triple-press · satellite</p>
        </button>
        <button type="button" className="kit-tile" onClick={() => (faceEnrolled ? lock() : openSheet("control"))} aria-label="Face ID">
          <p className="kit-k"><Fingerprint className="size-3.5" /> Face ID</p>
          <p className="kit-v">{faceEnrolled ? "Enrolled" : "Open"}</p>
          <p className="kit-s">LocalAuthentication</p>
        </button>
        <button type="button" className="kit-tile" onClick={() => setTab("watch")} aria-label="Open Watch">
          <p className="kit-k"><Clock3 className="size-3.5" /> ActivityKit</p>
          <p className="kit-v">{watchArmed ? "Armed" : "Idle"}</p>
          <p className="kit-s">Live Activity</p>
        </button>
        <button type="button" className="kit-tile" onClick={() => openSheet("notify")} aria-label="Open notifications">
          <p className="kit-k"><Bell className="size-3.5" /> Alerts</p>
          <p className="kit-v">Inbox</p>
          <p className="kit-s">UserNotifications</p>
        </button>
        <button type="button" className="kit-tile" onClick={() => openSheet("pass")} aria-label="Open HOLD pass">
          <p className="kit-k"><CreditCard className="size-3.5" /> PassKit</p>
          <p className="kit-v">{holdIdLabel(deviceId).slice(0, 10)}</p>
          <p className="kit-s">Vendor pass</p>
        </button>
        <button type="button" className="kit-tile" onClick={() => openSheet("control")} aria-label="Open Control Center">
          <p className="kit-k">Controls</p>
          <p className="kit-v">Center</p>
          <p className="kit-s">Torch · Focus · Crash</p>
        </button>
      </div>

      <div className="metal-card mt-4">
        <p className="m-0 text-xs font-medium tracking-[0.16em] text-subtle uppercase">Last attestation</p>
        {last ? (
          <>
            <p className="mt-2 mb-1 text-lg font-semibold tracking-tight">{kindLabel(last.kind)}</p>
            <p className="m-0 text-sm text-muted">{formatRelative(last.at, now)}</p>
            {last.lat !== null && last.lng !== null ? (
              <p className="mt-3 mb-0 font-mono text-xs text-muted">{formatCoord(last.lat, last.lng)}</p>
            ) : (
              <p className="mt-3 mb-0 text-xs text-muted">Unsigned location</p>
            )}
            <p className="mt-2 mb-0 text-sm text-fg">{[last.note, last.locality, last.weather].filter(Boolean).join(" · ")}</p>
          </>
        ) : (
          <p className="mt-2 mb-0 text-sm text-muted">Press the Action Button to sign a heartbeat.</p>
        )}
        <p className="mt-4 mb-0 font-mono text-xs text-subtle">
          {holdIdLabel(deviceId)}
          {battery !== null ? `  ·  ${battery}%${charging ? "+" : ""}` : ""}
        </p>
      </div>
    </div>
  );
}
