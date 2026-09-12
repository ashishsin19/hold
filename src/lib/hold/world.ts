import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WeatherHour, WeatherSnap } from "./types";
import { useSensors } from "./sensors";

export type PlaceName = {
  locality: string;
  region: string;
  country: string;
};

const WMO: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Severe storm",
};

function isSevere(code: number): boolean {
  return code === 65 || code === 75 || code === 82 || code >= 95;
}

export function weatherLabel(code: number): string {
  return WMO[code] ?? "Conditions";
}

function hourLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "numeric" });
}

function buildHours(
  startTemp: number,
  startCode: number,
  now = Date.now(),
): WeatherHour[] {
  const out: WeatherHour[] = [];
  for (let i = 0; i < 8; i++) {
    const t = new Date(now + i * 3600_000);
    const drift = Math.round(Math.sin(i / 2.2) * 2);
    out.push({
      hour: t.toLocaleTimeString(undefined, { hour: "numeric" }),
      tempC: startTemp + drift,
      code: startCode,
      label: weatherLabel(startCode),
    });
  }
  return out;
}

export function estimateWeather(lat: number, lng: number): WeatherSnap {
  const now = new Date();
  const month = now.getMonth();
  const abs = Math.abs(lat);
  const nh = lat >= 0 ? 1 : -1;
  const summer = Math.cos(((month - 6) / 12) * 2 * Math.PI);
  const tempC = Math.round(26 - abs * 0.32 + nh * summer * 9);
  const coastal = Math.abs(lng) % 1 > 0.2;
  const code = abs > 60 ? 71 : coastal ? 2 : 1;
  return {
    tempC,
    apparentC: tempC - 1,
    code,
    label: weatherLabel(code),
    windKmh: coastal ? 18 : 9,
    humidity: coastal ? 74 : 52,
    isDay: now.getHours() >= 6 && now.getHours() < 20,
    severe: false,
    hours: buildHours(tempC, code, now.getTime()),
    source: "model",
  };
}

function estimatePlace(lat: number, lng: number): PlaceName {
  if (Math.abs(lat - 51.478) < 0.05 && Math.abs(lng + 0.002) < 0.05) {
    return { locality: "Greenwich", region: "England", country: "United Kingdom" };
  }
  return {
    locality: `${lat >= 0 ? "N" : "S"} ${Math.abs(lat).toFixed(2)}°`,
    region: "",
    country: "",
  };
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherSnap | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}` +
    `&longitude=${lng.toFixed(4)}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,is_day` +
    `&hourly=temperature_2m,weather_code` +
    `&forecast_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    current?: {
      time?: string;
      temperature_2m: number;
      apparent_temperature: number;
      weather_code: number;
      wind_speed_10m: number;
      relative_humidity_2m: number;
      is_day: number;
    };
    hourly?: {
      time: string[];
      temperature_2m: number[];
      weather_code: number[];
    };
  };
  const c = data.current;
  if (!c) return null;
  const code = c.weather_code;
  let hours: WeatherHour[] = [];
  const hourly = data.hourly;
  if (hourly?.time?.length) {
    const mark = c.time ?? hourly.time[0];
    let idx = hourly.time.findIndex((t) => t >= mark);
    if (idx < 0) idx = 0;
    hours = hourly.time.slice(idx, idx + 8).map((t, i) => {
      const hCode = hourly.weather_code[idx + i] ?? code;
      return {
        hour: hourLabel(t),
        tempC: Math.round(hourly.temperature_2m[idx + i] ?? c.temperature_2m),
        code: hCode,
        label: weatherLabel(hCode),
      };
    });
  }
  if (hours.length === 0) {
    hours = buildHours(Math.round(c.temperature_2m), code);
  }
  return {
    tempC: Math.round(c.temperature_2m),
    apparentC: Math.round(c.apparent_temperature),
    code,
    label: weatherLabel(code),
    windKmh: Math.round(c.wind_speed_10m),
    humidity: Math.round(c.relative_humidity_2m),
    isDay: c.is_day === 1,
    severe: isSevere(code),
    hours,
    source: "weatherkit",
  };
}

async function fetchPlace(lat: number, lng: number): Promise<PlaceName | null> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}` +
    `&longitude=${lng}&localityLanguage=en`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  };
  const locality = data.city || data.locality || "Unknown";
  return {
    locality,
    region: data.principalSubdivision || "",
    country: data.countryName || "",
  };
}

type World = {
  weather: WeatherSnap | null;
  place: PlaceName | null;
};

const WorldContext = createContext<World>({ weather: null, place: null });

export function WorldProvider({ children }: { children: ReactNode }) {
  const { fix } = useSensors();
  const [weather, setWeather] = useState<WeatherSnap | null>(null);
  const [place, setPlace] = useState<PlaceName | null>(null);
  const keyRef = useRef("");

  const latlng = fix ? `${fix.lat.toFixed(3)},${fix.lng.toFixed(3)}` : "";

  useEffect(() => {
    if (!latlng) return;
    if (keyRef.current === latlng) return;
    keyRef.current = latlng;
    const [latS, lngS] = latlng.split(",");
    const lat = Number(latS);
    const lng = Number(lngS);
    setWeather(estimateWeather(lat, lng));
    setPlace(estimatePlace(lat, lng));
    let cancelled = false;
    void (async () => {
      try {
        const [w, p] = await Promise.all([fetchWeather(lat, lng), fetchPlace(lat, lng)]);
        if (cancelled) return;
        if (w) setWeather(w);
        if (p) setPlace(p);
      } catch {
        /* keep on-device estimate */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [latlng]);

  return createElement(WorldContext.Provider, { value: { weather, place } }, children);
}

export function useWorld(): World {
  return useContext(WorldContext);
}
