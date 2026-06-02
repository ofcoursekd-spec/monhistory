'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: 'READER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  setTokens: (a: string, r: string) => Promise<void>;
  loadMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  oauth: (provider: 'google' | 'facebook' | 'apple', idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,

      async setTokens(accessToken, refreshToken) {
        set({ accessToken, refreshToken });
        await get().loadMe();
      },

      async loadMe() {
        const token = get().accessToken;
        if (!token) return;
        try {
          const user = await api<User>('/users/me', { token });
          set({ user });
        } catch {
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },

      async login(email, password) {
        set({ loading: true });
        try {
          const r = await api<{ accessToken: string; refreshToken: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          await get().setTokens(r.accessToken, r.refreshToken);
        } finally {
          set({ loading: false });
        }
      },

      async register(email, name, password) {
        set({ loading: true });
        try {
          const r = await api<{ accessToken: string; refreshToken: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, name, password }),
          });
          await get().setTokens(r.accessToken, r.refreshToken);
        } finally {
          set({ loading: false });
        }
      },

      async oauth(provider, idToken) {
        const r = await api<{ accessToken: string; refreshToken: string }>('/auth/oauth', {
          method: 'POST',
          body: JSON.stringify({ provider, idToken }),
        });
        await get().setTokens(r.accessToken, r.refreshToken);
      },

      async logout() {
        const { accessToken, refreshToken } = get();
        if (accessToken && refreshToken) {
          await api('/auth/logout', {
            method: 'POST',
            token: accessToken,
            body: JSON.stringify({ refreshToken }),
          }).catch(() => {});
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'mh-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
);

// Helper pour récupérer le token côté client
export const getClientToken = () => useAuth.getState().accessToken ?? undefined;
