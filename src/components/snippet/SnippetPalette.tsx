import React, { useEffect, useRef, useState } from "react";
import { Search, Terminal, Tag } from "lucide-react";
import { useSnippetStore, Snippet } from "../../stores/snippet-store";
import { useTerminalStore } from "../../stores/terminal-store";
import { extractVariables } from "../../utils/snippet";
import { VariablePrompt } from "./VariablePrompt";
import { invoke } from "@tauri-apps/api/core";

interface SnippetPaletteProps {
  onClose: () => void;
}

export const SnippetPalette: React.FC<SnippetPaletteProps> = ({ onClose }) => {
  const {
    snippets,
    searchQuery,
    selectedIndex,
    setSearchQuery,
    setSelectedIndex,
    loadSnippets,
  } = useSnippetStore();
  const { activeSessionId } = useTerminalStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [variableSnippet, setVariableSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    loadSnippets();
    inputRef.current?.focus();
  }, [loadSnippets]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (variableSnippet) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, snippets.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (snippets[selectedIndex]) {
          executeSnippet(snippets[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, snippets, onClose, variableSnippet]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const executeSnippet = (snippet: Snippet) => {
    const vars = extractVariables(snippet.command);
    if (vars.length > 0) {
      setVariableSnippet(snippet);
      return;
    }
    sendCommand(snippet.command);
  };

  const sendCommand = async (command: string) => {
    if (!activeSessionId) {
      onClose();
      return;
    }
    try {
      const bytes = Array.from(new TextEncoder().encode(command + "\n"));
      await invoke("write_ssh", {
        sessionId: activeSessionId,
        data: bytes,
      });
    } catch (err) {
      console.error("Failed to send snippet command:", err);
    }
    onClose();
  };

  const handleVariableSubmit = (interpolated: string) => {
    setVariableSnippet(null);
    sendCommand(interpolated);
  };

  if (variableSnippet) {
    return (
      <VariablePrompt
        template={variableSnippet.command}
        onSubmit={handleVariableSubmit}
        onCancel={() => setVariableSnippet(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] bg-bg0/80 backdrop-blur-md p-6">
      <div className="w-full max-w-lg bg-bg1 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden animate-zoom-in">
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
          <Search className="text-muted" size={18} />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-muted font-mono">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-auto p-2">
          {snippets.length === 0 && !searchQuery && (
            <div className="p-8 text-center text-muted text-sm">
              No snippets yet. Add some in Settings.
            </div>
          )}
          {snippets.length === 0 && searchQuery && (
            <div className="p-8 text-center text-muted text-sm">
              No snippets match "{searchQuery}"
            </div>
          )}
          {snippets.map((snippet, i) => (
            <div
              key={snippet.id}
              onClick={() => executeSnippet(snippet)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                i === selectedIndex
                  ? "bg-cyan/10 border border-cyan/20"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  i === selectedIndex
                    ? "bg-cyan/20 text-cyan"
                    : "bg-white/5 text-muted"
                }`}
              >
                <Terminal size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {snippet.name}
                </div>
                <div className="text-[10px] text-muted font-mono truncate">
                  {snippet.command.length > 60
                    ? snippet.command.slice(0, 60) + "..."
                    : snippet.command}
                </div>
              </div>
              {snippet.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {snippet.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-muted font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4 text-[10px] text-muted font-mono">
          <span className="flex items-center gap-1">
            <Tag size={10} /> {snippets.length} snippet{snippets.length !== 1 && "s"}
          </span>
          <span className="ml-auto flex gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>Esc Close</span>
          </span>
        </div>
      </div>
    </div>
  );
};
