<template>
  <nav class="admin-nav" aria-label="后台管理">
    <RouterLink class="admin-nav__link" to="/admin">文章</RouterLink>
    <RouterLink class="admin-nav__link" to="/admin/tags">标签</RouterLink>
    <RouterLink class="admin-nav__link" to="/admin/categories">类别</RouterLink>
  </nav>
</template>

<style scoped>
.admin-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-nav__link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  color: var(--text-regular);
  font-weight: 700;
  text-decoration: none;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: var(--animation-fast);
}

.admin-nav__link:hover,
.admin-nav__link.router-link-active {
  color: var(--primary-color);
  border-color: var(--primary-border);
}
</style>
