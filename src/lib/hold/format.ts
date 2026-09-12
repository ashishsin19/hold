export function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}   ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

export function formatRelative(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 8) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm)}:${String(ss).padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatClock(now: number): string {
  return new Date(now).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(now: number): string {
  return new Date(now).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function holdIdLabel(id: string): string {
  return `HOLD-${shortId(id)}`;
}

export function haversineM(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function kindLabel(kind: string): string {
  switch (kind) {
    case "heartbeat":
      return "Heartbeat";
    case "place":
      return "Place sealed";
    case "sos":
      return "SOS";
    case "watch_arm":
      return "Watch armed";
    case "watch_disarm":
      return "Watch disarmed";
    case "confirm":
      return "Confirmed";
    case "crash_ok":
      return "I'm OK";
    case "weather_ack":
      return "Weather signed";
    case "medical":
      return "Medical ID";
    case "biometric":
      return "Face ID";
    default:
      return kind;
  }
}

export function situationLine(input: {
  weather: string | null;
  temp: number | null;
  locality: string | null;
  motion: number;
  watchArmed: boolean;
}): string {
  const bits: string[] = [];
  if (input.weather && input.temp !== null) {
    bits.push(`${input.weather}, ${input.temp}°`);
  }
  if (input.locality) bits.push(input.locality);
  bits.push(input.motion < 1.2 ? "Still" : "In motion");
  bits.push(input.watchArmed ? "Watch armed" : "Watch idle");
  return bits.join(" · ");
}
