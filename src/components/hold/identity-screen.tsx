import { holdIdLabel } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useSensors } from "@/lib/hold/sensors";
import { useWorld } from "@/lib/hold/world";
import { LAB_FIX } from "@/lib/hold/types";
import { dispatchKit, kitRows } from "@/lib/hold/kits";
import { cn } from "@/lib/cn";

export function IdentityScreen() {
  const deviceId = useHold((s) => s.deviceId);
  const contacts = useHold((s) => s.contacts);
  const draftName = useHold((s) => s.contactDraftName);
  const draftRole = useHold((s) => s.contactDraftRole);
  const setDraft = useHold((s) => s.setContactDraft);
  const propose = useHold((s) => s.propose);
  const pending = useHold((s) => s.pending);
  const labEnabled = useHold((s) => s.labEnabled);
  const setLabEnabled = useHold((s) => s.setLabEnabled);
  const lock = useHold((s) => s.lock);
  const faceEnrolled = useHold((s) => s.faceEnrolled);
  const medical = useHold((s) => s.medical);
  const openSheet = useHold((s) => s.openSheet);
  const setTab = useHold((s) => s.setTab);
  const {
    health,
    requestAccess,
    simulateShake,
    simulateCrash,
    battery,
    fix,
    heading,
  } = useSensors();
  const { weather, place } = useWorld();

  const kits = kitRows({
    location: Boolean(fix),
    motion: health.motion === "granted",
    compass: heading !== null,
    weather: Boolean(weather),
    map: Boolean(fix),
    face: faceEnrolled,
    notify: health.notify === "granted",
    haptics: health.vibrate,
    battery: battery !== null,
    medical: Boolean(medical.signedAt),
  });

  return (
    <div className="screen-scroll">
      <h1 className="large-title">Identity</h1>
      <p className="subhead">Tap a kit to open it. The Action Button still commits.</p>

      <button type="button" className="metal-card w-full text-left" onClick={() => openSheet("pass")}>
        <p className="m-0 text-xs font-medium tracking-[0.16em] text-subtle uppercase">
          Vendor ID · PassKit
        </p>
        <p className="mt-3 mb-1 font-mono text-xl tracking-wide">{holdIdLabel(deviceId)}</p>
        <p className="m-0 break-all font-mono text-xs text-subtle">{deviceId}</p>
        <p className="mt-4 mb-0 text-sm text-muted">
          {place?.locality ?? "Awaiting locality"}
          {weather ? `  ·  ${weather.tempC}° ${weather.label}` : ""}
        </p>
      </button>

      <div className="section-block">
        <p className="section-label">iOS 27 kits</p>
        <div className="grouped">
          {kits.map((k) => (
            <button
              key={k.id}
              type="button"
              className="grouped-row"
              onClick={() => dispatchKit(k, { openSheet, setTab, lock })}
            >
              <span
                className={
                  k.status === "live"
                    ? "sensor-dot sensor-ok"
                    : k.status === "denied"
                      ? "sensor-dot sensor-bad"
                      : k.status === "ready"
                        ? "sensor-dot"
                        : "sensor-dot sensor-wait"
                }
              />
              <span className="grouped-k">
                {k.name}
                <span className="mt-0.5 block text-xs font-normal text-muted">{k.role}</span>
              </span>
              <span className="grouped-v">{k.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section-block">
        <p className="section-label">Permissions</p>
        <div className="grouped">
          <button type="button" className="grouped-row" onClick={() => void requestAccess()}>
            <span className="grouped-k">Location</span>
            <span className="grouped-v">{health.location}</span>
          </button>
          <button type="button" className="grouped-row" onClick={() => void requestAccess()}>
            <span className="grouped-k">Motion / crash</span>
            <span className="grouped-v">{health.motion}</span>
          </button>
          <button type="button" className="grouped-row" onClick={() => void requestAccess()}>
            <span className="grouped-k">Compass</span>
            <span className="grouped-v">{health.orientation}</span>
          </button>
          <button type="button" className="grouped-row" onClick={() => void requestAccess()}>
            <span className="grouped-k">Notifications</span>
            <span className="grouped-v">{health.notify}</span>
          </button>
          <div className="grouped-row">
            <span className="grouped-k">Haptics</span>
            <span className="grouped-v">{health.vibrate ? "ready" : "none"}</span>
          </div>
          <div className="grouped-row">
            <span className="grouped-k">Battery</span>
            <span className="grouped-v">{battery === null ? "—" : `${battery}%`}</span>
          </div>
        </div>
      </div>

      <div className="section-block">
        <p className="section-label">Circle / Contacts</p>
        <p className="mb-3 ml-1 text-sm text-muted">ICE names. Adding someone still needs a press.</p>
        <div className="mb-3 flex gap-2">
          <input className="field" placeholder="Name" value={draftName} onChange={(e) => setDraft(e.target.value, draftRole)} aria-label="Contact name" />
          <input className="field max-w-28" placeholder="Role" value={draftRole} onChange={(e) => setDraft(draftName, e.target.value)} aria-label="Contact role" />
        </div>
        <button
          type="button"
          className="ghost-cta"
          disabled={!draftName.trim()}
          onClick={() => {
            const name = draftName.trim();
            if (!name) return;
            propose({ type: "add_contact", name, role: draftRole.trim() || "Circle" }, `Press to add ${name}`);
          }}
        >
          Propose add
        </button>
        {contacts.length > 0 ? (
          <div className="grouped mt-3">
            {contacts.map((c) => (
              <div key={c.id} className="grouped-row">
                <span className="grouped-k">{c.name}</span>
                <span className="grouped-v">{c.role}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="section-block">
        <p className="section-label">Lab</p>
        <div className="grouped">
          <button type="button" className="grouped-row" onClick={() => setLabEnabled(!labEnabled)}>
            <span className="grouped-k">Lab location</span>
            <span className={cn("grouped-v", labEnabled && "text-fg")}>{labEnabled ? LAB_FIX.label : "Off"}</span>
          </button>
          <button type="button" className="grouped-row" onClick={simulateShake}>
            <span className="grouped-k">Simulate shake</span>
            <span className="grouped-v">S</span>
          </button>
          <button type="button" className="grouped-row" onClick={simulateCrash}>
            <span className="grouped-k">Simulate crash</span>
            <span className="grouped-v">CoreMotion</span>
          </button>
        </div>
      </div>

      <div className="section-block">
        <p className="section-label">Danger zone</p>
        <div className="grouped">
          <button type="button" className="grouped-row" onClick={() => propose({ type: "reset" }, "Press to unbind this device")}>
            <span className="grouped-k text-danger">Unbind device</span>
            <span className="grouped-v">{pending?.type === "reset" ? "Press to confirm" : "Requires press"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
