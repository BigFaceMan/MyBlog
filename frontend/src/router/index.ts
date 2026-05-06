import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue")
    },
    {
      path: "/articles/:slug",
      name: "article-detail",
      component: () => import("@/views/ArticleDetailView.vue")
    },
    {
      path: "/categories",
      name: "categories",
      component: () => import("@/views/CategoryView.vue")
    },
    {
      path: "/categories/:slug",
      name: "category-detail",
      component: () => import("@/views/CategoryView.vue")
    },
    {
      path: "/tags",
      name: "tags",
      component: () => import("@/views/TagView.vue")
    },
    {
      path: "/tags/:slug",
      name: "tag-detail",
      component: () => import("@/views/TagView.vue")
    },
    {
      path: "/archive",
      name: "archive",
      component: () => import("@/views/ArchiveView.vue")
    },
    {
      path: "/search",
      name: "search",
      component: () => import("@/views/SearchView.vue")
    },
    {
      path: "/about",
      name: "about",
      component: () => import("@/views/AboutView.vue")
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/AuthView.vue")
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/AuthView.vue")
    },
    {
      path: "/admin/login",
      redirect: {
        path: "/login",
        query: {
          redirect: "/admin"
        }
      }
    },
    {
      path: "/admin",
      name: "admin-articles",
      component: () => import("@/views/admin/AdminArticleListView.vue")
    },
    {
      path: "/admin/tags",
      name: "admin-tags",
      component: () => import("@/views/admin/AdminTaxonomyView.vue")
    },
    {
      path: "/admin/categories",
      name: "admin-categories",
      component: () => import("@/views/admin/AdminTaxonomyView.vue")
    },
    {
      path: "/admin/users",
      name: "admin-users",
      component: () => import("@/views/admin/AdminUserView.vue")
    },
    {
      path: "/admin/profile",
      name: "admin-profile",
      component: () => import("@/views/admin/AdminProfileView.vue")
    },
    {
      path: "/admin/articles/new",
      name: "admin-article-new",
      component: () => import("@/views/admin/AdminArticleEditorView.vue")
    },
    {
      path: "/admin/articles/:id/edit",
      name: "admin-article-edit",
      component: () => import("@/views/admin/AdminArticleEditorView.vue")
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/NotFoundView.vue")
    }
  ],
  scrollBehavior() {
    return {
      top: 0
    };
  }
});

const resolveAuthRedirect = (value: unknown) => {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("/login") && !value.startsWith("/register")) {
    return value;
  }

  return "/";
};

router.beforeEach(async (to) => {
  const isAuthRoute = to.name === "login" || to.name === "register";
  const isProtectedAdminRoute = to.path.startsWith("/admin");

  if (!isAuthRoute && !isProtectedAdminRoute) {
    return true;
  }

  const authStore = useAuthStore();
  const authenticated = await authStore.checkSession();

  if (isAuthRoute) {
    return authenticated ? resolveAuthRedirect(to.query.redirect) : true;
  }

  if (!authenticated) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath
      }
    };
  }

  if (!authStore.isRoot) {
    return "/";
  }

  return true;
});
