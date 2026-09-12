import {
  BatteryMedium,
  Bell,
  CloudSun,
  CreditCard,
  Fingerprint,
  Flashlight,
  HeartPulse,
  Moon,
  Siren,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatCoord,
  formatRelative,
  holdIdLabel,
  kindLabel,
} from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useSensors } from "@/lib/hold/sensors";
import { useWorld } from "@/lib/hold/world";
import { useNow } from "@/lib/hold/use-now";
import { BLOOD_TYPES } from "@/lib/hold/types";

export function SheetHost() {
  const sheet = useHold((s) => s.sheet);
  const close = useHold((s) => s.closeSheet);
  if (!sheet) return null;

  return (
    <div className="sheet-layer" role="dialog" aria-modal="true">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={close} />
      <div className="sheet-card">
        <div className="sheet-handle-row">
          <span className="cc-grabber-bar" />
          <button type="button" className="sheet-close" onClick={close} aria-label="Close sheet">
            <X className="size-4" />
          </button>
        </div>
        {sheet === "weather" ? <WeatherSheet /> : null}
        {sheet === "health" ? <HealthSheet /> : null}
        {sheet === "control" ? <ControlCenter /> : null}
        {sheet === "notify" ? <NotifySheet /> : null}
        {sheet === "pass" ? <PassSheet /> : null}
      </div>
    </div>
  );
}

function WeatherSheet() {
  const { weather, place } = useWorld();
  const { fix } = useSensors();
  return (
    <div>
      <p className="sheet-kicker">WeatherKit</p>
      <p className="sheet-title tabular-nums">{weather ? `${weather.tempC}°` : "—"}</p>
      <p className="sheet-sub">
        {weather?.label ?? "On-device model"}
        {place ? `  ·  ${place.locality}` : ""}
      </p>
      {weather?.severe ? (
        <p className="severe-banner">Severe conditions. Press to sign a weather heartbeat.</p>
      ) : null}
      <div className="hours" aria-label="Hourly forecast">
        {(weather?.hours ?? []).map((h, i) => (
          <div key={`${h.hour}-${i}`} className="hour">
            <p className="hour-t">{i === 0 ? "Now" : h.hour}</p>
            <p className="hour-v tabular-nums">{h.tempC}°</p>
          </div>
        ))}
      </div>
      <div className="grouped mt-4">
        <div className="grouped-row">
          <span className="grouped-k">Feels like</span>
          <span className="grouped-v">{weather ? `${weather.apparentC}°` : "—"}</span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">Wind</span>
          <span className="grouped-v">{weather ? `${weather.windKmh} km/h` : "—"}</span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">Humidity</span>
          <span className="grouped-v">{weather ? `${weather.humidity}%` : "—"}</span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">Source</span>
          <span className="grouped-v">{weather?.source === "weatherkit" ? "WeatherKit" : "Foundation Models"}</span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">Fix</span>
          <span className="grouped-v">{fix ? formatCoord(fix.lat, fix.lng) : "No fix"}</span>
        </div>
      </div>
    </div>
  );
}

function HealthSheet() {
  const now = useNow(1000);
  const medical = useHold((s) => s.medical);
  const draft = useHold((s) => s.medicalDraft);
  const setDraft = useHold((s) => s.setMedicalDraft);
  const propose = useHold((s) => s.propose);
  const pending = useHold((s) => s.pending);
  const locked = useHold((s) => s.locked);
  const { motion } = useSensors();
  return (
    <div>
      <p className="sheet-kicker">HealthKit</p>
      <p className="sheet-title">Medical ID</p>
      <p className="sheet-sub">Visible on the lock screen for first responders.</p>
      <div className="grouped mt-3">
        <div className="grouped-row">
          <span className="grouped-k">CoreMotion</span>
          <span className="grouped-v">{motion.toFixed(1)} m/s²</span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">Crash Detection</span>
          <span className="grouped-v">Armed</span>
        </div>
      </div>
      {locked ? (
        <div className="metal-card mt-4">
          <p className="m-0 text-lg font-semibold">{medical.name || "Unsigned"}</p>
          <p className="mt-1 mb-0 text-sm text-muted">
            Blood {medical.blood}
            {medical.allergies ? `  ·  ${medical.allergies}` : ""}
          </p>
          {medical.notes ? <p className="mt-3 mb-0 text-sm">{medical.notes}</p> : null}
          <p className="mt-3 mb-0 font-mono text-xs text-subtle">
            {medical.signedAt ? `Signed ${formatRelative(medical.signedAt, now)}` : "Unlock to edit · Action Button signs"}
          </p>
        </div>
      ) : (
        <>
          <input className="field mt-4" placeholder="Full name" value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} aria-label="Medical name" />
          <div className="chip-row mt-3">
            {BLOOD_TYPES.map((b) => (
              <button key={b} type="button" className={cn("chip", draft.blood === b && "chip-on")} onClick={() => setDraft({ blood: b })}>{b}</button>
            ))}
          </div>
          <input className="field mt-3" placeholder="Allergies" value={draft.allergies} onChange={(e) => setDraft({ allergies: e.target.value })} aria-label="Allergies" />
          <input className="field mt-3" placeholder="Notes for first responders" value={draft.notes} onChange={(e) => setDraft({ notes: e.target.value })} aria-label="Medical notes" />
          <button type="button" className="ghost-cta mt-4" onClick={() => propose({ type: "medical" }, "Press to sign Medical ID")}>
            {pending?.type === "medical" ? "Press to sign" : "Propose Medical ID"}
          </button>
        </>
      )}
    </div>
  );
}

function ControlCenter() {
  const torch = useHold((s) => s.torch);
  const focus = useHold((s) => s.focus);
  const toggleTorch = useHold((s) => s.toggleTorch);
  const cycleFocus = useHold((s) => s.cycleFocus);
  const lock = useHold((s) => s.lock);
  const faceEnrolled = useHold((s) => s.faceEnrolled);
  const openSheet = useHold((s) => s.openSheet);
  const startCrash = useHold((s) => s.startCrash);
  const setTab = useHold((s) => s.setTab);
  const { battery, charging, health } = useSensors();
  const { weather, place } = useWorld();
  return (
    <div>
      <p className="sheet-kicker">Control Center</p>
      <p className="sheet-title">Kits</p>
      <p className="sheet-sub">iOS 27 Controls. SOS still needs the Action Button.</p>
      <div className="cc-grid mt-4">
        <button type="button" className={cn("cc-tile", torch && "cc-tile-on")} onClick={toggleTorch}><Flashlight className="size-5" /><span>Torch</span></button>
        <button type="button" className={cn("cc-tile", focus !== "off" && "cc-tile-on")} onClick={cycleFocus}><Moon className="size-5" /><span>{focus === "off" ? "Focus" : focus === "sleep" ? "Sleep" : "Work"}</span></button>
        <button type="button" className="cc-tile" onClick={() => lock()} disabled={!faceEnrolled}><Fingerprint className="size-5" /><span>Lock</span></button>
        <button type="button" className="cc-tile" onClick={() => openSheet("weather")}><CloudSun className="size-5" /><span>{weather ? `${weather.tempC}°` : "Weather"}</span></button>
        <button type="button" className="cc-tile" onClick={() => openSheet("notify")}><Bell className="size-5" /><span>{health.notify === "granted" ? "Alerts on" : "Alerts"}</span></button>
        <button type="button" className="cc-tile" onClick={startCrash}><Siren className="size-5" /><span>Crash</span></button>
        <button type="button" className="cc-tile" onClick={() => setTab("sos")}><HeartPulse className="size-5" /><span>SOS</span></button>
        <button type="button" className="cc-tile" onClick={() => openSheet("pass")}><CreditCard className="size-5" /><span>Pass</span></button>
      </div>
      <div className="grouped mt-4">
        <div className="grouped-row"><BatteryMedium className="size-4 text-muted" /><span className="grouped-k">UIDevice</span><span className="grouped-v">{battery === null ? "—" : `${battery}%${charging ? "+" : ""}`}</span></div>
        <div className="grouped-row"><span className="grouped-k">Locality</span><span className="grouped-v">{place?.locality ?? "Waiting"}</span></div>
        <div className="grouped-row"><span className="grouped-k">SOS</span><span className="grouped-v">Triple-press</span></div>
      </div>
    </div>
  );
}

function NotifySheet() {
  const now = useNow(1000);
  const events = useHold((s) => s.events);
  const notifyOn = useHold((s) => s.notifyOn);
  const setNotifyOn = useHold((s) => s.setNotifyOn);
  const watchArmed = useHold((s) => s.watchArmed);
  const { health, requestAccess } = useSensors();
  const alerts = events.filter((e) => ["sos", "crash_ok", "weather_ack", "watch_arm", "biometric"].includes(e.kind));
  return (
    <div>
      <p className="sheet-kicker">UserNotifications</p>
      <p className="sheet-title">Alerts</p>
      <p className="sheet-sub">Watch due, weather, crash, and SOS land here.</p>
      <div className="grouped mt-4">
        <button type="button" className="grouped-row" onClick={() => void requestAccess()}><span className="grouped-k">Permission</span><span className="grouped-v">{health.notify}</span></button>
        <button type="button" className="grouped-row" onClick={() => setNotifyOn(!notifyOn)}><span className="grouped-k">HOLD alerts</span><span className="grouped-v">{notifyOn ? "On" : "Off"}</span></button>
        <div className="grouped-row"><span className="grouped-k">Live Activity</span><span className="grouped-v">{watchArmed ? "Armed" : "Idle"}</span></div>
      </div>
      <p className="section-label mt-5">Inbox</p>
      {alerts.length === 0 ? <p className="m-0 text-sm text-muted">No kit alerts yet.</p> : (
        <div className="grouped">
          {alerts.slice(0, 8).map((e) => (
            <div key={e.id} className="grouped-row"><span className="grouped-k">{kindLabel(e.kind)}</span><span className="grouped-v">{formatRelative(e.at, now)}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

function PassSheet() {
  const deviceId = useHold((s) => s.deviceId);
  const faceEnrolled = useHold((s) => s.faceEnrolled);
  const medical = useHold((s) => s.medical);
  const { weather, place } = useWorld();
  return (
    <div>
      <p className="sheet-kicker">PassKit</p>
      <p className="sheet-title">HOLD Pass</p>
      <p className="sheet-sub">Vendor credential. Signed by Face ID and the Action Button.</p>
      <div className="hold-pass mt-4">
        <p className="m-0 text-xs font-medium tracking-[0.18em] text-subtle uppercase">HOLD</p>
        <p className="mt-3 mb-1 font-mono text-xl tracking-wide">{holdIdLabel(deviceId)}</p>
        <p className="m-0 text-sm text-muted">{place?.locality ?? "Unlocated"}{weather ? `  ·  ${weather.tempC}°` : ""}</p>
        <div className="mt-5 flex justify-between text-xs text-subtle">
          <span>Face ID {faceEnrolled ? "enrolled" : "open"}</span>
          <span>Medical {medical.signedAt ? medical.blood : "unsigned"}</span>
        </div>
      </div>
    </div>
  );
}
