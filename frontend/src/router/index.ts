import { createRouter, createWebHistory } from "vue-router";

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
      path: "/admin",
      name: "admin-articles",
      component: () => import("@/views/admin/AdminArticleListView.vue")
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
