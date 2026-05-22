import { useState, useCallback, useRef } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";

export interface SshOptions {
  host: string;
  port: number;
  user: string;
  password?: string;
  private_key?: string;
}

export const useSsh = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const connect = useCallback(
    async (
      id: string,
      options: SshOptions,
      onData: (data: Uint8Array) => void,
    ) => {
      try {
        setError(null);
        sessionIdRef.current = id;
        const channel = new Channel<number[]>();
        channel.onmessage = (message) => {
          onData(new Uint8Array(message));
        };

        await invoke("connect_ssh", {
          sessionId: id,
          options,
          onData: channel,
        });
        setIsConnected(true);
        return id;
      } catch (err) {
        setError(String(err));
        setIsConnected(false);
        throw err;
      }
    },
    [],
  );

  const write = useCallback(async (data: string | Uint8Array) => {
    if (!sessionIdRef.current) return;
    try {
      const bytes =
        typeof data === "string" ? new TextEncoder().encode(data) : data;
      await invoke("write_ssh", {
        sessionId: sessionIdRef.current,
        data: Array.from(bytes),
      });
    } catch (err) {
      console.error("Failed to write to SSH:", err);
    }
  }, []);

  const resize = useCallback(async (cols: number, rows: number) => {
    if (!sessionIdRef.current) return;
    try {
      await invoke("resize_pty", {
        sessionId: sessionIdRef.current,
        cols,
        rows,
      });
    } catch (err) {
      console.error("Failed to resize SSH PTY:", err);
    }
  }, []);

  return {
    isConnected,
    error,
    connect,
    write,
    resize,
  };
};
