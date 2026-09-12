import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Haptics } from "./haptics";
import { newId } from "./id";
import { haversineM } from "./format";
import {
  CRASH_MS,
  EMPTY_MEDICAL,
  EVENT_CAP,
  LAB_FIX,
  SOS_MS,
  type Attestation,
  type Contact,
  type CrashPhase,
  type FacePhase,
  type FocusMode,
  type LiveFix,
  type MedicalId,
  type PendingAction,
  type Place,
  type PressKind,
  type SheetId,
  type SosPhase,
  type TabId,
  type ToastTone,
  type WeatherSnap,
} from "./types";

export type Snapshot = {
  fix: LiveFix | null;
  battery: number | null;
  motion: number | null;
  weather: WeatherSnap | null;
  locality: string | null;
};

export type Toast = { id: string; text: string; tone: ToastTone };

type HoldState = {
  onboarded: boolean;
  deviceId: string;
  tab: TabId;
  events: Attestation[];
  places: Place[];
  contacts: Contact[];
  pending: PendingAction | null;
  toast: Toast | null;
  watchArmed: boolean;
  watchMinutes: number;
  lastCheckIn: number | null;
  watchDueAt: number | null;
  sosPhase: SosPhase;
  sosEndsAt: number | null;
  crashPhase: CrashPhase;
  crashEndsAt: number | null;
  sealingPlace: boolean;
  placeDraftName: string;
  contactDraftName: string;
  contactDraftRole: string;
  labEnabled: boolean;
  locked: boolean;
  faceEnrolled: boolean;
  facePhase: FacePhase;
  medical: MedicalId;
  medicalDraft: MedicalId;
  weatherAckAt: number | null;
  notifyOn: boolean;
  sheet: SheetId | null;
  torch: boolean;
  focus: FocusMode;
  setTab: (tab: TabId) => void;
  setLabEnabled: (on: boolean) => void;
  setNotifyOn: (on: boolean) => void;
  setMedicalDraft: (patch: Partial<MedicalId>) => void;
  openSheet: (sheet: SheetId) => void;
  closeSheet: () => void;
  toggleTorch: () => void;
  cycleFocus: () => void;
  lock: () => void;
  startFace: () => void;
  completeFace: (ok: boolean, snap: Snapshot) => void;
  bindIdentity: (snap: Snapshot) => void;
  heartbeat: (snap: Snapshot) => void;
  beginSealPlace: (snap: Snapshot) => void;
  setPlaceDraftName: (name: string) => void;
  cancelSealPlace: () => void;
  toggleWatch: (snap: Snapshot) => void;
  startSos: (snap: Snapshot) => void;
  cancelSos: () => void;
  clearSos: (snap: Snapshot) => void;
  fireSos: (snap: Snapshot) => void;
  startCrash: () => void;
  clearCrash: (snap: Snapshot) => void;
  expireCrash: (snap: Snapshot) => void;
  propose: (pending: PendingAction, prompt: string) => void;
  cancelPending: () => void;
  commitPending: (snap: Snapshot) => void;
  handlePress: (snap: Snapshot) => void;
  setContactDraft: (name: string, role: string) => void;
  flash: (text: string, tone?: ToastTone) => void;
};

function nearestPlace(places: Place[], lat: number, lng: number): Place | null {
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of places) {
    const d = haversineM(lat, lng, p.lat, p.lng);
    if (d <= p.radiusM && d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

function makeEvent(
  kind: PressKind,
  deviceId: string,
  snap: Snapshot,
  places: Place[],
  note: string | null,
): Attestation {
  const fix = snap.fix;
  const place = fix && kind !== "place" ? nearestPlace(places, fix.lat, fix.lng) : null;
  const weather = snap.weather != null ? `${snap.weather.label} ${snap.weather.tempC}°` : null;
  return {
    id: newId(),
    kind,
    at: Date.now(),
    lat: fix?.lat ?? null,
    lng: fix?.lng ?? null,
    accuracy: fix?.accuracy ?? null,
    heading: fix?.heading ?? null,
    speed: fix?.speed ?? null,
    battery: snap.battery,
    motion: snap.motion,
    deviceId,
    placeId: place?.id ?? null,
    note,
    weather,
    locality: snap.locality,
  };
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function coerceTab(tab: string): TabId {
  if (tab === "places") return "map";
  if (tab === "log") return "sos";
  if (tab === "hold" || tab === "map" || tab === "watch" || tab === "sos" || tab === "id") return tab;
  return "hold";
}

const FOCUS_CYCLE: FocusMode[] = ["off", "sleep", "work"];

export const useHold = create<HoldState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      deviceId: "",
      tab: "hold",
      events: [],
      places: [],
      contacts: [],
      pending: null,
      toast: null,
      watchArmed: false,
      watchMinutes: 5,
      lastCheckIn: null,
      watchDueAt: null,
      sosPhase: "idle",
      sosEndsAt: null,
      crashPhase: "idle",
      crashEndsAt: null,
      sealingPlace: false,
      placeDraftName: "",
      contactDraftName: "",
      contactDraftRole: "Circle",
      labEnabled: false,
      locked: false,
      faceEnrolled: false,
      facePhase: "idle",
      medical: EMPTY_MEDICAL,
      medicalDraft: EMPTY_MEDICAL,
      weatherAckAt: null,
      notifyOn: false,
      sheet: null,
      torch: false,
      focus: "off",

      setTab: (tab) => set({ tab: coerceTab(tab), sheet: null }),
      setLabEnabled: (on) => {
        set({ labEnabled: on });
        get().flash(on ? "Lab fix on \u00b7 Greenwich" : "Lab fix off", "neutral");
      },
      setNotifyOn: (on) => set({ notifyOn: on }),
      setMedicalDraft: (patch) => set({ medicalDraft: { ...get().medicalDraft, ...patch } }),
      openSheet: (sheet) => set({ sheet }),
      closeSheet: () => set({ sheet: null }),
      toggleTorch: () => {
        const on = !get().torch;
        set({ torch: on });
        Haptics.down();
        get().flash(on ? "Torch on" : "Torch off", "neutral");
      },
      cycleFocus: () => {
        const cur = get().focus;
        const next = FOCUS_CYCLE[(FOCUS_CYCLE.indexOf(cur) + 1) % FOCUS_CYCLE.length];
        set({ focus: next });
        Haptics.down();
        get().flash(next === "off" ? "Focus off" : next === "sleep" ? "Sleep Focus" : "Work Focus", "neutral");
      },
      lock: () => {
        if (!get().faceEnrolled) return;
        set({ locked: true, facePhase: "idle", sheet: null });
      },
      startFace: () => {
        if (get().facePhase === "scanning") return;
        set({ facePhase: "scanning" });
      },
      completeFace: (ok, snap) => {
        if (!ok) {
          Haptics.error();
          set({ facePhase: "fail" });
          window.setTimeout(() => {
            if (get().facePhase === "fail") set({ facePhase: "idle" });
          }, 900);
          return;
        }
        Haptics.success();
        const enrolled = get().faceEnrolled;
        if (!enrolled) {
          const event = makeEvent("biometric", get().deviceId, snap, get().places, "Face ID enrolled");
          set({
            faceEnrolled: true,
            locked: false,
            facePhase: "ok",
            events: [event, ...get().events].slice(0, EVENT_CAP),
          });
          get().flash("Face ID enrolled", "ok");
        } else {
          set({ locked: false, facePhase: "ok" });
          get().flash("Unlocked", "ok");
        }
        window.setTimeout(() => {
          if (get().facePhase === "ok") set({ facePhase: "idle" });
        }, 700);
      },
      flash: (text, tone = "neutral") => {
        if (toastTimer) clearTimeout(toastTimer);
        const toast = { id: newId(), text, tone };
        set({ toast });
        toastTimer = setTimeout(() => {
          set({ toast: null });
        }, 2800);
      },
      bindIdentity: (snap) => {
        const deviceId = newId();
        const useLab = !snap.fix;
        const boundSnap: Snapshot = useLab
          ? {
              ...snap,
              fix: {
                lat: LAB_FIX.lat,
                lng: LAB_FIX.lng,
                accuracy: 12,
                heading: null,
                speed: 0,
                at: Date.now(),
                source: "lab",
              },
            }
          : snap;
        const event = makeEvent("confirm", deviceId, boundSnap, [], "Device bound");
        Haptics.success();
        set({
          onboarded: true,
          deviceId,
          events: [event],
          lastCheckIn: Date.now(),
          tab: "hold",
          labEnabled: useLab || get().labEnabled,
          locked: true,
          faceEnrolled: false,
          facePhase: "idle",
          sheet: null,
        });
        get().flash("Device bound \u00b7 press to enroll Face ID", "ok");
      },
      heartbeat: (snap) => {
        const { deviceId, places, watchArmed, watchMinutes, weatherAckAt } = get();
        if (!snap.fix) {
          Haptics.error();
          get().flash("Location required to sign a heartbeat", "warn");
          return;
        }
        const place = nearestPlace(places, snap.fix.lat, snap.fix.lng);
        const severe = snap.weather?.severe ?? false;
        const needsWeather = severe && (weatherAckAt === null || Date.now() - weatherAckAt > 30 * 60_000);
        const event = makeEvent(
          needsWeather ? "weather_ack" : "heartbeat",
          deviceId,
          snap,
          places,
          place ? `At ${place.name}` : snap.locality ? `I'm here \u00b7 ${snap.locality}` : "I'm here",
        );
        const now = Date.now();
        Haptics.heartbeat();
        set({
          events: [event, ...get().events].slice(0, EVENT_CAP),
          lastCheckIn: now,
          watchDueAt: watchArmed ? now + watchMinutes * 60_000 : get().watchDueAt,
          pending: null,
          weatherAckAt: needsWeather ? now : weatherAckAt,
        });
        get().flash(
          needsWeather ? `Weather signed \u00b7 ${snap.weather?.label}` : place ? `Heartbeat \u00b7 ${place.name}` : "Heartbeat signed",
          needsWeather ? "warn" : "ok",
        );
      },
      beginSealPlace: (snap) => {
        if (!snap.fix) {
          Haptics.error();
          get().flash("Location required to seal a place", "warn");
          return;
        }
        Haptics.double();
        set({ sealingPlace: true, placeDraftName: "", tab: "map", pending: null, sheet: null });
        get().flash("Name it, then press to seal", "neutral");
      },
      setPlaceDraftName: (name) => set({ placeDraftName: name }),
      cancelSealPlace: () => set({ sealingPlace: false, placeDraftName: "" }),
      toggleWatch: (snap) => {
        const { watchArmed, deviceId, places, watchMinutes } = get();
        if (watchArmed) {
          const event = makeEvent("watch_disarm", deviceId, snap, places, "Watch disarmed");
          Haptics.long();
          set({
            watchArmed: false,
            watchDueAt: null,
            events: [event, ...get().events].slice(0, EVENT_CAP),
            pending: null,
            tab: "watch",
            sheet: null,
          });
          get().flash("Watch disarmed", "neutral");
          return;
        }
        const now = Date.now();
        const event = makeEvent("watch_arm", deviceId, snap, places, "Watch armed");
        Haptics.long();
        set({
          watchArmed: true,
          lastCheckIn: now,
          watchDueAt: now + watchMinutes * 60_000,
          events: [event, ...get().events].slice(0, EVENT_CAP),
          pending: null,
          tab: "watch",
          sheet: null,
        });
        get().flash(`Watch armed \u00b7 ${watchMinutes} min`, "ok");
      },
      startSos: (snap) => {
        if (get().sosPhase !== "idle") return;
        Haptics.triple();
        set({
          sosPhase: "countdown",
          sosEndsAt: Date.now() + SOS_MS,
          pending: null,
          crashPhase: "idle",
          crashEndsAt: null,
          sheet: null,
        });
        void snap;
      },
      cancelSos: () => {
        if (get().sosPhase !== "countdown") return;
        Haptics.cancel();
        set({ sosPhase: "idle", sosEndsAt: null });
        get().flash("SOS cancelled", "neutral");
      },
      fireSos: (snap) => {
        const { deviceId, places, contacts, medical } = get();
        const who =
          contacts.length === 0
            ? medical.name
              ? `Medical ID \u00b7 ${medical.name}`
              : "Logged locally \u00b7 add a circle to notify"
            : `Broadcast to ${contacts.length} in circle`;
        const event = makeEvent("sos", deviceId, snap, places, who);
        Haptics.triple();
        set({
          sosPhase: "fired",
          sosEndsAt: null,
          events: [event, ...get().events].slice(0, EVENT_CAP),
          tab: "sos",
          locked: false,
          sheet: null,
        });
      },
      clearSos: (snap) => {
        const event = makeEvent("confirm", get().deviceId, snap, get().places, "SOS cleared");
        Haptics.long();
        set({
          sosPhase: "idle",
          sosEndsAt: null,
          events: [event, ...get().events].slice(0, EVENT_CAP),
        });
        get().flash("SOS cleared", "ok");
      },
      startCrash: () => {
        if (get().sosPhase !== "idle") return;
        if (get().crashPhase !== "idle") return;
        Haptics.error();
        set({
          crashPhase: "countdown",
          crashEndsAt: Date.now() + CRASH_MS,
          tab: "sos",
          sheet: null,
        });
        get().flash("Possible crash \u00b7 press if you're OK", "danger");
      },
      clearCrash: (snap) => {
        if (get().crashPhase !== "countdown") return;
        const event = makeEvent("crash_ok", get().deviceId, snap, get().places, "I'm OK");
        Haptics.success();
        set({
          crashPhase: "idle",
          crashEndsAt: null,
          events: [event, ...get().events].slice(0, EVENT_CAP),
        });
        get().flash("I'm OK \u00b7 signed", "ok");
      },
      expireCrash: (snap) => {
        if (get().crashPhase !== "countdown") return;
        set({ crashPhase: "idle", crashEndsAt: null });
        get().startSos(snap);
      },
      propose: (pending, prompt) => {
        set({ pending });
        get().flash(prompt, "warn");
      },
      cancelPending: () => set({ pending: null }),
      commitPending: (snap) => {
        const { pending, deviceId, places } = get();
        if (!pending) return;
        if (pending.type === "interval") {
          const now = Date.now();
          const event = makeEvent("confirm", deviceId, snap, places, `Watch interval ${pending.minutes} min`);
          Haptics.success();
          set({
            watchMinutes: pending.minutes,
            watchDueAt: get().watchArmed ? now + pending.minutes * 60_000 : get().watchDueAt,
            pending: null,
            events: [event, ...get().events].slice(0, EVENT_CAP),
          });
          get().flash(`Interval set \u00b7 ${pending.minutes} min`, "ok");
          return;
        }
        if (pending.type === "delete_place") {
          const place = places.find((p) => p.id === pending.id);
          const event = makeEvent("confirm", deviceId, snap, places, place ? `Removed ${place.name}` : "Place removed");
          Haptics.success();
          set({
            places: places.filter((p) => p.id !== pending.id),
            pending: null,
            events: [event, ...get().events].slice(0, EVENT_CAP),
          });
          get().flash("Place removed", "ok");
          return;
        }
        if (pending.type === "add_contact") {
          const contact: Contact = { id: newId(), name: pending.name, role: pending.role || "Circle" };
          const event = makeEvent("confirm", deviceId, snap, places, `Added ${contact.name}`);
          Haptics.success();
          set({
            contacts: [...get().contacts, contact],
            pending: null,
            contactDraftName: "",
            contactDraftRole: "Circle",
            events: [event, ...get().events].slice(0, EVENT_CAP),
          });
          get().flash(`Added ${contact.name}`, "ok");
          return;
        }
        if (pending.type === "medical") {
          const draft = get().medicalDraft;
          const signed: MedicalId = { ...draft, signedAt: Date.now() };
          const event = makeEvent("medical", deviceId, snap, places, draft.name ? `Medical ID \u00b7 ${draft.name}` : "Medical ID signed");
          Haptics.success();
          set({
            medical: signed,
            pending: null,
            events: [event, ...get().events].slice(0, EVENT_CAP),
          });
          get().flash("Medical ID signed", "ok");
          return;
        }
        if (pending.type === "reset") {
          Haptics.long();
          set({
            onboarded: false,
            deviceId: "",
            events: [],
            places: [],
            contacts: [],
            pending: null,
            watchArmed: false,
            watchDueAt: null,
            lastCheckIn: null,
            sosPhase: "idle",
            sosEndsAt: null,
            crashPhase: "idle",
            crashEndsAt: null,
            tab: "hold",
            sealingPlace: false,
            placeDraftName: "",
            locked: false,
            faceEnrolled: false,
            facePhase: "idle",
            medical: EMPTY_MEDICAL,
            medicalDraft: EMPTY_MEDICAL,
            weatherAckAt: null,
            sheet: null,
            torch: false,
            focus: "off",
          });
        }
      },
      handlePress: (snap) => {
        const s = get();
        if (s.sosPhase === "countdown") return;
        if (s.sosPhase === "fired") return;
        if (s.crashPhase === "countdown") {
          s.clearCrash(snap);
          return;
        }
        if (!s.faceEnrolled) {
          if (s.facePhase === "scanning") s.completeFace(true, snap);
          else s.startFace();
          return;
        }
        if (s.locked) return;
        if (s.pending) {
          s.commitPending(snap);
          return;
        }
        if (s.sealingPlace) {
          if (!snap.fix) {
            Haptics.error();
            get().flash("Location required to seal a place", "warn");
            return;
          }
          const name = s.placeDraftName.trim() || "Untitled";
          const event = makeEvent("place", s.deviceId, snap, s.places, name);
          const place: Place = {
            id: newId(),
            name,
            lat: snap.fix.lat,
            lng: snap.fix.lng,
            radiusM: 80,
            savedAt: Date.now(),
            eventId: event.id,
          };
          Haptics.success();
          set({
            places: [place, ...s.places],
            events: [{ ...event, placeId: place.id }, ...s.events].slice(0, EVENT_CAP),
            sealingPlace: false,
            placeDraftName: "",
            tab: "map",
          });
          get().flash(`Sealed \u00b7 ${name}`, "ok");
          return;
        }
        s.heartbeat(snap);
      },
      setContactDraft: (name, role) => set({ contactDraftName: name, contactDraftRole: role }),
    }),
    {
      name: "hold.v2",
      skipHydration: true,
      partialize: (s) => ({
        onboarded: s.onboarded,
        deviceId: s.deviceId,
        events: s.events,
        places: s.places,
        contacts: s.contacts,
        watchArmed: s.watchArmed,
        watchMinutes: s.watchMinutes,
        lastCheckIn: s.lastCheckIn,
        watchDueAt: s.watchDueAt,
        labEnabled: s.labEnabled,
        faceEnrolled: s.faceEnrolled,
        medical: s.medical,
        medicalDraft: s.medicalDraft,
        weatherAckAt: s.weatherAckAt,
        notifyOn: s.notifyOn,
      }),
    },
  ),
);
