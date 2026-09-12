import { formatCountdown, formatRelative } from "@/lib/hold/format";
import { useHold } from "@/lib/hold/store";
import { useNow } from "@/lib/hold/use-now";
import { WATCH_INTERVALS } from "@/lib/hold/types";
import { cn } from "@/lib/cn";

export function WatchScreen() {
  const now = useNow(250);
  const armed = useHold((s) => s.watchArmed);
  const dueAt = useHold((s) => s.watchDueAt);
  const minutes = useHold((s) => s.watchMinutes);
  const lastCheckIn = useHold((s) => s.lastCheckIn);
  const pending = useHold((s) => s.pending);
  const propose = useHold((s) => s.propose);

  const remaining = dueAt ? dueAt - now : 0;
  const overdue = armed && dueAt !== null && remaining <= 0;

  return (
    <div className="screen-scroll">
      <h1 className="large-title">Watch</h1>
      <p className="subhead">
        A dead-man interval. If you go quiet, HOLD asks for a press.
      </p>

      <div className="metal-card text-center">
        <p className="m-0 text-xs font-medium tracking-[0.16em] text-subtle uppercase">
          {overdue ? "Overdue" : armed ? "Armed" : "Idle"}
        </p>
        <p
          className={cn(
            "mt-3 mb-1 font-mono text-6xl font-medium tabular-nums tracking-tight",
            overdue && "text-danger",
          )}
        >
          {armed && dueAt
            ? overdue
              ? formatCountdown(now - dueAt)
              : formatCountdown(remaining)
            : "—:—"}
        </p>
        <p className="m-0 text-sm text-muted">
          {armed
            ? overdue
              ? "Press the Action Button to check in"
              : "until the next required heartbeat"
            : "Long-press the Action Button to arm"}
        </p>
        {lastCheckIn ? (
          <p className="mt-4 mb-0 font-mono text-xs text-subtle">
            Last check-in {formatRelative(lastCheckIn, now)}
          </p>
        ) : null}
      </div>

      <div className="section-block">
        <p className="section-label">Interval</p>
        <p className="mb-3 ml-1 text-sm text-muted">
          Changing the interval requires a press.
        </p>
        <div className="chip-row">
          {WATCH_INTERVALS.map((m) => {
            const on = minutes === m;
            const isPending =
              pending?.type === "interval" && pending.minutes === m;
            return (
              <button
                key={m}
                type="button"
                className={cn("chip", on && "chip-on", isPending && "chip-pending")}
                onClick={() => {
                  if (on) return;
                  propose(
                    { type: "interval", minutes: m },
                    `Press to set ${m} min watch`,
                  );
                }}
              >
                {m} min
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-block">
        <p className="section-label">How it works</p>
        <div className="grouped">
          <div className="grouped-row">
            <span className="grouped-k">Arm / disarm</span>
            <span className="grouped-v">Long press</span>
          </div>
          <div className="grouped-row">
            <span className="grouped-k">Check in</span>
            <span className="grouped-v">Single press</span>
          </div>
          <div className="grouped-row">
            <span className="grouped-k">A software tap</span>
            <span className="grouped-v">Cannot arm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
