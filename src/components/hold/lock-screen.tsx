import { useEffect, useRef } from "react";
import { formatClock, formatDate } from "@/lib/hold/format";
import { useHold, type Snapshot } from "@/lib/hold/store";
import { useNow } from "@/lib/hold/use-now";
import type { WeatherSnap } from "@/lib/hold/types";
import { cn } from "@/lib/cn";

export function LockLayer({
  snap,
  weather,
  locality,
}: {
  snap: () => Snapshot;
  weather: WeatherSnap | null;
  locality: string | null;
}) {
  const now = useNow(1000);
  const phase = useHold((s) => s.facePhase);
  const enrolled = useHold((s) => s.faceEnrolled);
  const locked = useHold((s) => s.locked);
  const onboarded = useHold((s) => s.onboarded);
  const startFace = useHold((s) => s.startFace);
  const completeFace = useHold((s) => s.completeFace);
  const medical = useHold((s) => s.medical);
  const watchArmed = useHold((s) => s.watchArmed);
  const watchDueAt = useHold((s) => s.watchDueAt);
  const openSheet = useHold((s) => s.openSheet);
  const sheet = useHold((s) => s.sheet);

  const show = onboarded && (locked || !enrolled || phase === "scanning" || phase === "ok");

  const snapRef = useRef(snap);
  snapRef.current = snap;
  const completeRef = useRef(completeFace);
  completeRef.current = completeFace;

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = window.setTimeout(() => completeRef.current(true, snapRef.current()), 1400);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!show || !enrolled || !locked || phase !== "idle") return;
    const t = window.setTimeout(() => startFace(), 520);
    return () => window.clearTimeout(t);
  }, [show, enrolled, locked, phase, startFace]);

  if (!show) return null;
  if (enrolled && !locked && phase === "idle") return null;

  const enroll = !enrolled;

  return (
    <div className={cn("lock-layer", sheet && "pointer-events-none")}>
      <button
        type="button"
        className="cc-grabber pointer-events-auto"
        onClick={() => openSheet("control")}
        aria-label="Open Control Center"
      >
        <span className="cc-grabber-bar" />
      </button>

      <p className="lock-clock tabular-nums">{formatClock(now)}</p>
      <p className="lock-date">{formatDate(now)}</p>

      <div className="widget-row">
        <button
          type="button"
          className="widget pointer-events-auto text-left"
          onClick={() => openSheet("weather")}
          aria-label="Open WeatherKit"
        >
          <p className="widget-k">WeatherKit</p>
          <p className="widget-v">{weather ? `${weather.tempC}°` : "—"}</p>
          <p className="widget-s">{weather?.label ?? "Model"}</p>
        </button>
        <div className="widget">
          <p className="widget-k">HOLD</p>
          <p className="widget-v">{watchArmed ? "Armed" : "Idle"}</p>
          <p className="widget-s">
            {watchArmed && watchDueAt ? "Live Activity" : "App Intents"}
          </p>
        </div>
      </div>

      <p className="lock-locality">{locality ?? "CoreLocation"}</p>

      <button
        type="button"
        className="lock-face pointer-events-auto"
        onClick={() => {
          if (phase === "scanning") completeFace(true, snap());
          else startFace();
        }}
        aria-label={enroll ? "Enroll Face ID" : "Use Face ID"}
      >
        <div
          className={cn(
            "face-ring",
            phase === "scanning" && "face-ring-on",
            phase === "ok" && "face-ring-ok",
          )}
        >
          <svg viewBox="0 0 64 64" className="size-14" aria-hidden="true">
            <path
              d="M18 14h-4a6 6 0 0 0-6 6v4M46 14h4a6 6 0 0 1 6 6v4M14 46v4a6 6 0 0 0 6 6h4M50 46v4a6 6 0 0 1-6 6h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="24" cy="28" r="2.2" fill="currentColor" />
            <circle cx="40" cy="28" r="2.2" fill="currentColor" />
            <path
              d="M24 40c2.4 3 5.2 4.5 8 4.5S37.6 43 40 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="mt-4 mb-1 text-base font-semibold tracking-tight">
          {phase === "ok"
            ? "Unlocked"
            : phase === "fail"
              ? "Try again"
              : phase === "scanning"
                ? "Looking…"
                : enroll
                  ? "Enroll Face ID"
                  : "Face ID"}
        </p>
        <p className="m-0 max-w-60 text-center text-sm text-muted">
          {enroll
            ? "Press the Action Button to enroll. SOS still works while locked."
            : "Look at iPhone, or tap. Triple-press for Emergency SOS."}
        </p>
      </button>

      <button
        type="button"
        className={cn(
          "medical-pill pointer-events-auto",
          !medical.signedAt && "medical-pill-empty",
        )}
        onClick={() => openSheet("health")}
        aria-label="Open Medical ID"
      >
        {medical.signedAt
          ? `Medical ID  ·  ${medical.name || "Signed"}  ·  ${medical.blood}`
          : "Medical ID unsigned · HealthKit"}
      </button>
    </div>
  );
}
