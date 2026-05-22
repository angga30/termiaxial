import { create } from 'zustand';
import { listen } from '@tauri-apps/api/event';

export interface Transfer {
  id: string;
  filename: string;
  bytes: number;
  total: number;
  status: 'active' | 'completed' | 'error';
}

interface TransferState {
  transfers: Record<string, Transfer>;
  initListener: () => Promise<() => void>;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: {},

  initListener: async () => {
    const unlisten = await listen<{ session_id: string, filename: string, bytes: number, total: number }>(
      'sftp-progress',
      (event) => {
        const { session_id, filename, bytes, total } = event.payload;
        const id = `${session_id}-${filename}`;

        set((state) => ({
          transfers: {
            ...state.transfers,
            [id]: {
              id,
              filename,
              bytes,
              total,
              status: bytes === total ? 'completed' : 'active'
            }
          }
        }));

        // Auto-remove completed after 5 seconds
        if (bytes === total) {
          setTimeout(() => {
            set((state) => {
              const newTransfers = { ...state.transfers };
              delete newTransfers[id];
              return { transfers: newTransfers };
            });
          }, 5000);
        }
      }
    );
    return unlisten;
  },
}));
