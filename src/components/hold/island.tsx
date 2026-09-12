import { cn } from "@/lib/cn";
import { formatCountdown } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useNow } from "@/lib/hold/use-now";

export function Island() {
  const now = useNow(250);
  const toast = useHold((s) => s.toast);
  const pending = useHold((s) => s.pending);
  const sealingPlace = useHold((s) => s.sealingPlace);
  const sosPhase = useHold((s) => s.sosPhase);
  const sosEndsAt = useHold((s) => s.sosEndsAt);
  const crashPhase = useHold((s) => s.crashPhase);
  const crashEndsAt = useHold((s) => s.crashEndsAt);
  const watchArmed = useHold((s) => s.watchArmed);
  const watchDueAt = useHold((s) => s.watchDueAt);
  const onboarded = useHold((s) => s.onboarded);
  const locked = useHold((s) => s.locked);
  const faceEnrolled = useHold((s) => s.faceEnrolled);

  let text = "HOLD";
  let tone: "idle" | "ok" | "warn" | "danger" = "idle";

  if (!onboarded) {
    text = "Press to bind";
    tone = "warn";
  } else if (sosPhase === "countdown" && sosEndsAt) {
    text = `SOS  ${formatCountdown(sosEndsAt - now)}  ·  shake to cancel`;
    tone = "danger";
  } else if (sosPhase === "fired") {
    text = "SOS live · hold to clear";
    tone = "danger";
  } else if (crashPhase === "countdown" && crashEndsAt) {
    text = `Crash  ${formatCountdown(crashEndsAt - now)}  ·  press if OK`;
    tone = "danger";
  } else if (onboarded && !faceEnrolled) {
    text = "Enroll Face ID";
    tone = "warn";
  } else if (locked) {
    text = "Face ID to unlock";
    tone = "warn";
  } else if (pending) {
    text = pendingLabel(pending);
    tone = "warn";
  } else if (sealingPlace) {
    text = "Name it · press to seal";
    tone = "warn";
  } else if (toast) {
    text = toast.text;
    tone =
      toast.tone === "danger"
        ? "danger"
        : toast.tone === "ok"
          ? "ok"
          : toast.tone === "warn"
            ? "warn"
            : "idle";
  } else if (watchArmed && watchDueAt) {
    const overdue = now > watchDueAt;
    text = overdue
      ? "Watch overdue · press"
      : `Watch  ${formatCountdown(watchDueAt - now)}`;
    tone = overdue ? "danger" : "ok";
  }

  const idle = text === "HOLD";

  return (
    <div
      className={cn(
        "island",
        idle && "island-idle",
        tone === "ok" && "island-ok",
        tone === "warn" && "island-warn",
        tone === "danger" && "island-danger",
      )}
      role="status"
    >
      {idle ? null : <span className="truncate">{text}</span>}
    </div>
  );
}

function pendingLabel(pending: NonNullable<ReturnType<typeof useHold.getState>["pending"]>): string {
  switch (pending.type) {
    case "interval":
      return `Press to set ${pending.minutes} min`;
    case "delete_place":
      return "Press to remove place";
    case "add_contact":
      return `Press to add ${pending.name}`;
    case "reset":
      return "Press to unbind device";
    case "medical":
      return "Press to sign Medical ID";
  }
}
