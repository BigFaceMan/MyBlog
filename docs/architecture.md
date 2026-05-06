# 项目架构

## 1. 总体架构

当前项目是一个前后端分离、同仓库维护的博客 MVP：

- 前端负责博客展示、登录注册和后台管理界面
- 后端负责公开内容接口、认证与 session、后台管理接口
- SQLite 负责本地持久化

```text
Browser
  -> Vue 3 SPA (frontend)
  -> /api/*
  -> Fastify API (backend)
  -> Repository / Auth Service
  -> SQLite (backend/storage/blog.sqlite)
```

公开博客和后台管理共用一个 SPA。后台能力当前包括：

- 文章管理
- 标签管理
- 类别管理
- 用户管理
- 站点资料管理

## 2. 仓库结构

```text
sspblog/
  package.json              # workspace 根脚本
  frontend/                 # 博客站点 + 后台管理 SPA
  backend/                  # API 服务 + SQLite
  docs/                     # 当前实现文档
```

根脚本主要负责：

- `npm run dev`: 并行启动前后端
- `npm run build`: 顺序构建 backend 和 frontend
- `npm run type-check`: 顺序执行两端类型检查

## 3. 运行链路

### 3.1 开发期链路

1. 浏览器访问 Vite 前端应用。
2. 前端发起 `/api/*` 请求。
3. Vite dev server 将请求代理到 `http://localhost:3000`。
4. Fastify 路由调用仓储层或认证服务。
5. 仓储层读写 SQLite。
6. 后端统一返回 `{ code, message, data }`。

### 3.2 后端启动阶段

后端启动流程集中在 `backend/src/server.ts` 和 `backend/src/app.ts`：

1. 读取 `.env`。
2. 构建 Fastify 实例并启用日志。
3. 注册 CORS。
4. 初始化 SQLite 文件、表和索引。
5. 在数据为空时写入分类、标签、站点资料种子。
6. 根据环境变量确保 root 用户存在。
7. 注册健康检查、认证、站点和博客路由。
8. 通过全局 `preHandler` 保护 `/api/admin/*`，但放行 `/api/admin/auth/*`。
9. 配置统一错误处理器。

## 4. 前后端职责边界

### 前端职责

- 路由管理和页面编排
- 调用 API 并处理加载、空态、错误态
- 维护登录状态和 root 后台入口
- Markdown 渲染、代码高亮和文章目录
- 站点资料缓存

### 后端职责

- 请求参数校验
- 文章、分类、标签、归档和搜索查询
- 用户注册登录、session 校验和 root 权限控制
- 后台文章、标签、类别、用户和站点资料管理
- SQLite 数据访问与业务约束

## 5. 模块划分

### 5.1 前端

- `src/router`: 路由定义与守卫
- `src/views`: 页面层
- `src/components/layout`: 公共布局
- `src/components/blog`: 文章展示与 Markdown 渲染
- `src/components/sidebar`: 侧栏卡片与目录
- `src/components/admin`: 后台布局与导航
- `src/api`: API 访问层
- `src/stores`: Pinia 状态

### 5.2 后端

- `src/server.ts`: 服务启动入口
- `src/app.ts`: 应用装配、错误处理和权限钩子
- `src/modules/auth`: 登录注册、session、后台用户管理
- `src/modules/site`: 站点资料接口
- `src/modules/blog`: 公开博客接口 + 后台内容接口
- `src/data/repository.ts`: 文章、分类、标签、站点资料仓储与规则
- `src/data/bootstrap.ts`: 首次启动种子写入
- `src/lib/database.ts`: SQLite 初始化和连接
- `src/lib/password.ts`: scrypt 密码哈希

## 6. 当前实现特点

### 已落地能力

- 分类支持父子层级，公开分类页和后台编辑都能处理 `parentId`
- 分类统计会递归汇总子类文章数
- 分类过滤会自动包含所有后代分类
- 后台可管理 root / 普通用户，并支持启用、禁用、重置密码
- 站点资料由后台配置后，前台作者卡片、公告和关于页直接复用
- 文章列表、搜索和归档返回的是“基于正文生成的预览摘要”，不是数据库原始摘要字段

### 当前限制

- 列表筛选、搜索和分页主要在内存中完成，尚未下推到 SQL
- 后台和公开站点共用一个 SPA，权限复杂度继续提高后耦合会变重
- 没有 SSR / SSG、媒体上传、评论、RSS 生成和测试覆盖
- 数据库里预留了 `admin_sessions` 表，但当前认证流程只使用 `user_sessions`
