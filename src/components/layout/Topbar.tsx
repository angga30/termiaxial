import React from "react";
import { Home, Split } from "lucide-react";

export const Topbar: React.FC = () => {
  return (
    <header className="topbar h-14 bg-gbg border-b border-white/5 backdrop-blur-xl flex items-center justify-between px-5 z-10">
      <nav className="crumbs flex items-center gap-2.5 text-xs text-fg2">
        <Home size={14} />
        <div className="w-1 h-1 bg-muted rounded-full" />
        <span>My Workspace</span>
      </nav>

      <div className="topact flex items-center gap-2.5">
        <button className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg text-fg2 hover:bg-white/10 hover:text-fg transition-all">
          <Split size={16} />
        </button>
      </div>
    </header>
  );
};
