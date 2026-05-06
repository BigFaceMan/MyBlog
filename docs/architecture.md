# 项目架构

## 1. 总体架构

当前项目是一个轻量博客 MVP，采用前后端分离但同仓库维护的方式：

- 前端负责页面渲染、路由切换、管理端编辑交互
- 后端负责内容查询、用户注册登录、root 后台权限、文章管理、标签管理和站点信息输出
- SQLite 负责本地持久化，适合单机 MVP 和低运维复杂度场景

```text
Browser
  -> Vue 3 SPA (frontend)
  -> /api/*
  -> Fastify API (backend)
  -> Repository
  -> SQLite (backend/storage/blog.sqlite)
```

## 2. 代码仓结构

```text
sspblog/
  package.json              # workspace 根脚本
  frontend/                 # 博客站点 + 管理后台 SPA
  backend/                  # API 服务 + SQLite 数据访问
  docs/                     # 项目文档
```

根目录通过 npm workspaces 统一管理 `frontend` 和 `backend`，根脚本主要做三件事：

- `npm run dev`: 并行启动前后端
- `npm run build`: 顺序构建 backend 和 frontend
- `npm run type-check`: 顺序做两端类型检查

## 3. 运行链路

### 3.1 开发期链路

1. 访问浏览器中的 Vite 前端应用。
2. 前端发起 `/api/*` 请求。
3. Vite dev server 代理请求到 `http://localhost:3000`。
4. Fastify 路由调用仓储层。
5. 仓储层读写 SQLite。
6. 后端统一返回 `{ code, message, data }` 结构。

### 3.2 启动阶段

后端启动流程在 `backend/src/server.ts` 和 `backend/src/app.ts` 中完成：

1. 构建 Fastify 实例并开启日志。
2. 注册 CORS。
3. 初始化数据库文件和表结构。
4. 首次启动时写入分类、标签、站点信息和种子文章。
5. 注册登录注册接口，并用请求钩子保护 `/api/admin/*`。
6. 注册站点接口与博客接口。
7. 挂载统一错误处理器和健康检查接口。

## 4. 前后端职责边界

### 前端职责

- 路由管理和页面编排
- 调用 API 并处理加载、空态、错误态
- 展示博客站点和后台管理界面
- 维护登录状态，只有 root 登录后才展示后台入口
- Markdown 内容预览和渲染
- 基础站点信息缓存

### 后端职责

- 请求参数校验
- 文章、分类、标签、归档、搜索的数据聚合
- 用户注册、登录、退出和 session cookie 校验
- 后台文章、标签、类别增删改查
- 标签自动创建
- 文章阅读时浏览量累加
- SQLite 数据访问和约束检查

## 5. 模块划分

### 5.1 前端

- `src/router`: 路由定义
- `src/views`: 页面层
- `src/components`: 可复用布局、文章、侧栏、状态组件
- `src/api`: API 访问层
- `src/stores`: Pinia 状态
- `src/styles`: 全局样式与 Element Plus 主题覆盖

### 5.2 后端

- `src/server.ts`: 服务启动入口
- `src/app.ts`: 应用装配
- `src/modules/*`: 路由模块
- `src/modules/auth`: 用户登录注册、root 初始化与 session
- `src/data/repository.ts`: 仓储层和主要业务规则
- `src/data/bootstrap.ts`: 首次启动数据注入
- `src/lib/database.ts`: SQLite 初始化和连接管理
- `src/utils/response.ts`: 响应结构封装

## 6. 当前架构特点

### 优点

- 简单直接，MVP 成本低
- 前后端边界清晰，便于独立演进
- SQLite 和仓储层封装让本地开发门槛很低
- 管理后台和博客站点共享一套类型和 API 模型，联调成本低

### 当前限制

- 后端没有独立 service 层，路由直接依赖仓储函数
- 搜索、分类过滤、分页主要在内存中过滤，数据量上来后会有性能瓶颈
- 当前只有 `root` 和普通用户两类角色，没有找回密码、邮箱验证等完整账户体系
- 文章封面仅支持 URL，没有上传、媒体管理能力
- 前端公共站点和后台共用一个 SPA，后续权限体系复杂后可能需要拆分

## 7. 建议的演进方向

- 数据量增加后，把搜索、筛选、分页下推到 SQL 层
- 后续如需多人协作，再增加用户表、角色和更细权限边界
- 在仓储层之上增加 service 层，承接更复杂的业务编排
- 拆出内容管理、站点配置、媒体管理等独立模块
- 为前后端补充接口测试和页面级测试
