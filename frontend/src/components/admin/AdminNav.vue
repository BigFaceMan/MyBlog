<template>
  <nav class="admin-nav" aria-label="后台管理">
    <RouterLink v-for="item in navItems" :key="item.to" :class="['admin-nav__link', { active: isActive(item) }]" :to="item.to">
      <component :is="item.icon" class="admin-nav__icon" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { EditPen, Folder, PriceTag, User, UserFilled } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";

const route = useRoute();
const navItems = [
  {
    label: "文章管理",
    to: "/admin",
    icon: EditPen,
    activePath: (path: string) => path === "/admin" || path.startsWith("/admin/articles")
  },
  {
    label: "标签管理",
    to: "/admin/tags",
    icon: PriceTag,
    activePath: (path: string) => path.startsWith("/admin/tags")
  },
  {
    label: "类别管理",
    to: "/admin/categories",
    icon: Folder,
    activePath: (path: string) => path.startsWith("/admin/categories")
  },
  {
    label: "用户管理",
    to: "/admin/users",
    icon: User,
    activePath: (path: string) => path.startsWith("/admin/users")
  },
  {
    label: "个人简介管理",
    to: "/admin/profile",
    icon: UserFilled,
    activePath: (path: string) => path.startsWith("/admin/profile")
  }
];

const isActive = (item: (typeof navItems)[number]) => item.activePath(route.path);
</script>

<style scoped>
.admin-nav {
  display: grid;
  gap: 6px;
}

.admin-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
  color: var(--text-regular);
  font-weight: 700;
  text-decoration: none;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: var(--animation-fast);
}

.admin-nav__icon {
  display: block;
  flex: 0 0 17px;
  width: 17px;
  height: 17px;
}

.admin-nav__link:hover,
.admin-nav__link.active {
  color: var(--primary-color);
  background: var(--primary-soft);
  border-color: var(--primary-border);
}
</style>
