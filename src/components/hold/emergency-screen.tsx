import { formatRelative } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useNow } from "@/lib/hold/use-now";
import { useSensors } from "@/lib/hold/sensors";
import { BLOOD_TYPES } from "@/lib/hold/types";
import { cn } from "@/lib/cn";
import { LogList } from "./log-screen";

export function EmergencyScreen() {
  const now = useNow(1000);
  const medical = useHold((s) => s.medical);
  const draft = useHold((s) => s.medicalDraft);
  const setDraft = useHold((s) => s.setMedicalDraft);
  const propose = useHold((s) => s.propose);
  const pending = useHold((s) => s.pending);
  const contacts = useHold((s) => s.contacts);
  const startCrash = useHold((s) => s.startCrash);
  const openSheet = useHold((s) => s.openSheet);
  const { simulateCrash, motion, health } = useSensors();

  return (
    <div className="screen-scroll">
      <h1 className="large-title">Emergency</h1>
      <p className="subhead">
        Emergency SOS, Crash Detection, satellite, and HealthKit Medical ID.
        Software can only propose. A press signs.
      </p>

      <div className="sos-hero">
        <p className="m-0 text-xs font-medium tracking-[0.16em] uppercase text-danger">
          Emergency SOS
        </p>
        <p className="mt-2 mb-1 text-2xl font-semibold tracking-tight">Triple-press</p>
        <p className="m-0 text-sm text-muted">
          Works while locked. Shake cancels the countdown. Long-press clears a live SOS.
        </p>
      </div>

      <div className="grouped mt-3">
        <div className="grouped-row">
          <span className="grouped-k">Satellite SOS</span>
          <span className="grouped-v">Ready · no tower</span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">Crash Detection</span>
          <span className="grouped-v">
            {health.motion === "denied" ? "Motion denied" : "CoreMotion armed"}
          </span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">Impact now</span>
          <span className="grouped-v">{motion.toFixed(1)} m/s²</span>
        </div>
        <div className="grouped-row">
          <span className="grouped-k">ICE circle</span>
          <span className="grouped-v">
            {contacts.length === 0 ? "None" : `${contacts.length}`}
          </span>
        </div>
        <button type="button" className="grouped-row" onClick={simulateCrash}>
          <span className="grouped-k">Simulate crash</span>
          <span className="grouped-v">CoreMotion</span>
        </button>
        <button type="button" className="grouped-row" onClick={startCrash}>
          <span className="grouped-k">Run crash countdown</span>
          <span className="grouped-v">8s</span>
        </button>
      </div>

      <div className="metal-card mt-5">
        <p className="m-0 text-xs font-medium tracking-[0.16em] text-subtle uppercase">
          Medical ID
        </p>
        <input
          className="field mt-3"
          placeholder="Full name"
          value={draft.name}
          onChange={(e) => setDraft({ name: e.target.value })}
          aria-label="Medical name"
        />
        <div className="chip-row mt-3">
          {BLOOD_TYPES.map((b) => (
            <button
              key={b}
              type="button"
              className={cn("chip", draft.blood === b && "chip-on")}
              onClick={() => setDraft({ blood: b })}
            >
              {b}
            </button>
          ))}
        </div>
        <input
          className="field mt-3"
          placeholder="Allergies"
          value={draft.allergies}
          onChange={(e) => setDraft({ allergies: e.target.value })}
          aria-label="Allergies"
        />
        <input
          className="field mt-3"
          placeholder="Notes for first responders"
          value={draft.notes}
          onChange={(e) => setDraft({ notes: e.target.value })}
          aria-label="Medical notes"
        />
        <button
          type="button"
          className="ghost-cta mt-4"
          onClick={() => propose({ type: "medical" }, "Press to sign Medical ID")}
        >
          {pending?.type === "medical" ? "Press to sign" : "Propose Medical ID"}
        </button>
        <p className="mt-3 mb-0 font-mono text-xs text-subtle">
          {medical.signedAt
            ? `Signed ${formatRelative(medical.signedAt, now)}`
            : "Unsigned — not visible on the lock screen"}
        </p>
        <button type="button" className="ghost-cta mt-3" onClick={() => openSheet("health")}>
          Open HealthKit
        </button>
      </div>

      <div className="section-block pb-6">
        <p className="section-label">Incidents</p>
        <LogList />
      </div>
    </div>
  );
}
