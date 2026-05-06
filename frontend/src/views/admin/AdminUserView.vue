<template>
  <AdminLayout>
    <section class="user-admin">
      <header class="user-header">
        <div>
          <p>后台</p>
          <h1>用户管理</h1>
        </div>
        <el-button :loading="loading" @click="loadUsers">刷新</el-button>
      </header>

      <form class="user-create" @submit.prevent="createUser">
        <el-input v-model="createForm.username" clearable placeholder="用户名" />
        <el-input v-model="createForm.password" show-password placeholder="初始密码" />
        <el-select v-model="createForm.role" placeholder="角色">
          <el-option label="普通用户" value="user" />
          <el-option label="Root" value="root" />
        </el-select>
        <el-select v-model="createForm.status" placeholder="状态">
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="disabled" />
        </el-select>
        <el-button type="primary" native-type="submit" :loading="saving">新增用户</el-button>
      </form>

      <StateBlock v-if="loading" type="loading" title="正在加载用户" />
      <StateBlock v-else-if="error" type="error" title="加载失败" :description="error" action-text="重试" @action="loadUsers" />
      <section v-else class="user-table">
        <el-table :data="users" row-key="id" empty-text="暂无用户">
          <el-table-column label="用户名" min-width="180">
            <template #default="{ row }">
              <div class="username-cell">
                <strong>{{ row.username }}</strong>
                <el-tag v-if="isCurrentUser(row)" size="small" effect="plain">当前用户</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.role === 'root' ? 'success' : 'info'" effect="light">{{ roleLabel(row.role) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'" effect="light">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="150">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="150">
            <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="410" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button size="small" :disabled="isCurrentUser(row)" @click="toggleRole(row)">
                  {{ row.role === "root" ? "设为普通" : "设为 Root" }}
                </el-button>
                <el-button size="small" :type="row.status === 'active' ? 'warning' : 'success'" plain :disabled="isCurrentUser(row)" @click="toggleStatus(row)">
                  {{ row.status === "active" ? "禁用" : "启用" }}
                </el-button>
                <el-button size="small" plain @click="resetPassword(row)">重置密码</el-button>
                <el-button size="small" plain type="danger" :disabled="isCurrentUser(row)" @click="removeUser(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup lang="ts">
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserPassword,
  type AdminUser,
  type AdminUserPayload,
  type AdminUserRole,
  type AdminUserStatus
} from "@/api/admin";
import AdminLayout from "@/components/admin/AdminLayout.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import { useAuthStore } from "@/stores/auth";
import { formatDate } from "@/utils/date";
import { ElMessage, ElMessageBox } from "element-plus";
import { reactive, ref } from "vue";

const authStore = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const users = ref<AdminUser[]>([]);
const createForm = reactive<AdminUserPayload>({
  username: "",
  password: "",
  role: "user",
  status: "active"
});

const roleLabel = (role: AdminUserRole) => (role === "root" ? "Root" : "普通用户");
const statusLabel = (status: AdminUserStatus) => (status === "active" ? "启用" : "禁用");
const isCurrentUser = (user: AdminUser) => user.username === authStore.user?.username;

const resetCreateForm = () => {
  createForm.username = "";
  createForm.password = "";
  createForm.role = "user";
  createForm.status = "active";
};

const loadUsers = async () => {
  loading.value = true;
  error.value = "";

  try {
    users.value = await getAdminUsers();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

const validateCreateForm = () => {
  if (!createForm.username.trim()) {
    ElMessage.warning("请填写用户名");
    return false;
  }

  if (createForm.password.length < 6) {
    ElMessage.warning("密码至少 6 位");
    return false;
  }

  return true;
};

const createUser = async () => {
  if (!validateCreateForm()) {
    return;
  }

  saving.value = true;

  try {
    await createAdminUser({
      username: createForm.username.trim(),
      password: createForm.password,
      role: createForm.role,
      status: createForm.status
    });
    ElMessage.success("用户已创建");
    resetCreateForm();
    await loadUsers();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "创建失败");
  } finally {
    saving.value = false;
  }
};

const toggleRole = async (user: AdminUser) => {
  const nextRole: AdminUserRole = user.role === "root" ? "user" : "root";

  try {
    await updateAdminUser(user.id, {
      role: nextRole
    });
    ElMessage.success("角色已更新");
    await loadUsers();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "角色更新失败");
  }
};

const toggleStatus = async (user: AdminUser) => {
  const nextStatus: AdminUserStatus = user.status === "active" ? "disabled" : "active";

  try {
    await updateAdminUser(user.id, {
      status: nextStatus
    });
    ElMessage.success(nextStatus === "active" ? "用户已启用" : "用户已禁用");
    await loadUsers();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "状态更新失败");
  }
};

const resetPassword = async (user: AdminUser) => {
  try {
    const { value } = await ElMessageBox.prompt(`请输入「${user.username}」的新密码`, "重置密码", {
      inputType: "password",
      inputPlaceholder: "至少 6 位",
      confirmButtonText: "保存",
      cancelButtonText: "取消",
      inputValidator: (value) => value.length >= 6 || "密码至少 6 位"
    });

    await updateAdminUserPassword(user.id, value);
    ElMessage.success("密码已重置");
  } catch (err) {
    if (err !== "cancel" && err !== "close") {
      ElMessage.error(err instanceof Error ? err.message : "重置失败");
    }
  }
};

const removeUser = async (user: AdminUser) => {
  try {
    await ElMessageBox.confirm(`确认删除「${user.username}」？`, "删除用户", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
    await deleteAdminUser(user.id);
    ElMessage.success("用户已删除");
    await loadUsers();
  } catch (err) {
    if (err !== "cancel" && err !== "close") {
      ElMessage.error(err instanceof Error ? err.message : "删除失败");
    }
  }
};

void loadUsers();
</script>

<style scoped>
.user-admin {
  display: grid;
  gap: 18px;
}

.user-header,
.user-create,
.user-table {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.user-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
}

.user-header p {
  margin: 0 0 6px;
  color: var(--primary-color);
  font-weight: 800;
}

.user-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 30px;
  line-height: 1.15;
}

.user-create {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 140px 140px auto;
  gap: 12px;
  padding: 16px;
}

.user-table {
  overflow: hidden;
  padding: 12px;
}

.username-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.username-cell strong {
  color: var(--text-primary);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 1080px) {
  .user-create {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .user-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .user-create {
    grid-template-columns: 1fr;
  }
}
</style>
