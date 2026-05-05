import { getSiteProfile } from "@/api/blog";
import type { SiteProfile } from "@/types/blog";
import { defineStore } from "pinia";

interface SiteState {
  profile: SiteProfile | null;
  loading: boolean;
  error: string;
}

export const useSiteStore = defineStore("site", {
  state: (): SiteState => ({
    profile: null,
    loading: false,
    error: ""
  }),
  actions: {
    async loadProfile() {
      if (this.profile || this.loading) {
        return;
      }

      this.loading = true;
      this.error = "";

      try {
        this.profile = await getSiteProfile();
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Load failed";
      } finally {
        this.loading = false;
      }
    }
  }
});
