import React, { useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  Clock,
  Play,
  Trash2,
  Filter,
  Loader2,
} from "lucide-react";
import { useHistoryStore, CommandHistoryEntry } from "../../stores/history-store";
import { invoke } from "@tauri-apps/api/core";

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const HistoryPanel: React.FC = () => {
  const {
    entries,
    searchQuery,
    selectedSessionId,
    loading,
    setSearchQuery,
    setSelectedSessionId,
    loadHistory,
    clearHistory,
  } = useHistoryStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(val);
      }, 300);
    },
    [setSearchQuery],
  );

  const uniqueSessionIds = useMemo(() => {
    const ids = new Set(entries.map((e) => e.session_id));
    return Array.from(ids);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!selectedSessionId) return entries;
    return entries.filter((e) => e.session_id === selectedSessionId);
  }, [entries, selectedSessionId]);

  const handleRerun = useCallback(async (entry: CommandHistoryEntry) => {
    try {
      const data = Array.from(
        new TextEncoder().encode(entry.command + "\n"),
      );
      await invoke("write_ssh", {
        sessionId: entry.session_id,
        data,
      });
    } catch (err) {
      console.error("Failed to re-run command:", err);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (confirm("Clear all command history?")) {
      clearHistory(selectedSessionId || undefined);
    }
  }, [clearHistory, selectedSessionId]);

  return (
    <div className="flex flex-col h-full bg-bg0 overflow-hidden animate-fade-in">
      <header className="p-4 border-b border-white/5 bg-white/[0.02]">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Clock className="text-cyan" size={18} /> Command History
        </h2>

        <div className="relative group mb-2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-cyan transition-colors"
            size={14}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-cyan/50 focus:ring-2 focus:ring-cyan/10 transition-all placeholder:text-muted"
          />
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={14}
          />
          <select
            value={selectedSessionId || ""}
            onChange={(e) =>
              setSelectedSessionId(e.target.value || null)
            }
            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-cyan/50 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Sessions</option>
            {uniqueSessionIds.map((id) => (
              <option key={id} value={id}>
                {id.slice(0, 8)}...
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-2">
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        )}

        {!loading && filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted">
            <Search size={36} strokeWidth={1} className="mb-3 opacity-20" />
            <p className="text-xs">No commands found.</p>
          </div>
        )}

        {!loading &&
          filteredEntries.map((entry) => (
            <HistoryEntryItem
              key={entry.id}
              entry={entry}
              onRerun={handleRerun}
            />
          ))}
      </div>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleClear}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-muted hover:text-err hover:bg-err/10 border border-white/5 hover:border-err/30 transition-all"
        >
          <Trash2 size={14} />
          Clear History
        </button>
      </div>
    </div>
  );
};

interface HistoryEntryItemProps {
  entry: CommandHistoryEntry;
  onRerun: (entry: CommandHistoryEntry) => void;
}

const HistoryEntryItem: React.FC<HistoryEntryItemProps> = ({
  entry,
  onRerun,
}) => (
  <div className="group bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-1.5 hover:border-cyan/20 hover:bg-white/[0.04] transition-all">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-fg truncate group-hover:text-cyan transition-colors">
          {entry.command}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted">
          <span>{formatRelativeTime(entry.timestamp)}</span>
          <span className="opacity-30">|</span>
          <span className="font-mono truncate max-w-[80px]">
            {entry.session_id.slice(0, 8)}...
          </span>
          {entry.exit_code !== null && (
            <>
              <span className="opacity-30">|</span>
              <span
                className={
                  entry.exit_code === 0 ? "text-ok" : "text-err"
                }
              >
                exit {entry.exit_code}
              </span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onRerun(entry)}
        className="p-1.5 rounded-lg text-muted hover:text-cyan hover:bg-cyan/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        title="Re-run command"
      >
        <Play size={14} />
      </button>
    </div>
  </div>
);
