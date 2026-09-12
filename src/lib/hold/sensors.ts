import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LAB_FIX, type LiveFix, type SensorHealth } from "./types";
import { useHold, type Snapshot } from "./store";

type MotionPerm = SensorHealth["motion"];

type Sensors = {
  fix: LiveFix | null;
  heading: number | null;
  motion: number;
  battery: number | null;
  charging: boolean | null;
  health: SensorHealth;
  shakeNonce: number;
  crashNonce: number;
  requestAccess: () => Promise<void>;
  simulateShake: () => void;
  simulateCrash: () => void;
  snapshot: () => Snapshot;
};

const SensorsContext = createContext<Sensors | null>(null);

const SHAKE_THRESHOLD = 16;
const CRASH_THRESHOLD = 38;
const SHAKE_COOLDOWN_MS = 900;

function permissionState(
  raw: PermissionState | "prompt" | undefined,
  fallback: MotionPerm,
): MotionPerm {
  if (raw === "granted" || raw === "denied" || raw === "prompt") return raw;
  return fallback;
}

async function queryPerm(name: PermissionName): Promise<PermissionState | undefined> {
  if (typeof navigator === "undefined" || !navigator.permissions) return undefined;
  try {
    const s = await navigator.permissions.query({ name });
    return s.state;
  } catch {
    return undefined;
  }
}

export function SensorsProvider({ children }: { children: ReactNode }) {
  const labEnabled = useHold((s) => s.labEnabled);
  const [gpsFix, setGpsFix] = useState<LiveFix | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [motion, setMotion] = useState(0);
  const [battery, setBattery] = useState<number | null>(null);
  const [charging, setCharging] = useState<boolean | null>(null);
  const [health, setHealth] = useState<SensorHealth>({
    location: "prompt",
    motion: "prompt",
    orientation: "prompt",
    vibrate: false,
    battery: false,
    notify: "prompt",
  });
  const [shakeNonce, setShakeNonce] = useState(0);
  const [crashNonce, setCrashNonce] = useState(0);
  const lastShake = useRef(0);
  const motionValue = useRef(0);
  const headingRef = useRef<number | null>(null);
  const gpsRef = useRef<LiveFix | null>(null);
  const batteryRef = useRef<number | null>(null);
  const lastCrash = useRef(0);

  const fireShake = useCallback(() => {
    const now = Date.now();
    if (now - lastShake.current < SHAKE_COOLDOWN_MS) return;
    lastShake.current = now;
    setShakeNonce((n) => n + 1);
  }, []);

  const fireCrash = useCallback(() => {
    const now = Date.now();
    if (now - lastCrash.current < 4000) return;
    lastCrash.current = now;
    setCrashNonce((n) => n + 1);
  }, []);

  const simulateShake = useCallback(() => {
    lastShake.current = 0;
    fireShake();
  }, [fireShake]);

  const simulateCrash = useCallback(() => {
    lastCrash.current = 0;
    fireCrash();
  }, [fireCrash]);

  useEffect(() => {
    gpsRef.current = gpsFix;
  }, [gpsFix]);
  useEffect(() => {
    headingRef.current = heading;
  }, [heading]);
  useEffect(() => {
    batteryRef.current = battery;
  }, [battery]);

  useEffect(() => {
    setHealth((h) => ({
      ...h,
      vibrate: typeof navigator !== "undefined" && typeof navigator.vibrate === "function",
    }));
    void (async () => {
      const loc = await queryPerm("geolocation");
      setHealth((h) => ({ ...h, location: permissionState(loc, h.location) }));
    })();
    type NavBatt = {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (e: string, fn: () => void) => void;
        removeEventListener: (e: string, fn: () => void) => void;
      }>;
    };
    const nav = navigator as NavBatt;
    if (!nav.getBattery) return;
    let batt: Awaited<ReturnType<NonNullable<NavBatt["getBattery"]>>> | null = null;
    const sync = () => {
      if (!batt) return;
      setBattery(Math.round(batt.level * 100));
      setCharging(batt.charging);
    };
    void nav.getBattery().then((b) => {
      batt = b;
      setHealth((h) => ({ ...h, battery: true }));
      sync();
      b.addEventListener("levelchange", sync);
      b.addEventListener("chargingchange", sync);
    });
    return () => {
      if (!batt) return;
      batt.removeEventListener("levelchange", sync);
      batt.removeEventListener("chargingchange", sync);
    };
  }, []);

  const attachMotion = useCallback(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.acceleration;
      const g = e.accelerationIncludingGravity;
      const x = a?.x ?? g?.x ?? 0;
      const y = a?.y ?? g?.y ?? 0;
      const z = a?.z ?? g?.z ?? 0;
      const mag = Math.sqrt(x * x + y * y + z * z);
      motionValue.current = mag;
      setMotion(mag);
      const user = e.acceleration;
      const ux = user?.x ?? 0;
      const uy = user?.y ?? 0;
      const uz = user?.z ?? 0;
      const umag = Math.sqrt(ux * ux + uy * uy + uz * uz);
      if (umag > CRASH_THRESHOLD) fireCrash();
      else if (umag > SHAKE_THRESHOLD) fireShake();
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      const webkitCompass = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      let hdg: number | null = null;
      if (typeof webkitCompass === "number" && !Number.isNaN(webkitCompass)) hdg = webkitCompass;
      else if (typeof e.alpha === "number") hdg = (360 - e.alpha) % 360;
      if (hdg !== null) {
        headingRef.current = hdg;
        setHeading(hdg);
      }
    };
    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [fireShake, fireCrash]);

  const requestAccess = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setHealth((h) => ({ ...h, location: "granted" })),
        () => setHealth((h) => ({ ...h, location: "denied" })),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } else {
      setHealth((h) => ({ ...h, location: "unavailable" }));
    }
    const dm = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<PermissionState> };
    const dori = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<PermissionState> };
    try {
      if (typeof dm.requestPermission === "function") {
        const st = await dm.requestPermission();
        setHealth((h) => ({ ...h, motion: st === "granted" ? "granted" : "denied" }));
      } else {
        setHealth((h) => ({ ...h, motion: "granted" }));
      }
    } catch {
      setHealth((h) => ({ ...h, motion: "denied" }));
    }
    try {
      if (typeof dori.requestPermission === "function") {
        const st = await dori.requestPermission();
        setHealth((h) => ({ ...h, orientation: st === "granted" ? "granted" : "denied" }));
      } else {
        setHealth((h) => ({ ...h, orientation: "granted" }));
      }
    } catch {
      setHealth((h) => ({ ...h, orientation: "denied" }));
    }
    try {
      if (typeof Notification !== "undefined") {
        const st = await Notification.requestPermission();
        setHealth((h) => ({
          ...h,
          notify: st === "granted" ? "granted" : st === "denied" ? "denied" : "prompt",
        }));
        if (st === "granted") useHold.getState().setNotifyOn(true);
      } else {
        setHealth((h) => ({ ...h, notify: "unavailable" }));
      }
    } catch {
      setHealth((h) => ({ ...h, notify: "unavailable" }));
    }
  }, []);

  useEffect(() => attachMotion(), [attachMotion]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setHealth((h) => ({ ...h, location: "unavailable" }));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const fix: LiveFix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading:
            typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading)
              ? pos.coords.heading
              : headingRef.current,
          speed: typeof pos.coords.speed === "number" && !Number.isNaN(pos.coords.speed) ? pos.coords.speed : null,
          at: pos.timestamp,
          source: "gps",
        };
        setGpsFix(fix);
        setHealth((h) => ({ ...h, location: "granted" }));
      },
      () => {
        setHealth((h) => {
          if (h.location === "granted") return h;
          return { ...h, location: "denied" };
        });
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const fix = useMemo<LiveFix | null>(() => {
    if (gpsFix) return { ...gpsFix, heading: gpsFix.heading ?? heading };
    if (labEnabled) {
      return {
        lat: LAB_FIX.lat,
        lng: LAB_FIX.lng,
        accuracy: 12,
        heading,
        speed: 0,
        at: Date.now(),
        source: "lab",
      };
    }
    return null;
  }, [gpsFix, labEnabled, heading]);

  const snapshot = useCallback((): Snapshot => {
    const currentFix = (() => {
      if (gpsRef.current) {
        return { ...gpsRef.current, heading: gpsRef.current.heading ?? headingRef.current };
      }
      if (useHold.getState().labEnabled) {
        return {
          lat: LAB_FIX.lat,
          lng: LAB_FIX.lng,
          accuracy: 12,
          heading: headingRef.current,
          speed: 0,
          at: Date.now(),
          source: "lab" as const,
        };
      }
      return null;
    })();
    return {
      fix: currentFix,
      battery: batteryRef.current,
      motion: motionValue.current,
      weather: null,
      locality: null,
    };
  }, []);

  const value = useMemo<Sensors>(
    () => ({
      fix,
      heading,
      motion,
      battery,
      charging,
      health,
      shakeNonce,
      crashNonce,
      requestAccess,
      simulateShake,
      simulateCrash,
      snapshot,
    }),
    [fix, heading, motion, battery, charging, health, shakeNonce, crashNonce, requestAccess, simulateShake, simulateCrash, snapshot],
  );

  return createElement(SensorsContext.Provider, { value }, children);
}

export function useSensors(): Sensors {
  const ctx = useContext(SensorsContext);
  if (!ctx) throw new Error("useSensors must be used within SensorsProvider");
  return ctx;
}
