import { invoke } from "@tauri-apps/api/core";
import { useRef, useCallback } from "react";

export interface CommandHistoryEntry {
  id: string;
  session_id: string;
  command: string;
  timestamp: string;
  exit_code: number | null;
}

export function useCommandHistory(sessionId: string) {
  const currentLineRef = useRef("");

  const onData = useCallback(
    (data: string) => {
      for (const char of data) {
        if (char === "\r" || char === "\n") {
          const command = currentLineRef.current.trim();
          if (command.length > 0) {
            invoke("history_record", {
              entry: {
                id: crypto.randomUUID(),
                session_id: sessionId,
                command,
                timestamp: new Date().toISOString(),
                exit_code: null,
              },
            }).catch(() => {});
          }
          currentLineRef.current = "";
        } else if (char === "\x7f" || char === "\b") {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
        } else if (char >= " " || char === "\t") {
          currentLineRef.current += char;
        } else if (char === "\x03") {
          currentLineRef.current = "";
        }
      }
    },
    [sessionId],
  );

  return { onData };
}
