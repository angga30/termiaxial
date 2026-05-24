import React, { useEffect, useState, useCallback } from "react";
import {
  Folder,
  File,
  ChevronRight,
  Loader2,
  ArrowLeftRight,
  Trash2,
  DownloadCloud,
  UploadCloud,
} from "lucide-react";
import { useSftp, SftpEntry } from "../../hooks/use-sftp";
import { useTerminalStore } from "../../stores/terminal-store";
import { useVaultStore } from "../../stores/vault-store";
import { invoke } from "@tauri-apps/api/core";

export const DualPanelExplorer: React.FC = () => {
  const [leftPath, setLeftPath] = useState("");
  const [rightPath, setRightPath] = useState("");
  const [leftSession, setLeftSession] = useState("local");
  const [rightSession, setRightSession] = useState("local");

  return (
    <div className="flex-1 flex gap-px bg-white/5 overflow-hidden h-full">
      <SftpPanel
        id="left"
        selectedSessionId={leftSession}
        setSelectedSessionId={setLeftSession}
        currentPath={leftPath}
        setCurrentPath={setLeftPath}
        otherPanel={{ sessionId: rightSession, path: rightPath }}
      />
      <div className="w-px bg-white/5 self-stretch flex items-center justify-center z-10">
        <div className="bg-bg2 border border-white/10 p-1.5 rounded-full shadow-xl">
          <ArrowLeftRight size={14} className="text-muted" />
        </div>
      </div>
      <SftpPanel
        id="right"
        selectedSessionId={rightSession}
        setSelectedSessionId={setRightSession}
        currentPath={rightPath}
        setCurrentPath={setRightPath}
        otherPanel={{ sessionId: leftSession, path: leftPath }}
      />
    </div>
  );
};

interface SftpPanelProps {
  id: string;
  selectedSessionId: string;
  setSelectedSessionId: (id: string) => void;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  otherPanel: { sessionId: string; path: string };
}

const SftpPanel: React.FC<SftpPanelProps> = ({
  selectedSessionId,
  setSelectedSessionId,
  currentPath,
  setCurrentPath,
  otherPanel,
}) => {
  const sessions = useTerminalStore((state) => state.sessions);
  const { addSession } = useTerminalStore();
  const { credentials } = useVaultStore();
  const {
    entries,
    loading,
    listDir,
    listLocalDir,
    transferRemote,
    download,
    upload,
  } = useSftp();
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(),
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const refresh = useCallback(async () => {
    let path = currentPath;
    if (!path) {
      if (selectedSessionId === "local") {
        try {
          path = await invoke<string>("sftp_get_home_dir");
        } catch (e) {
          path = "/";
        }
      } else {
        path = "/";
      }
      setCurrentPath(path);
    }

    if (selectedSessionId === "local") {
      listLocalDir(path);
    } else {
      listDir(selectedSessionId, path);
    }
    setSelectedEntries(new Set());
  }, [selectedSessionId, currentPath, listDir, listLocalDir, setCurrentPath]);

  useEffect(() => {
    refresh();
  }, [selectedSessionId, currentPath, refresh]);

  const handleEntryClick = (e: React.MouseEvent, entry: SftpEntry) => {
    if (entry.is_dir) {
      const separator = currentPath.endsWith("/") ? "" : "/";
      const newPath = `${currentPath}${separator}${entry.name}`;
      setCurrentPath(newPath);
    } else {
      const newSelected = new Set(selectedEntries);
      if (e.ctrlKey || e.metaKey) {
        if (newSelected.has(entry.name)) newSelected.delete(entry.name);
        else newSelected.add(entry.name);
      } else {
        newSelected.clear();
        newSelected.add(entry.name);
      }
      setSelectedEntries(newSelected);
    }
  };

  const handleDragStart = (e: React.DragEvent, entry: SftpEntry) => {
    const itemsToDrag = selectedEntries.has(entry.name)
      ? Array.from(selectedEntries)
      : [entry.name];

    if (!selectedEntries.has(entry.name)) {
      setSelectedEntries(new Set([entry.name]));
    }

    const dragData = {
      sourceSessionId: selectedSessionId,
      sourcePath: currentPath,
      items: itemsToDrag,
    };

    e.dataTransfer.setData(
      "application/termiaxial-sftp",
      JSON.stringify(dragData),
    );
    e.dataTransfer.effectAllowed = "copy";

    // Set ghost image or just let default work
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const rawData = e.dataTransfer.getData("application/termiaxial-sftp");
    if (!rawData) return;

    const data = JSON.parse(rawData);
    if (
      data.sourceSessionId === selectedSessionId &&
      data.sourcePath === currentPath
    )
      return;

    console.log(
      `[SFTP DEBUG] Dropping ${data.items.length} items from ${data.sourceSessionId} to ${selectedSessionId}`,
    );

    for (const itemName of data.items) {
      const sPath = `${data.sourcePath}${data.sourcePath.endsWith("/") ? "" : "/"}${itemName}`;
      const dPath = `${currentPath}${currentPath.endsWith("/") ? "" : "/"}${itemName}`;

      try {
        if (data.sourceSessionId === "local" && selectedSessionId !== "local") {
          await upload(selectedSessionId, sPath, dPath);
        } else if (
          data.sourceSessionId !== "local" &&
          selectedSessionId === "local"
        ) {
          await download(data.sourceSessionId, sPath, dPath);
        } else if (
          data.sourceSessionId !== "local" &&
          selectedSessionId !== "local"
        ) {
          await transferRemote(
            data.sourceSessionId,
            sPath,
            selectedSessionId,
            dPath,
          );
        }
      } catch (err) {
        console.error(`Failed to transfer ${itemName}:`, err);
      }
    }

    // Refresh to show new files
    refresh();
  };

  const handleBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length === 0) return;
    parts.pop();
    const newPath = (currentPath.startsWith("/") ? "/" : "") + parts.join("/");
    setCurrentPath(newPath || (currentPath.startsWith("/") ? "/" : ""));
  };

  const handleTransfer = async () => {
    if (selectedEntries.size === 0) return;

    for (const itemName of selectedEntries) {
      const sPath = `${currentPath}${currentPath.endsWith("/") ? "" : "/"}${itemName}`;
      const dPath = `${otherPanel.path}${otherPanel.path.endsWith("/") ? "" : "/"}${itemName}`;

      try {
        if (selectedSessionId === "local" && otherPanel.sessionId !== "local") {
          await upload(otherPanel.sessionId, sPath, dPath);
        } else if (
          selectedSessionId !== "local" &&
          otherPanel.sessionId === "local"
        ) {
          await download(selectedSessionId, sPath, dPath);
        } else if (
          selectedSessionId !== "local" &&
          otherPanel.sessionId !== "local"
        ) {
          await transferRemote(
            selectedSessionId,
            sPath,
            otherPanel.sessionId,
            dPath,
          );
        }
      } catch (err) {
        console.error(`Transfer failed for ${itemName}: `, err);
      }
    }
    refresh();
  };

  return (
    <div
      className={`flex-1 flex flex-col bg-bg1 min-w-0 transition-all duration-200 ${isDragOver ? "ring-2 ring-inset ring-cyan/50 bg-cyan/[0.02]" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
        <select
          value={selectedSessionId}
          onChange={(e) => {
            const newSessionId = e.target.value;
            setSelectedSessionId(newSessionId);
            setCurrentPath("");
            
            if (newSessionId !== "local") {
              const cred = credentials.find((c) => c.id === newSessionId);
              if (cred && !sessions.find((s) => s.id === cred.id)) {
                const secretStr = cred.secret
                  ? new TextDecoder().decode(new Uint8Array(cred.secret))
                  : undefined;
                
                addSession(cred.name, {
                  host: cred.host || "",
                  port: 22,
                  user: cred.user || "",
                  password:
                    cred.type === "password" ? secretStr : undefined,
                  private_key:
                    cred.type === "ssh" ? secretStr : undefined,
                });
              }
            }
          }}
          className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cyan/50 transition-all flex-1 font-medium"
        >
          <option value="local">💻 Local Machine</option>
          {credentials.map((cred) => (
            <option key={cred.id} value={cred.id}>
              🔑 {cred.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleBack}
          className="p-1.5 hover:bg-white/5 rounded-md disabled:opacity-20 transition-all"
        >
          <ChevronRight className="rotate-180" size={16} />
        </button>
      </div>

      <div className="px-4 py-2 text-[10px] font-mono text-muted truncate border-b border-white/5 bg-black/20 flex items-center justify-between">
        <span className="truncate">{currentPath || "Loading..."}</span>
        {isDragOver && (
          <span className="text-cyan animate-pulse font-bold ml-2 flex-shrink-0">
            DROP TO COPY
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg1/50 backdrop-blur-[2px] z-20">
            <Loader2 className="animate-spin text-cyan" size={24} />
          </div>
        )}

        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 bg-bg1 z-10 shadow-sm">
            <tr className="text-[10px] uppercase tracking-wider text-muted border-b border-white/5">
              <th className="px-4 py-2 font-bold w-[70%]">Name</th>
              <th className="px-4 py-2 font-bold text-right">Size</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {entries.map((entry) => (
              <tr
                key={entry.name}
                draggable={!entry.is_dir}
                onDragStart={(e) => handleDragStart(e, entry)}
                onClick={(e) => handleEntryClick(e, entry)}
                onDoubleClick={(e) =>
                  entry.is_dir && handleEntryClick(e as any, entry)
                }
                className={`group hover:bg-cyan/5 cursor-pointer transition-colors border-b border-white/[0.02] select-none ${selectedEntries.has(entry.name) ? "bg-cyan/10 border-cyan/20" : ""}`}
              >
                <td className="px-4 py-2.5 flex items-center gap-2.5 overflow-hidden">
                  {entry.is_dir ? (
                    <Folder
                      size={16}
                      className="text-purple fill-purple/10 flex-shrink-0"
                    />
                  ) : (
                    <File
                      size={16}
                      className="text-cyan fill-cyan/10 flex-shrink-0"
                    />
                  )}
                  <span
                    className={`truncate ${entry.is_dir ? "font-semibold text-fg" : "text-fg/80"}`}
                  >
                    {entry.name}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted font-mono text-[10px] text-right">
                  {entry.is_dir ? "--" : formatSize(entry.size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEntries.size > 0 && (
        <div className="p-3 border-t border-white/5 bg-cyan/5 animate-slide-up flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <File size={14} className="text-cyan" />
            <span className="text-[11px] font-medium truncate">
              {selectedEntries.size === 1
                ? Array.from(selectedEntries)[0]
                : `${selectedEntries.size} items selected`}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTransfer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan text-bg0 rounded-lg text-[10px] font-bold hover:brightness-110 transition-all"
            >
              {selectedSessionId === "local" ? (
                <UploadCloud size={12} />
              ) : (
                <DownloadCloud size={12} />
              )}
              Transfer
            </button>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-err transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
