import type { LiveFix, Place } from "@/lib/hold/types";
import { cn } from "@/lib/cn";

const Z = 13;
const TILE = 256;
const SPAN = 2;

function frac(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y =
    ((1 - Math.log((1 + s) / (1 - s)) / (2 * Math.PI)) / 2) * n;
  return { x, y };
}

function tileUrl(x: number, y: number, z: number) {
  const host = ["a", "b", "c", "d"][(Math.abs(x + y) % 4) as 0 | 1 | 2 | 3];
  return `https://${host}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png`;
}

export function MapKitView({
  fix,
  places,
  compact = false,
}: {
  fix: LiveFix | null;
  places: Place[];
  compact?: boolean;
}) {
  if (!fix) {
    return (
      <div className={cn("map-frame", compact && "map-frame-mini")}>
        <p className="m-0 text-sm text-muted">MapKit waiting on a location fix</p>
      </div>
    );
  }

  const f = frac(fix.lat, fix.lng, Z);
  const ox = Math.floor(f.x) - SPAN;
  const oy = Math.floor(f.y) - SPAN;
  const dim = (SPAN * 2 + 1) * TILE;
  const toPx = (lat: number, lng: number) => {
    const p = frac(lat, lng, Z);
    return { left: (p.x - ox) * TILE, top: (p.y - oy) * TILE };
  };
  const you = toPx(fix.lat, fix.lng);

  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < SPAN * 2 + 1; y++) {
    for (let x = 0; x < SPAN * 2 + 1; x++) {
      tiles.push({ x: ox + x, y: oy + y });
    }
  }

  return (
    <div className={cn("map-frame", compact && "map-frame-mini")}>
      <div className="map-clip">
        <div
          className="map-plane"
          style={{
            width: dim,
            height: dim,
            left: "50%",
            top: "50%",
            marginLeft: -you.left,
            marginTop: -you.top,
          }}
        >
          {tiles.map((t) => (
            <img
              key={`${t.x}-${t.y}`}
              alt=""
              className="map-tile"
              style={{
                left: (t.x - ox) * TILE,
                top: (t.y - oy) * TILE,
                width: TILE,
                height: TILE,
              }}
              src={tileUrl(t.x, t.y, Z)}
              crossOrigin="anonymous"
            />
          ))}
          {places.map((p) => {
            const pt = toPx(p.lat, p.lng);
            return (
              <div
                key={p.id}
                className="map-pin"
                style={{ left: pt.left, top: pt.top }}
              >
                <span className="map-pin-dot" />
                {!compact ? <span className="map-pin-label">{p.name}</span> : null}
              </div>
            );
          })}
          <div className="map-you" style={{ left: you.left, top: you.top }}>
            <span className="map-you-ring" />
            <span className="map-you-dot" />
          </div>
        </div>
      </div>
      {!compact ? <p className="map-attr">MapKit  ·  OpenStreetMap, CARTO</p> : null}
    </div>
  );
}
