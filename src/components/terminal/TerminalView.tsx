import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useSsh, SshOptions } from "../../hooks/use-ssh";
import { useTerminalStore } from "../../stores/terminal-store";

interface TerminalViewProps {
  sessionId: string;
  options: SshOptions;
  active: boolean;
  onAiRequest?: (context: string) => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  sessionId,
  options,
  active,
  onAiRequest,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { connect, write, resize, isConnected } = useSsh();
  const updateStatus = useTerminalStore((state) => state.updateSessionStatus);

  // Use refs to avoid stale closures in Xterm event listeners
  const writeRef = useRef(write);
  const resizeRef = useRef(resize);

  useEffect(() => {
    writeRef.current = write;
  }, [write]);

  useEffect(() => {
    resizeRef.current = resize;
  }, [resize]);

  // Initialize Terminal only once
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: "#0a0a0f",
        foreground: "#f0f0f5",
        cursor: "#00f0ff",
        selectionBackground: "rgba(0, 240, 255, 0.3)",
        black: "#0a0a0f",
        red: "#ff4040",
        green: "#00ff88",
        yellow: "#ffbe0b",
        blue: "#8338ec",
        magenta: "#ff006e",
        cyan: "#00f0ff",
        white: "#f0f0f5",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Immediate fit
    setTimeout(() => fitAddon.fit(), 0);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data) => writeRef.current(data));
    term.onResize(({ cols, rows }) => resizeRef.current(cols, rows));

    // Shortcut for AI (Ctrl+Space)
    term.attachCustomKeyEventHandler((event) => {
      if (event.ctrlKey && event.code === "Space" && event.type === "keydown") {
        const buffer = term.buffer.active;
        let context = "";
        const start = Math.max(0, buffer.baseY + buffer.viewportY - 50);
        const end = buffer.baseY + buffer.viewportY;

        for (let i = start; i <= end; i++) {
          const line = buffer.getLine(i);
          if (line) {
            context += line.translateToString(true) + "\n";
          }
        }

        if (onAiRequest) onAiRequest(context.trim());
        return false; // Prevent space from being typed
      }
      return true;
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    // Connect
    updateStatus(sessionId, "connecting");
    connect(sessionId, options, (data) => {
      term.write(data);
    })
      .then(() => updateStatus(sessionId, "connected"))
      .catch((err) => {
        term.writeln(`\r\n\x1b[31mError connecting: ${err}\x1b[0m`);
        updateStatus(sessionId, "error");
      });

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      updateStatus(sessionId, "disconnected");
    };
  }, []); // Empty deps to run only once per session instance

  // Re-fit when becoming active
  useEffect(() => {
    if (active && fitAddonRef.current) {
      fitAddonRef.current.fit();
      xtermRef.current?.focus();
    }
  }, [active]);

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 h-full relative ${active ? "flex" : "hidden"}`}
    >
      <div ref={terminalRef} className="flex-1 overflow-hidden" />
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg0/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3 px-6 py-3 bg-bg1 border border-white/10 rounded-2xl shadow-2xl">
            <div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-fg2">
              Connecting to {options.host}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
