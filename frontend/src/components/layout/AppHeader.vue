<template>
  <header class="app-header">
    <RouterLink class="brand" to="/">
      <img v-if="siteStore.profile?.avatar" class="brand__avatar" :src="siteStore.profile.avatar" :alt="siteStore.profile.name" />
      <span class="brand__name">{{ siteStore.profile?.name ?? "SSP Blog" }}</span>
    </RouterLink>

    <nav class="desktop-nav" :aria-label="t('nav.articles')">
      <RouterLink class="nav-link" to="/search">
        <Search :size="17" />
        <span>{{ t("nav.search") }}</span>
      </RouterLink>
      <RouterLink class="nav-link" to="/">
        <House :size="17" />
        <span>{{ t("nav.home") }}</span>
      </RouterLink>
      <el-dropdown trigger="hover">
        <button class="nav-link nav-link--button" type="button">
          <Collection :size="17" />
          <span>{{ t("nav.articles") }}</span>
          <ArrowDown :size="14" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/categories')">{{ t("nav.categories") }}</el-dropdown-item>
            <el-dropdown-item @click="router.push('/tags')">{{ t("nav.tags") }}</el-dropdown-item>
            <el-dropdown-item @click="router.push('/archive')">{{ t("nav.archive") }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <RouterLink class="nav-link" to="/about">
        <User :size="17" />
        <span>{{ t("nav.about") }}</span>
      </RouterLink>
      <RouterLink class="nav-link" to="/admin">
        <EditPen :size="17" />
        <span>{{ t("nav.admin") }}</span>
      </RouterLink>
    </nav>

    <button class="mobile-menu" type="button" :aria-label="t('nav.articles')" @click="drawerVisible = true">
      <Menu :size="22" />
    </button>

    <el-drawer v-model="drawerVisible" direction="rtl" size="260px">
      <template #header>
        <span class="drawer-title">{{ siteStore.profile?.name ?? "SSP Blog" }}</span>
      </template>
      <nav class="mobile-nav">
        <RouterLink class="mobile-link" to="/search" @click="drawerVisible = false">{{ t("nav.search") }}</RouterLink>
        <RouterLink class="mobile-link" to="/" @click="drawerVisible = false">{{ t("nav.home") }}</RouterLink>
        <RouterLink class="mobile-link" to="/about" @click="drawerVisible = false">{{ t("nav.about") }}</RouterLink>
        <RouterLink class="mobile-link" to="/categories" @click="drawerVisible = false">{{ t("nav.categories") }}</RouterLink>
        <RouterLink class="mobile-link" to="/tags" @click="drawerVisible = false">{{ t("nav.tags") }}</RouterLink>
        <RouterLink class="mobile-link" to="/admin" @click="drawerVisible = false">{{ t("nav.admin") }}</RouterLink>
      </nav>
    </el-drawer>
  </header>
</template>

<script setup lang="ts">
import { useSiteStore } from "@/stores/site";
import { ArrowDown, Collection, EditPen, House, Menu, Search, User } from "@element-plus/icons-vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();
const siteStore = useSiteStore();
const drawerVisible = ref(false);
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: var(--header-height);
  padding: 0 clamp(20px, 4vw, 52px);
  overflow: hidden;
  background: color-mix(in srgb, var(--page-bg) 92%, white);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-header);
  backdrop-filter: blur(14px);
}

.brand {
  display: inline-flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  color: var(--text-primary);
  font-weight: 700;
  text-decoration: none;
}

.brand__avatar {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  object-fit: cover;
  border-radius: 6px;
}

.brand__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.desktop-nav {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: clamp(10px, 1.4vw, 18px);
  max-width: calc(100% - 180px);
  overflow: hidden;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  flex-direction: row;
  flex-wrap: nowrap;
  flex: 0 0 auto;
  gap: 6px;
  height: 36px;
  padding: 0 4px;
  color: var(--text-regular);
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: var(--animation-fast);
}

.nav-link span {
  display: inline-block;
}

.nav-link :deep(svg) {
  display: block;
  flex: 0 0 17px;
  width: 17px;
  height: 17px;
}

.nav-link--button :deep(svg:last-child) {
  flex-basis: 14px;
  width: 14px;
  height: 14px;
}

.desktop-nav :deep(.el-dropdown) {
  flex: 0 0 auto;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary-color);
}

.nav-link--button {
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.mobile-menu {
  display: none;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.mobile-menu :deep(svg) {
  display: block;
  width: 22px;
  height: 22px;
}

.drawer-title {
  color: var(--text-primary);
  font-weight: 700;
}

.mobile-nav {
  display: grid;
  gap: 8px;
}

.mobile-link {
  padding: 12px;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 6px;
}

.mobile-link.router-link-active {
  color: var(--primary-color);
  background: var(--primary-soft);
}

@media (max-width: 1180px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu {
    display: inline-flex;
  }
}
</style>
