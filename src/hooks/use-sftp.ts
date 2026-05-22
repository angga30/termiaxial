import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface SftpEntry {
  name: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

export const useSftp = () => {
  const [entries, setEntries] = useState<SftpEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listDir = useCallback(async (sessionId: string, path: string) => {
    console.log(
      `[SFTP DEBUG] useSftp: listDir session=${sessionId} path=${path}`,
    );
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SftpEntry[]>("sftp_list_dir", {
        sessionId,
        path,
      });
      console.log(
        `[SFTP DEBUG] useSftp: listDir success, items=${result.length}`,
      );
      setEntries(result);
      setCurrentPath(path);
    } catch (err) {
      setError(String(err));
      console.error("[SFTP DEBUG] useSftp: listDir error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const listLocalDir = useCallback(async (path: string) => {
    console.log(`[SFTP DEBUG] useSftp: listLocalDir path=${path}`);
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SftpEntry[]>("sftp_list_local_dir", { path });
      console.log(
        `[SFTP DEBUG] useSftp: listLocalDir success, items=${result.length}`,
      );
      setEntries(result);
      setCurrentPath(path);
    } catch (err) {
      setError(String(err));
      console.error("[SFTP DEBUG] useSftp: listLocalDir error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const download = useCallback(
    async (sessionId: string, remotePath: string, localPath: string) => {
      try {
        await invoke("sftp_download", { sessionId, remotePath, localPath });
      } catch (err) {
        console.error("SFTP download error:", err);
        throw err;
      }
    },
    [],
  );

  const upload = useCallback(
    async (sessionId: string, localPath: string, remotePath: string) => {
      try {
        await invoke("sftp_upload", { sessionId, localPath, remotePath });
      } catch (err) {
        console.error("SFTP upload error:", err);
        throw err;
      }
    },
    [],
  );

  const transferRemote = useCallback(
    async (
      srcSessionId: string,
      srcPath: string,
      destSessionId: string,
      destPath: string,
    ) => {
      try {
        await invoke("sftp_transfer_remote", {
          srcSessionId,
          srcPath,
          destSessionId,
          destPath,
        });
      } catch (err) {
        console.error("SFTP remote transfer error:", err);
        throw err;
      }
    },
    [],
  );

  return {
    entries,
    currentPath,
    loading,
    error,
    listDir,
    listLocalDir,
    download,
    upload,
    transferRemote,
  };
};
