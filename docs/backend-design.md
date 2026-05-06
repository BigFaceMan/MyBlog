# 后端设计

## 1. 技术栈

- Node.js
- TypeScript
- Fastify
- Zod
- SQLite (`node:sqlite`)

后端目标很明确：用最少基础设施支撑博客内容读取、后台编辑和账号管理。

## 2. 启动与装配

### 2.1 入口

`backend/src/server.ts` 负责读取 `HOST` 和 `PORT`，调用 `buildApp()` 后启动 HTTP 服务。

### 2.2 应用装配

`backend/src/app.ts` 负责：

- 创建 Fastify 实例
- 注册 CORS
- 初始化数据库和种子数据
- 确保 root 用户存在
- 注册 `/api/health`
- 注册认证、站点和博客路由
- 通过 `preHandler` 保护 `/api/admin/*`，但放行 `/api/admin/auth/*`
- 挂载统一错误处理器
- 在应用关闭时释放 SQLite 连接

## 3. 路由设计

### 3.1 公共接口

- `GET /api/health`
- `GET /api/site/profile`
- `GET /api/articles`
- `GET /api/articles/:slug`
- `GET /api/categories`
- `GET /api/categories/:slug/articles`
- `GET /api/tags`
- `GET /api/tags/:slug/articles`
- `GET /api/archive`
- `GET /api/search`

### 3.2 认证接口

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`

同一组处理器也挂载了：

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

### 3.3 后台接口

文章：

- `GET /api/admin/articles`
- `GET /api/admin/articles/:id`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/:id`
- `PATCH /api/admin/articles/:id/status`
- `DELETE /api/admin/articles/:id`

标签：

- `GET /api/admin/tags`
- `POST /api/admin/tags`
- `PUT /api/admin/tags/:id`
- `DELETE /api/admin/tags/:id`

类别：

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`

站点资料：

- `GET /api/admin/site/profile`
- `PUT /api/admin/site/profile`

用户：

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `PATCH /api/admin/users/:id/password`
- `DELETE /api/admin/users/:id`

## 4. 请求校验

路由层使用 Zod 校验：

- 分页参数
- 分类、标签和搜索条件
- 文章创建 / 更新载荷
- 标签和类别表单
- 站点资料
- 用户创建、更新和重置密码

Zod 抛错后由全局错误处理器统一转成 `400`。

## 5. 数据模型

数据库由 `backend/src/lib/database.ts` 初始化。

### 5.1 表结构

- `categories`: 分类，支持 `parent_id`
- `tags`: 标签
- `articles`: 文章主体
- `article_tags`: 文章与标签多对多关系
- `site_configs`: 站点配置
- `social_links`: 社交链接
- `users`: 用户账户
- `user_sessions`: 登录 session
- `admin_sessions`: 预留表，当前未接入业务流程

### 5.2 关键约束

- `categories.slug`、`tags.slug`、`articles.slug` 唯一
- `articles.status` 仅允许 `published` 或 `draft`
- `article_tags` 联合主键防止重复关联
- `users.username` 唯一
- `users.role` 仅允许 `root` 或 `user`
- `users.status` 仅允许 `active` 或 `disabled`
- `user_sessions.token_hash` 唯一，数据库只保存 token 的 HMAC 摘要

### 5.3 索引

当前索引主要服务于：

- 按状态和时间排序文章
- 分类维度查询
- 标签关联查询
- 站点社交链接查询
- 用户与 session 查询

## 6. 业务规则

### 6.1 文章

- 创建和更新时必须校验 slug 唯一性
- 分类必须存在
- 标签必须存在，或由前端先调用创建标签接口
- 文章阅读时长按正文内容估算
- 读取已发布文章详情时会自动增加 `views`
- 列表、搜索和归档返回的摘要来自正文预览，不直接暴露数据库原始摘要

### 6.2 分类

- 分类支持父子层级
- 创建和更新时会校验父级存在、不能选自己或自己的子孙作为父级
- 公开分类过滤会自动包含后代分类
- 删除时如果被文章引用或仍有子分类会返回 `409`

### 6.3 标签

- 标签按名称去重，不区分大小写
- 支持自动生成 slug
- 如果 slug 被占用，会自动追加后缀

### 6.4 站点资料

- 站点资料来自 `site_configs` 和 `social_links`
- 公开接口会额外返回已发布文章、标签和分类数量
- 社交类型目前固定为 `github`、`mail`、`rss`、`twitter`

### 6.5 用户与 root 权限

- 当前支持普通用户注册登录
- root 用户名默认是 `root`，可通过 `ROOT_USERNAME` 或 `ADMIN_USERNAME` 配置
- root 密码可通过 `ROOT_PASSWORD` / `ADMIN_PASSWORD` 明文配置，或用 `ROOT_PASSWORD_HASH` / `ADMIN_PASSWORD_HASH`
- `npm run hash-password -w backend -- <password>` 可生成 scrypt 哈希
- session cookie 名称是 `sspblog_session`
- cookie 默认 7 天过期，`HttpOnly`，`SameSite=Lax`，生产环境加 `Secure`
- `/api/admin/*` 只有 root 用户可以访问，普通用户会返回 `403`
- 当前用户不能修改自己的角色、状态或删除自己
- 系统会阻止删除或降级最后一个 active root 用户

## 7. 响应与错误处理

所有接口返回统一结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

错误通道主要有：

- `ZodError`: 输入校验失败，返回 `400`
- `RepositoryHttpError`: 仓储层业务错误，返回自定义状态码
- `AuthHttpError`: 认证与用户管理错误，返回自定义状态码
- 其他错误统一返回 `500`

## 8. 种子与初始化

首次启动时：

1. 建立 SQLite 文件和表结构。
2. 在分类、标签、站点资料为空时写入种子数据。
3. 文章种子目前为空，默认不会自动插入文章。
4. 如果配置了 root 密码或密码哈希，会自动确保 root 用户存在并启用。

当前默认种子包含：

- 4 个分类
- 8 个标签
- 站点资料和社交链接
- 空文章列表

## 9. 当前风险

- 仓储层承担了较多业务规则，文件会持续变重
- 搜索、筛选和分页仍依赖内存处理
- 没有接口测试和迁移机制
