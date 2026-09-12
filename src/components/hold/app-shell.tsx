import { useCallback, useEffect, useRef } from "react";
import { SensorsProvider, useSensors } from "@/lib/hold/sensors";
import { useHold, type Snapshot } from "@/lib/hold/store";
import { useHydrated } from "@/lib/hold/use-hydrated";
import { useActionButton, type Gesture } from "@/lib/hold/use-action-button";
import { useWorld, WorldProvider } from "@/lib/hold/world";
import { cn } from "@/lib/cn";
import { ActionButton } from "./action-button";
import { CrashOverlay } from "./crash-overlay";
import { EmergencyScreen } from "./emergency-screen";
import { HoldScreen } from "./hold-screen";
import { IdentityScreen } from "./identity-screen";
import { Island } from "./island";
import { LockLayer } from "./lock-screen";
import { Onboarding } from "./onboarding";
import { PlacesScreen } from "./places-screen";
import { SheetHost } from "./sheets";
import { SosOverlay } from "./sos-overlay";
import { TabBar } from "./tab-bar";
import { WatchScreen } from "./watch-screen";

export function HoldApp() {
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const s = useHold.getState();
    if (s.onboarded && s.faceEnrolled) s.lock();
  }, [hydrated]);

  return (
    <SensorsProvider>
      <WorldProvider>
        <PhoneFrame />
      </WorldProvider>
    </SensorsProvider>
  );
}

function PhoneFrame() {
  const lock = useHold((s) => s.lock);
  const faceEnrolled = useHold((s) => s.faceEnrolled);
  const torch = useHold((s) => s.torch);
  const focus = useHold((s) => s.focus);

  return (
    <div className="phone-stage">
      <div>
        <div className={cn("phone", torch && "phone-torch", focus === "sleep" && "phone-sleep")}>
          <button
            type="button"
            className="hw-power"
            aria-label="Lock"
            onClick={() => {
              if (faceEnrolled) lock();
            }}
          />
          <div className="hw-vol hw-vol-up" />
          <div className="hw-vol hw-vol-down" />
          <Shell />
          <div className="phone-screen">
            <Island />
            <AppBody />
            <Overlays />
          </div>
        </div>
        <p className="lab-hint">
          Space · Action Button &nbsp;·&nbsp; S · Shake &nbsp;·&nbsp; Side button · Lock
        </p>
      </div>
    </div>
  );
}

function useFullSnap() {
  const { snapshot } = useSensors();
  const { weather, place } = useWorld();
  return useCallback((): Snapshot => {
    return {
      ...snapshot(),
      weather,
      locality: place?.locality ?? null,
    };
  }, [snapshot, weather, place]);
}

function Shell() {
  const fullSnap = useFullSnap();
  const { requestAccess, simulateShake, crashNonce } = useSensors();
  const onboarded = useHold((s) => s.onboarded);
  const sosPhase = useHold((s) => s.sosPhase);
  const locked = useHold((s) => s.locked);
  const faceEnrolled = useHold((s) => s.faceEnrolled);
  const facePhase = useHold((s) => s.facePhase);
  const bindIdentity = useHold((s) => s.bindIdentity);
  const handlePress = useHold((s) => s.handlePress);
  const beginSealPlace = useHold((s) => s.beginSealPlace);
  const toggleWatch = useHold((s) => s.toggleWatch);
  const startSos = useHold((s) => s.startSos);
  const clearSos = useHold((s) => s.clearSos);
  const startCrash = useHold((s) => s.startCrash);
  const startFace = useHold((s) => s.startFace);
  const completeFace = useHold((s) => s.completeFace);
  const crashPhase = useHold((s) => s.crashPhase);

  const crashBase = useRef<number | null>(null);
  useEffect(() => {
    if (crashBase.current === null) {
      crashBase.current = crashNonce;
      return;
    }
    if (crashNonce !== crashBase.current) {
      crashBase.current = crashNonce;
      if (onboarded && sosPhase === "idle" && crashPhase === "idle") startCrash();
    }
  }, [crashNonce, onboarded, sosPhase, crashPhase, startCrash]);

  const onGesture = useCallback(
    (g: Gesture) => {
      const snap = fullSnap();
      if (!onboarded) {
        void requestAccess();
        bindIdentity(snap);
        return;
      }
      if (sosPhase === "countdown") return;
      if (sosPhase === "fired") {
        if (g === "long") clearSos(snap);
        return;
      }
      if (g === "triple") {
        startSos(snap);
        return;
      }
      if (crashPhase === "countdown") {
        handlePress(snap);
        return;
      }
      if (!faceEnrolled) {
        if (g === "press" || g === "long") {
          if (facePhase === "scanning") completeFace(true, snap);
          else startFace();
        }
        return;
      }
      if (locked) return;
      if (g === "double") beginSealPlace(snap);
      else if (g === "long") toggleWatch(snap);
      else handlePress(snap);
    },
    [
      fullSnap,
      onboarded,
      sosPhase,
      locked,
      faceEnrolled,
      facePhase,
      crashPhase,
      requestAccess,
      bindIdentity,
      handlePress,
      beginSealPlace,
      toggleWatch,
      startSos,
      clearSos,
      startFace,
      completeFace,
    ],
  );

  const { onDown, onUp } = useActionButton({ onGesture });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyS" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      simulateShake();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [simulateShake]);

  return <ActionButton onDown={onDown} onUp={onUp} />;
}

function Overlays() {
  const fullSnap = useFullSnap();
  const { weather, place } = useWorld();
  return (
    <>
      <LockLayer snap={fullSnap} weather={weather} locality={place?.locality ?? null} />
      <SheetHost />
      <CrashOverlay weather={weather} locality={place?.locality ?? null} />
      <SosOverlay />
    </>
  );
}

function AppBody() {
  const onboarded = useHold((s) => s.onboarded);
  const tab = useHold((s) => s.tab);

  if (!onboarded) {
    return (
      <div className="app-root">
        <Onboarding />
      </div>
    );
  }

  return (
    <div className="app-root">
      {tab === "hold" ? <HoldScreen /> : null}
      {tab === "map" ? <PlacesScreen /> : null}
      {tab === "watch" ? <WatchScreen /> : null}
      {tab === "sos" ? <EmergencyScreen /> : null}
      {tab === "id" ? <IdentityScreen /> : null}
      <TabBar />
    </div>
  );
}
