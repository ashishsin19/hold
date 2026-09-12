import type { TabId } from "./types";
import type { SheetId } from "./types";

export type KitStatus = "live" | "ready" | "denied" | "wait";

export type KitAction =
  | { type: "sheet"; id: SheetId }
  | { type: "tab"; id: TabId }
  | { type: "lock" }
  | { type: "none" };

export type KitRow = {
  id: string;
  name: string;
  role: string;
  status: KitStatus;
  action: KitAction;
};

export function kitRows(input: {
  location: boolean;
  motion: boolean;
  compass: boolean;
  weather: boolean;
  map: boolean;
  face: boolean;
  notify: boolean;
  haptics: boolean;
  battery: boolean;
  medical: boolean;
}): KitRow[] {
  return [
    { id: "uikit", name: "UIKit", role: "Chrome, tabs, sheets", status: "live", action: { type: "none" } },
    {
      id: "swiftui",
      name: "SwiftUI",
      role: "Liquid Glass lock + Control Center",
      status: "live",
      action: { type: "sheet", id: "control" },
    },
    {
      id: "localauth",
      name: "LocalAuthentication",
      role: "Face ID lock",
      status: input.face ? "live" : "wait",
      action: { type: "lock" },
    },
    {
      id: "corelocation",
      name: "CoreLocation",
      role: "Fix, heading, geofence",
      status: input.location ? "live" : "denied",
      action: { type: "tab", id: "map" },
    },
    {
      id: "mapkit",
      name: "MapKit",
      role: "Places, flyover-style map",
      status: input.map ? "live" : "wait",
      action: { type: "tab", id: "map" },
    },
    {
      id: "weatherkit",
      name: "WeatherKit",
      role: "Signed into every heartbeat",
      status: input.weather ? "live" : "wait",
      action: { type: "sheet", id: "weather" },
    },
    {
      id: "coremotion",
      name: "CoreMotion",
      role: "Shake cancel, crash detect",
      status: input.motion ? "live" : "denied",
      action: { type: "tab", id: "sos" },
    },
    {
      id: "healthkit",
      name: "HealthKit",
      role: "Medical ID",
      status: input.medical ? "live" : "ready",
      action: { type: "sheet", id: "health" },
    },
    {
      id: "emergency",
      name: "Emergency SOS",
      role: "Triple-press, crash, satellite",
      status: "ready",
      action: { type: "tab", id: "sos" },
    },
    {
      id: "haptics",
      name: "CoreHaptics",
      role: "Press feedback",
      status: input.haptics ? "live" : "denied",
      action: { type: "none" },
    },
    {
      id: "notify",
      name: "UserNotifications",
      role: "Watch due, weather",
      status: input.notify ? "live" : "wait",
      action: { type: "sheet", id: "notify" },
    },
    {
      id: "activity",
      name: "ActivityKit",
      role: "Dynamic Island, lock widgets",
      status: "live",
      action: { type: "tab", id: "watch" },
    },
    {
      id: "intents",
      name: "AppIntents",
      role: "Action Button gestures",
      status: "live",
      action: { type: "none" },
    },
    {
      id: "widget",
      name: "WidgetKit",
      role: "Lock screen weather + HOLD",
      status: "live",
      action: { type: "lock" },
    },
    {
      id: "contacts",
      name: "Contacts",
      role: "Circle / ICE",
      status: "ready",
      action: { type: "tab", id: "id" },
    },
    {
      id: "compass",
      name: "CoreLocation heading",
      role: "True north radar",
      status: input.compass ? "live" : "wait",
      action: { type: "tab", id: "map" },
    },
    {
      id: "battery",
      name: "UIDevice",
      role: "Battery signed on press",
      status: input.battery ? "live" : "wait",
      action: { type: "sheet", id: "control" },
    },
    {
      id: "passkit",
      name: "PassKit",
      role: "HOLD credential",
      status: "live",
      action: { type: "sheet", id: "pass" },
    },
    {
      id: "focus",
      name: "Focus",
      role: "Sleep / Work from Control Center",
      status: "ready",
      action: { type: "sheet", id: "control" },
    },
    {
      id: "foundation",
      name: "Foundation Models",
      role: "On-device situation line",
      status: "live",
      action: { type: "tab", id: "hold" },
    },
  ];
}

export function dispatchKit(row: KitRow, ops: {
  openSheet: (id: SheetId) => void;
  setTab: (id: TabId) => void;
  lock: () => void;
}) {
  if (row.action.type === "sheet") ops.openSheet(row.action.id);
  else if (row.action.type === "tab") ops.setTab(row.action.id);
  else if (row.action.type === "lock") ops.lock();
}
