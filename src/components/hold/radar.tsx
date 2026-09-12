import { haversineM } from "@/lib/hold/format";
import type { LiveFix, Place } from "@/lib/hold/types";

const RANGE_M = 400;

function project(
  origin: LiveFix,
  lat: number,
  lng: number,
  heading: number | null,
  r: number,
) {
  const north = ((lat - origin.lat) * Math.PI) / 180 * 6371000;
  const east =
    ((lng - origin.lng) * Math.PI) / 180 * 6371000 * Math.cos((origin.lat * Math.PI) / 180);
  const h = ((heading ?? 0) * Math.PI) / 180;
  const x = east * Math.cos(h) - north * Math.sin(h);
  const y = east * Math.sin(h) + north * Math.cos(h);
  const scale = r / RANGE_M;
  return { x: x * scale, y: -y * scale };
}

export function Radar({
  fix,
  places,
}: {
  fix: LiveFix | null;
  places: Place[];
}) {
  const r = 108;
  const heading = fix?.heading ?? null;

  return (
    <div className="radar-wrap" aria-hidden="true">
      <svg viewBox="-120 -120 240 240" className="h-full w-full">
        <circle cx="0" cy="0" r="108" fill="#0c0d10" stroke="rgb(236 236 234 / 0.1)" />
        <circle cx="0" cy="0" r="72" fill="none" stroke="rgb(236 236 234 / 0.08)" />
        <circle cx="0" cy="0" r="36" fill="none" stroke="rgb(236 236 234 / 0.08)" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const inner = i % 3 === 0 ? 100 : 104;
          return (
            <line
              key={i}
              x1={Math.sin(a) * inner}
              y1={-Math.cos(a) * inner}
              x2={Math.sin(a) * 108}
              y2={-Math.cos(a) * 108}
              stroke="rgb(236 236 234 / 0.16)"
              strokeWidth={i % 3 === 0 ? 1.4 : 0.8}
            />
          );
        })}
        <polygon points="0,-100 3.2,-90 -3.2,-90" fill="#d4d7dc" />
        <text
          x="0"
          y="-88"
          textAnchor="middle"
          fill="#d4d7dc"
          fontSize="8"
          fontFamily="IBM Plex Mono, monospace"
        >
          {heading === null ? "N" : "HDG"}
        </text>
        {fix
          ? places.map((p) => {
              const d = haversineM(fix.lat, fix.lng, p.lat, p.lng);
              const { x, y } = project(fix, p.lat, p.lng, heading, r);
              const clamped = d > RANGE_M;
              const mag = Math.hypot(x, y) || 1;
              const cx = clamped ? (x / mag) * (r - 10) : x;
              const cy = clamped ? (y / mag) * (r - 10) : y;
              return (
                <g key={p.id}>
                  <circle cx={cx} cy={cy} r="4" fill="#ececea" />
                  <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fill="#8a8d94"
                    fontSize="7"
                    fontFamily="Instrument Sans, sans-serif"
                  >
                    {p.name.slice(0, 12)}
                  </text>
                </g>
              );
            })
          : null}
        <circle cx="0" cy="0" r="5" fill="#d4d7dc" />
        <circle cx="0" cy="0" r="10" fill="none" stroke="#d4d7dc" strokeOpacity="0.35" />
      </svg>
      {!fix ? (
        <div className="absolute inset-0 grid place-items-center">
          <p className="m-0 max-w-40 text-center text-sm text-muted">
            Awaiting a location fix
          </p>
        </div>
      ) : null}
    </div>
  );
}
