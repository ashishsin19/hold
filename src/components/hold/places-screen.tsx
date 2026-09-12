import { formatCoord, formatDistance, haversineM } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useSensors } from "@/lib/hold/sensors";
import { useWorld } from "@/lib/hold/world";
import { cn } from "@/lib/cn";
import { MapKitView } from "./map-kit";
import { Radar } from "./radar";

export function PlacesScreen() {
  const places = useHold((s) => s.places);
  const sealing = useHold((s) => s.sealingPlace);
  const draft = useHold((s) => s.placeDraftName);
  const setDraft = useHold((s) => s.setPlaceDraftName);
  const cancel = useHold((s) => s.cancelSealPlace);
  const propose = useHold((s) => s.propose);
  const pending = useHold((s) => s.pending);
  const { fix, heading } = useSensors();
  const { place, weather } = useWorld();

  const sorted = [...places].sort((a, b) => {
    if (!fix) return b.savedAt - a.savedAt;
    return (
      haversineM(fix.lat, fix.lng, a.lat, a.lng) -
      haversineM(fix.lat, fix.lng, b.lat, b.lng)
    );
  });

  return (
    <div className="screen-scroll">
      <h1 className="large-title">Map</h1>
      <p className="subhead">
        MapKit + CoreLocation. Double-press to seal a geofence at this fix.
        {place ? ` ${place.locality}` : ""}
        {weather ? ` · ${weather.tempC}°` : ""}
        {heading !== null ? ` · ${Math.round(heading)}°` : ""}
      </p>

      <MapKitView fix={fix} places={places} />

      <Radar fix={fix} places={places} />

      {sealing ? (
        <div className="metal-card mb-4 mt-4">
          <p className="m-0 text-xs font-medium tracking-[0.16em] text-subtle uppercase">
            Sealing
          </p>
          <p className="mt-2 mb-3 font-mono text-xs text-muted">
            {fix ? formatCoord(fix.lat, fix.lng) : "No fix"}
            {place ? `  ·  ${place.locality}` : ""}
          </p>
          <input
            className="field"
            placeholder="Home, office, school…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            aria-label="Place name"
          />
          <p className="mt-3 mb-0 text-sm text-muted">
            Press the Action Button to seal this place.
          </p>
          <button type="button" className="ghost-cta mt-3" onClick={cancel}>
            Cancel
          </button>
        </div>
      ) : null}

      <div className="section-block">
        <p className="section-label">Geofences</p>
        {sorted.length === 0 && !sealing ? (
          <div className="metal-card">
            <p className="m-0 text-sm leading-normal text-muted">
              Stand somewhere that matters. Double-press the Action Button, name
              it, then press once more to seal.
            </p>
          </div>
        ) : (
          <div className="grouped">
            {sorted.map((p) => {
              const dist = fix ? haversineM(fix.lat, fix.lng, p.lat, p.lng) : null;
              const removing = pending?.type === "delete_place" && pending.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={cn("grouped-row", removing && "text-warn")}
                  onClick={() =>
                    propose(
                      { type: "delete_place", id: p.id },
                      `Press to remove ${p.name}`,
                    )
                  }
                >
                  <span className="grouped-k">
                    {p.name}
                    <span className="mt-0.5 block font-mono text-xs font-normal text-subtle">
                      {formatCoord(p.lat, p.lng)}
                    </span>
                  </span>
                  <span className="grouped-v">
                    {removing ? "Press to remove" : dist !== null ? formatDistance(dist) : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
