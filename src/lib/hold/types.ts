export type TabId = "hold" | "map" | "watch" | "sos" | "id";

export type SheetId = "weather" | "health" | "control" | "notify" | "pass";

export type FocusMode = "off" | "sleep" | "work";

export type PressKind =
  | "heartbeat"
  | "place"
  | "sos"
  | "watch_arm"
  | "watch_disarm"
  | "confirm"
  | "crash_ok"
  | "weather_ack"
  | "medical"
  | "biometric";

export type SosPhase = "idle" | "countdown" | "fired";
export type CrashPhase = "idle" | "countdown";
export type FacePhase = "idle" | "scanning" | "ok" | "fail";

export type PendingAction =
  | { type: "interval"; minutes: number }
  | { type: "delete_place"; id: string }
  | { type: "reset" }
  | { type: "add_contact"; name: string; role: string }
  | { type: "medical" };

export type ToastTone = "neutral" | "ok" | "warn" | "danger";

export type WeatherHour = {
  hour: string;
  tempC: number;
  code: number;
  label: string;
};

export type WeatherSnap = {
  tempC: number;
  apparentC: number;
  code: number;
  label: string;
  windKmh: number;
  humidity: number;
  isDay: boolean;
  severe: boolean;
  hours: WeatherHour[];
  source: "weatherkit" | "model";
};

export type Attestation = {
  id: string;
  kind: PressKind;
  at: number;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  battery: number | null;
  motion: number | null;
  deviceId: string;
  placeId: string | null;
  note: string | null;
  weather: string | null;
  locality: string | null;
};

export type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  savedAt: number;
  eventId: string;
};

export type Contact = {
  id: string;
  name: string;
  role: string;
};

export type MedicalId = {
  name: string;
  blood: string;
  allergies: string;
  notes: string;
  signedAt: number | null;
};

export type LiveFix = {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  at: number;
  source: "gps" | "lab";
};

export type SensorHealth = {
  location: "granted" | "denied" | "prompt" | "unavailable";
  motion: "granted" | "denied" | "prompt" | "unavailable";
  orientation: "granted" | "denied" | "prompt" | "unavailable";
  vibrate: boolean;
  battery: boolean;
  notify: "granted" | "denied" | "prompt" | "unavailable";
};

export const LAB_FIX = {
  lat: 51.4779,
  lng: -0.0015,
  label: "Greenwich Lab",
} as const;

export const WATCH_INTERVALS = [1, 5, 15, 30] as const;

export const SOS_MS = 5000;
export const CRASH_MS = 8000;
export const EVENT_CAP = 160;

export const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "—"] as const;

export const EMPTY_MEDICAL: MedicalId = {
  name: "",
  blood: "—",
  allergies: "",
  notes: "",
  signedAt: null,
};
