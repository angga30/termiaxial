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
          const bytes = new Uint8Array(message);
          console.debug(`[SSH] data rx session=${id} bytes=${bytes.length}`, bytes.slice(0, 32));
          onData(bytes);
        };

        console.log(`[SSH] invoking connect_ssh session=${id} host=${options.host}`);
        await invoke("connect_ssh", {
          sessionId: id,
          options,
          onData: channel,
        });
        console.log(`[SSH] connect_ssh resolved OK session=${id}`);
        setIsConnected(true);
        return id;
      } catch (err) {
        console.error(`[SSH] connect_ssh FAILED session=${id}:`, err);
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
      console.debug(`[SSH] write session=${sessionIdRef.current} bytes=${bytes.length}`);
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
      console.debug(`[SSH] resize session=${sessionIdRef.current} ${cols}x${rows}`);
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
