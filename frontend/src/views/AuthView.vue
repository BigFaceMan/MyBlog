<template>
  <PageShell :with-sidebar="false">
    <section class="auth-page">
      <form class="auth-panel" @submit.prevent="submit">
        <header>
          <p>账号</p>
          <h1>{{ isRegister ? "注册账号" : "登录" }}</h1>
        </header>

        <div class="mode-switch" aria-label="账号操作">
          <RouterLink :class="['mode-link', { 'mode-link--active': !isRegister }]" to="/login">登录</RouterLink>
          <RouterLink :class="['mode-link', { 'mode-link--active': isRegister }]" to="/register">注册</RouterLink>
        </div>

        <label class="field">
          <span>用户名</span>
          <el-input v-model="username" :prefix-icon="User" autocomplete="username" placeholder="root 或你的用户名" />
        </label>

        <label class="field">
          <span>密码</span>
          <el-input v-model="password" :prefix-icon="Lock" :autocomplete="isRegister ? 'new-password' : 'current-password'" placeholder="至少 6 位" show-password type="password" />
        </label>

        <label v-if="isRegister" class="field">
          <span>确认密码</span>
          <el-input v-model="confirmPassword" :prefix-icon="Lock" autocomplete="new-password" placeholder="再次输入密码" show-password type="password" />
        </label>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <el-button class="auth-button" type="primary" native-type="submit" :loading="authStore.loading">
          {{ isRegister ? "注册并登录" : "登录" }}
        </el-button>
      </form>
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import PageShell from "@/components/layout/PageShell.vue";
import { useAuthStore } from "@/stores/auth";
import { Lock, User } from "@element-plus/icons-vue";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const isRegister = computed(() => route.name === "register");

const redirectTarget = computed(() => {
  const redirect = route.query.redirect;

  if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("/login") && !redirect.startsWith("/register")) {
    return redirect;
  }

  return "/";
});

const submit = async () => {
  error.value = "";

  if (!username.value.trim() || !password.value) {
    error.value = "请输入用户名和密码";
    return;
  }

  if (password.value.length < 6) {
    error.value = "密码至少需要 6 位";
    return;
  }

  if (isRegister.value && password.value !== confirmPassword.value) {
    error.value = "两次输入的密码不一致";
    return;
  }

  try {
    if (isRegister.value) {
      await authStore.register(username.value.trim(), password.value);
      await router.replace("/");
      return;
    }

    await authStore.login(username.value.trim(), password.value);
    await router.replace(redirectTarget.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "操作失败";
  }
};

watch(
  () => route.name,
  () => {
    error.value = "";
    confirmPassword.value = "";
  }
);
</script>

<style scoped>
.auth-page {
  display: grid;
  width: 100%;
  min-height: calc(100vh - var(--header-height) - 106px);
  place-items: center;
}

.auth-panel {
  display: grid;
  gap: 18px;
  width: min(100%, 420px);
  padding: 30px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.auth-panel header {
  display: grid;
  gap: 6px;
}

.auth-panel p,
.auth-panel h1 {
  margin: 0;
}

.auth-panel header p {
  color: var(--primary-color);
  font-weight: 800;
}

.auth-panel h1 {
  color: var(--text-primary);
  font-size: 28px;
  line-height: 1.2;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 4px;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.mode-link {
  display: grid;
  min-height: 34px;
  place-items: center;
  color: var(--text-secondary);
  font-weight: 700;
  text-decoration: none;
  border-radius: 6px;
}

.mode-link--active {
  color: var(--primary-color);
  background: var(--card-bg);
  box-shadow: var(--shadow-card);
}

.field {
  display: grid;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 700;
}

.field span {
  font-size: 14px;
}

.auth-error {
  padding: 10px 12px;
  color: var(--el-color-danger);
  font-size: 14px;
  line-height: 1.5;
  background: color-mix(in srgb, var(--el-color-danger) 9%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 22%, transparent);
  border-radius: 8px;
}

.auth-button {
  width: 100%;
}

@media (max-width: 560px) {
  .auth-panel {
    padding: 22px;
  }
}
</style>
