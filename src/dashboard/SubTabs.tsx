// Tabs inside a section of the dashboard (the overview, later triggers): a row over the area, the chosen tab marked in
// the signature. Arrow keys, Home and End move between the tabs like in other tab bars; the area below is the
// tabpanel that subTabPanel names.
import type { KeyboardEvent } from "react";

export type SubTab<T extends string> = { id: T; label: string };

// The attributes of the area below the tabs
export const subTabPanel = (id: string) => ({ role: "tabpanel", id: `tabpanel-${id}`, "aria-labelledby": `tab-${id}` });

export function SubTabs<T extends string>({ label, tabs, current, onChange }: { label: string; tabs: readonly SubTab<T>[]; current: T; onChange: (id: T) => void }) {
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex(tab => tab.id === current);
    const target = ({ ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <div className="sub-tabs" role="tablist" aria-label={label} onKeyDown={keys}>
      {tabs.map(tab => (
        <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} className="sub-tab" aria-selected={tab.id === current} aria-controls={`tabpanel-${tab.id}`}
          tabIndex={tab.id === current ? 0 : -1} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
