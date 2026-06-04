import React from "react";
import {
  Terminal,
  Shield,
  Settings,
  FolderTree,
  Clock,
  Cable,
} from "lucide-react";

interface SidebarProps {
  onTerminalClick?: () => void;
  onSftpClick?: () => void;
  onSettingsClick?: () => void;
  onCredentialsClick?: () => void;
  onHistoryClick?: () => void;
  onTunnelClick?: () => void;
  activeView?: "terminal" | "sftp" | "credentials" | "settings" | "history" | "tunnels";
}

export const Sidebar: React.FC<SidebarProps> = ({
  onTerminalClick,
  onSftpClick,
  onSettingsClick,
  onCredentialsClick,
  onHistoryClick,
  onTunnelClick,
  activeView,
}) => {
  return (
    <aside className="sidebar w-[68px] bg-gbg border-r border-white/5 backdrop-blur-xl flex flex-col items-center py-4 gap-2 z-10 h-full">
      <div className="sidebar-logo w-10 h-10 rounded-xl flex items-center justify-center mb-4">
        <img src="/icon.png" alt="Tmax" className="w-9 h-9" />
      </div>

      <SidebarItem
        icon={<Terminal size={20} />}
        title="Terminal"
        active={activeView === "terminal"}
        onClick={onTerminalClick}
      />
      <SidebarItem
        icon={<FolderTree size={20} />}
        title="SFTP"
        active={activeView === "sftp"}
        onClick={onSftpClick}
      />
      <SidebarItem
        icon={<Shield size={20} />}
        title="Credentials"
        active={activeView === "credentials"}
        onClick={onCredentialsClick}
      />
      <SidebarItem
        icon={<Cable size={20} />}
        title="Tunnels"
        active={activeView === "tunnels"}
        onClick={onTunnelClick}
      />
      <SidebarItem
        icon={<Clock size={20} />}
        title="History"
        active={activeView === "history"}
        onClick={onHistoryClick}
      />

      <div className="flex-1" />

      <SidebarItem
        icon={<Settings size={20} />}
        title="Settings"
        active={activeView === "settings"}
        onClick={onSettingsClick}
      />
    </aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  title,
  active,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`nav w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all relative group
        ${active ? "bg-cyan/10 text-cyan" : "text-fg2 hover:bg-white/5 hover:text-fg"}`}
      title={title}
    >
      {active && (
        <div className="absolute -left-4 w-0.5 h-5 bg-cyan rounded-r shadow-[0_0_10px_var(--cyan)]" />
      )}
      {icon}
    </div>
  );
};
