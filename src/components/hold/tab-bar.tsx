import {
  CircleDot,
  Clock3,
  Fingerprint,
  Map,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useHold } from "@/lib/hold/store";
import type { TabId } from "@/lib/hold/types";

const TABS: { id: TabId; label: string; icon: typeof CircleDot }[] = [
  { id: "hold", label: "Hold", icon: CircleDot },
  { id: "map", label: "Map", icon: Map },
  { id: "watch", label: "Watch", icon: Clock3 },
  { id: "sos", label: "SOS", icon: Siren },
  { id: "id", label: "ID", icon: Fingerprint },
];

export function TabBar() {
  const tab = useHold((s) => s.tab);
  const setTab = useHold((s) => s.setTab);

  return (
    <nav className="tab-bar" aria-label="Primary">
      {TABS.map((t) => {
        const on = tab === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            className={cn("tab-btn", on && "tab-btn-on")}
            aria-current={on ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            <Icon className="size-5" strokeWidth={on ? 2.2 : 1.7} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
