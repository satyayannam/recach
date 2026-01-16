"use client";

type ReflectionTab = {
  id: string;
  label: string;
};

type ReflectionTabsProps = {
  tabs: ReflectionTab[];
  activeId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export default function ReflectionTabs({
  tabs,
  activeId,
  onSelect,
  disabled
}: ReflectionTabsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            disabled={disabled}
            className={`rounded-full px-4 py-2 text-xs border border-white/30 ${
              isActive ? "text-purple-300" : "text-white/60"
            } disabled:opacity-50`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
