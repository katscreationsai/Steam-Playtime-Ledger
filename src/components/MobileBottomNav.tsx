import { BarChart3, Hash, List, Search } from 'lucide-react';

export type MobileTabId = 'lookup' | 'overview' | 'library' | 'identifiers';

interface MobileBottomNavProps {
  activeTab: MobileTabId;
  hasResults: boolean;
  onSelectTab: (tab: MobileTabId) => void;
}

export function MobileBottomNav({
  activeTab,
  hasResults,
  onSelectTab,
}: MobileBottomNavProps) {
  const tabs: Array<{
    id: MobileTabId;
    label: string;
    icon: typeof Search;
    disabled?: boolean;
  }> = [
    { id: 'lookup', label: 'Lookup', icon: Search },
    { id: 'overview', label: 'Summary', icon: BarChart3, disabled: !hasResults },
    { id: 'library', label: 'Games', icon: List, disabled: !hasResults },
    { id: 'identifiers', label: 'Steam IDs', icon: Hash },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1117]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
    >
      <div className="grid grid-cols-4 h-[52px] items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors disabled:opacity-35 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              <span className="text-[10px] font-medium tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
