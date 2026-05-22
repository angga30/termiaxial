import React from "react";
import { Home, Search, Split, Plus } from "lucide-react";

interface TopbarProps {
  onNewSession?: () => void;
  searchValue?: string;
  onSearchChange?: (term: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onNewSession,
  searchValue,
  onSearchChange,
}) => {
  return (
    <header className="topbar h-14 bg-gbg border-b border-white/5 backdrop-blur-xl flex items-center justify-between px-5 z-10">
      <nav className="crumbs flex items-center gap-2.5 text-xs text-fg2">
        <Home size={14} />
        <div className="w-1 h-1 bg-muted rounded-full" />
        <span>Terminal</span>
        <div className="w-1 h-1 bg-muted rounded-full" />
        <span className="text-fg font-medium">Production Server</span>
      </nav>

      <div className="topact flex items-center gap-2.5">
        <div className="srch relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={15}
          />
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-lg py-1.5 pl-9 pr-3.5 text-sm w-64 outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all placeholder:text-muted"
          />
        </div>

        <button className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg text-fg2 hover:bg-white/10 hover:text-fg transition-all">
          <Split size={16} />
        </button>

        <button
          onClick={onNewSession}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-br from-cyan to-purple rounded-lg text-sm font-medium text-bg0 shadow-[0_4px_20px_rgba(0,240,255,0.25)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,240,255,0.35)] transition-all"
        >
          <Plus size={16} /> New Session
        </button>
      </div>
    </header>
  );
};
