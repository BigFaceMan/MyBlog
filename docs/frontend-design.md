# 前端设计

## 1. 技术栈

- Vue 3
- Vue Router 4
- Pinia
- Vue I18n
- Element Plus
- Vite
- TypeScript
- `markdown-it` + `highlight.js`

前端是一个单页应用，同时承载访客博客和作者后台。

## 2. 应用结构

### 2.1 入口

`frontend/src/main.ts` 负责：

- 创建 Vue 应用
- 注册 Pinia、Router 和 I18n
- 注册 Element Plus 组件
- 注入全局样式

`App.vue` 在启动时会同时拉取：

- 当前登录态
- 站点资料

### 2.2 布局

- `AppHeader.vue`: 顶部导航、搜索入口、登录态和移动端抽屉菜单
- `PageShell.vue`: 公开页面的双栏骨架，可关闭侧栏
- `AdminLayout.vue`: 后台页面的左侧导航布局
- `AdminNav.vue`: 后台菜单

公开侧栏当前由这些卡片组成：

- `AuthorCard.vue`
- `AnnouncementCard.vue`
- `TaxonomyCard.vue`

文章详情页额外使用：

- `ContentTocCard.vue`

## 3. 路由设计

### 3.1 公开页面

- `/`: 首页文章列表
- `/articles/:slug`: 文章详情
- `/categories`: 分类页
- `/categories/:slug`: 分类文章页
- `/tags`: 标签页
- `/tags/:slug`: 标签文章页
- `/archive`: 归档页
- `/search`: 搜索页
- `/about`: 关于页

### 3.2 认证页面

- `/login`: 登录
- `/register`: 注册
- `/admin/login`: 重定向到 `/login?redirect=/admin`

### 3.3 后台页面

- `/admin`: 文章管理
- `/admin/articles/new`: 新建文章
- `/admin/articles/:id/edit`: 编辑文章
- `/admin/tags`: 标签管理
- `/admin/categories`: 类别管理
- `/admin/users`: 用户管理
- `/admin/profile`: 个人简介管理

### 3.4 路由守卫

- 登录页和注册页会在已登录时自动跳转
- `/admin/*` 会先检查 session
- 未登录用户会被重定向到登录页
- 非 root 用户访问后台会被重定向到首页
- 所有页面切换都会回到顶部

## 4. 组件分层

### 4.1 博客展示层

- `ArticleList.vue`: 文章列表容器
- `ArticleCard.vue`: 文章卡片，左右布局会交错显示
- `ArticleMeta.vue`: 时间、分类和标签元信息
- `MarkdownRenderer.vue`: Markdown 渲染与代码高亮

### 4.2 公共状态层

- `StateBlock.vue`: 统一加载态、错误态和空态
- `SearchModal.vue`: 顶部全局搜索弹窗，支持防抖查询和首条结果跳转

### 4.3 后台层

- `AdminArticleListView.vue`: 文章列表、筛选、发布状态切换和删除
- `AdminArticleEditorView.vue`: 文章编辑、预览和标签自动创建
- `AdminTaxonomyView.vue`: 标签 / 类别统一管理页
- `AdminUserView.vue`: 用户创建、启用禁用、角色切换和密码重置
- `AdminProfileView.vue`: 站点资料与社交链接管理

## 5. 数据访问

### 5.1 `api/http.ts`

`request()` 是统一请求入口，负责：

- 读取 `VITE_API_BASE_URL`
- 自动带上 `credentials: "include"`
- 解析统一响应结构
- 在 HTTP 失败或业务 `code !== 0` 时抛出 `HttpError`

### 5.2 `api/blog.ts`

封装公开站点查询接口：

- 站点资料
- 文章列表 / 详情
- 分类 / 标签列表
- 分类 / 标签文章列表
- 归档
- 搜索

### 5.3 `api/admin.ts`

封装后台管理接口：

- 文章管理
- 标签管理
- 类别管理
- 站点资料管理
- 用户管理

### 5.4 `api/auth.ts`

封装登录态接口：

- 登录
- 注册
- 退出
- 查询当前会话

## 6. 状态管理

当前有两个显式 Pinia store：

- `siteStore`: 缓存站点资料、加载状态和错误信息
- `authStore`: 缓存当前用户、会话检查状态和登录态

这样做的好处是：

- 站点资料只需要加载一次
- 导航栏、路由守卫和登录页可以共享会话状态

当前仍有一些列表类数据按页面局部请求，重复请求是可以接受的，但后续可以继续收敛。

## 7. 交互设计

### 7.1 首页与列表页

- 首页展示分页文章流
- 分类页支持分类树 + 文章列表，子分类会缩进显示
- 标签页展示标签云 + 文章列表
- 搜索页通过路由 query `q` 持久化条件
- 归档页按年 / 月组织文章

### 7.2 文章详情页

- 使用头图、标题和元信息作为主视觉
- 正文使用 Markdown 渲染
- 渲染时禁用原始 HTML
- 目录组件只抽取 `h2` 到 `h4`
- 页面展示字数、阅读时间和浏览量

### 7.3 后台编辑页

- 标题输入会自动生成 slug
- 可以手动覆盖 slug
- 支持草稿 / 已发布切换
- 支持本地标签输入，新标签会在保存时自动创建
- 右侧提供封面预览和 Markdown 实时预览

### 7.4 登录注册页

- 登录和注册共用同一视图
- 登录成功后按 redirect 返回
- 注册成功后直接返回首页

## 8. 视觉设计

### 8.1 风格

当前视觉是浅色卡片式布局，主色偏绿色，配合柔和阴影、半透明导航和大块留白。

### 8.2 背景与层次

- `base.css` 使用渐变和装饰背景
- 文章详情页和封面页采用大图首屏
- 卡片 hover 会有轻微上浮和边框高亮

### 8.3 响应式

- 顶部导航在小屏切为抽屉菜单
- `PageShell` 在窄屏下退化为单栏
- 文章卡片在小屏下上下排列
- 搜索表单、后台筛选区和表单会自动改为单列
- 后台侧栏在窄屏下取消 sticky

## 9. 国际化

I18n 当前只配置了 `zh-CN`，但文案里仍保留了一些英文词条和品牌文本，属于当前实现状态。

## 10. 当前限制

- 没有 SSR / SSG
- 管理端和展示端仍共用一个 SPA
- 搜索仍是后端关键词匹配，不是全文检索
- 没有媒体上传和自动保存
- 侧栏聚合数据目前仍是各组件分别请求
