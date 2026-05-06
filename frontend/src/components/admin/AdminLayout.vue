<template>
  <PageShell :with-sidebar="false">
    <section class="admin-layout">
      <aside class="admin-layout__sidebar">
        <div class="admin-layout__brand">
          <p>后台</p>
          <h2>管理中心</h2>
        </div>
        <AdminNav />
      </aside>

      <main class="admin-layout__content">
        <slot />
      </main>
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import AdminNav from "@/components/admin/AdminNav.vue";
import PageShell from "@/components/layout/PageShell.vue";
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.admin-layout__sidebar,
.admin-layout__content {
  min-width: 0;
}

.admin-layout__sidebar {
  position: sticky;
  top: calc(var(--header-height) + 24px);
  display: grid;
  gap: 18px;
  padding: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.admin-layout__brand p,
.admin-layout__brand h2 {
  margin: 0;
}

.admin-layout__brand p {
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 800;
}

.admin-layout__brand h2 {
  margin-top: 4px;
  color: var(--text-primary);
  font-size: 20px;
  line-height: 1.2;
}

@media (max-width: 920px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-layout__sidebar {
    position: static;
  }
}
</style>
