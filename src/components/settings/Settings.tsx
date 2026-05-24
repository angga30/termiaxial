import React, { useState } from "react";
import { Settings as SettingsIcon, Sliders, Sparkles } from "lucide-react";
import { AiSettings } from "./AiSettings";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"general" | "ai">("general");

  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-64 bg-bg1 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <SettingsIcon className="text-cyan" size={18} /> Settings
          </h2>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <SettingsTab
            icon={<Sliders size={18} />}
            title="General"
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
          />
          <SettingsTab
            icon={<Sparkles size={18} />}
            title="AI"
            active={activeTab === "ai"}
            onClick={() => setActiveTab("ai")}
          />
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-bg0">
        {activeTab === "ai" && <AiSettings />}
        {activeTab === "general" && (
          <div className="p-8 max-w-2xl mx-auto space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Sliders className="text-cyan" size={28} /> General Settings
              </h2>
              <p className="text-muted text-sm">
                Configure your application preferences.
              </p>
            </div>
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-muted text-sm">General settings coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

interface SettingsTabProps {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  icon,
  title,
  active,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
        ${active ? "bg-cyan/10 text-cyan" : "text-fg2 hover:bg-white/5 hover:text-fg"}`}
    >
      {icon}
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
};