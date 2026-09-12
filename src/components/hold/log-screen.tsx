import { formatCoord, formatRelative, kindLabel } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useNow } from "@/lib/hold/use-now";
import type { Attestation } from "@/lib/hold/types";

export function LogScreen() {
  return (
    <div className="screen-scroll">
      <h1 className="large-title">Log</h1>
      <p className="subhead">An immutable ledger of physical attestations.</p>
      <LogList />
    </div>
  );
}

export function LogList() {
  const now = useNow(1000);
  const events = useHold((s) => s.events);
  const places = useHold((s) => s.places);
  const groups = groupByDay(events);

  if (events.length === 0) {
    return (
      <div className="grouped">
        <div className="grouped-row">
          <span className="grouped-k text-muted">Nothing signed yet.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.label} className="section-block first:mt-0">
          <p className="section-label">{g.label}</p>
          <div className="grouped">
            {g.items.map((e) => {
              const place = e.placeId
                ? places.find((p) => p.id === e.placeId)
                : null;
              const extra = [e.locality, e.weather, place?.name].filter(Boolean);
              return (
                <div key={e.id} className="grouped-row">
                  <span className={pipClass(e.kind)} />
                  <span className="grouped-k">
                    {kindLabel(e.kind)}
                    <span className="mt-0.5 block text-xs font-normal text-muted">
                      {e.note ??
                        (e.lat !== null && e.lng !== null
                          ? formatCoord(e.lat, e.lng)
                          : "No fix")}
                      {extra.length ? ` · ${extra.join(" · ")}` : ""}
                    </span>
                  </span>
                  <span className="grouped-v">{formatRelative(e.at, now)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function pipClass(kind: Attestation["kind"]): string {
  if (kind === "sos") return "kind-pip kind-sos";
  if (kind === "watch_arm" || kind === "watch_disarm") return "kind-pip kind-watch";
  if (kind === "place") return "kind-pip kind-place";
  if (kind === "crash_ok" || kind === "weather_ack") return "kind-pip kind-watch";
  if (kind === "medical" || kind === "biometric") return "kind-pip";
  if (kind === "heartbeat" || kind === "confirm") return "kind-pip kind-ok";
  return "kind-pip";
}

function groupByDay(events: Attestation[]) {
  const map = new Map<string, Attestation[]>();
  for (const e of events) {
    const d = new Date(e.at);
    const label = d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const list = map.get(label) ?? [];
    list.push(e);
    map.set(label, list);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}
