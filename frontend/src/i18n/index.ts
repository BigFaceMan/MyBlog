import { createI18n } from "vue-i18n";

const messages = {
  "zh-CN": {
    common: {
      loading: "正在加载",
      retry: "重试",
      empty: "暂无内容",
      close: "关闭",
      readMore: "阅读全文",
      created: "Created",
      wordCount: "字数：{count}",
      readingTime: "阅读时间：{count} 分钟",
      postViews: "观看次数：{count}",
      minRead: "{count} 分钟阅读",
      views: "{count} 次浏览"
    },
    nav: {
      home: "首页",
      articles: "文章",
      categories: "分类",
      tags: "标签",
      archive: "归档",
      search: "Search",
      about: "关于",
      admin: "后台",
      login: "登录",
      logout: "退出登录",
      register: "注册",
      mine: "我的"
    },
    sidebar: {
      articles: "Articles",
      tags: "Tags",
      categories: "Categories",
      follow: "Follow Me",
      announcement: "Announcement",
      contents: "Contents",
      recentPosts: "Recent Posts",
      taxonomy: "Categories & Tags"
    },
    page: {
      homeTitle: "最新文章",
      categoriesTitle: "分类",
      tagsTitle: "标签",
      archiveTitle: "归档",
      searchTitle: "搜索",
      aboutTitle: "关于我",
      searchPlaceholder: "输入标题、正文、标签关键词",
      searchButton: "搜索",
      allArticles: "全部文章",
      notFound: "页面不存在",
      notFoundDesc: "你访问的页面可能已经移动或删除。"
    },
    state: {
      articleEmpty: "还没有发布文章",
      searchEmpty: "没有找到匹配的文章",
      taxonomyEmpty: "暂无分类或标签",
      loadFailed: "加载失败，请稍后再试"
    }
  }
};

export const i18n = createI18n({
  legacy: false,
  locale: "zh-CN",
  fallbackLocale: "zh-CN",
  messages
});
