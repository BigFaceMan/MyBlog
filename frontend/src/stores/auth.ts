import { getCurrentUser, loginUser, logoutUser, registerUser, type AuthUser } from "@/api/auth";
import { defineStore } from "pinia";

interface AuthState {
  user: AuthUser | null;
  checked: boolean;
  loading: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    checked: false,
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    isRoot: (state) => Boolean(state.user?.isRoot)
  },
  actions: {
    async checkSession(force = false) {
      if (this.checked && !force) {
        return Boolean(this.user);
      }

      this.loading = true;

      try {
        const result = await getCurrentUser();
        this.user = result.authenticated ? result.user : null;
      } catch {
        this.user = null;
      } finally {
        this.checked = true;
        this.loading = false;
      }

      return Boolean(this.user);
    },
    async login(username: string, password: string) {
      this.loading = true;

      try {
        this.user = await loginUser(username, password);
        this.checked = true;
        return this.user;
      } finally {
        this.loading = false;
      }
    },
    async register(username: string, password: string) {
      this.loading = true;

      try {
        this.user = await registerUser(username, password);
        this.checked = true;
        return this.user;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      try {
        await logoutUser();
      } catch {
        // Local logout should still complete if the server is already unreachable.
      } finally {
        this.user = null;
        this.checked = true;
      }
    }
  }
});
