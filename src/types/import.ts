export interface ImportSource {
  kind: "ssh_config" | "ssh_keys" | "known_hosts";
  path: string;
  detected: boolean;
}

export interface SshConfigEntry {
  host: string;
  hostname: string;
  user: string;
  port: number;
  identity_file: string | null;
  proxy_command: string | null;
  proxy_jump: string | null;
}

export interface SshKeyInfo {
  path: string;
  key_type: string;
  fingerprint: string | null;
}

export interface ImportSelection {
  ssh_config_entries: number[];
  import_keys: boolean;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
