# 后端设计

## 1. 技术栈

- Node.js
- TypeScript
- Fastify
- Zod
- SQLite (`node:sqlite`)

当前后端目标非常明确：以最少基础设施支持博客内容读取和后台文章管理。

## 2. 启动与装配

### 2.1 入口

`backend/src/server.ts` 负责读取 `HOST` 与 `PORT`，调用 `buildApp()` 后启动 HTTP 服务。

### 2.2 应用装配

`backend/src/app.ts` 负责：

- 创建 Fastify 实例
- 注册 CORS
- 触发数据库初始化与种子写入
- 注册健康检查接口 `/api/health`
- 注册站点接口和博客接口
- 配置统一错误处理器
- 在应用关闭时关闭 SQLite 连接

整体是典型的装配式入口，便于后续继续拆模块。

## 3. 模块划分

### 3.1 路由模块

- `modules/site/site.routes.ts`
- `modules/blog/blog.routes.ts`

`site` 模块负责站点资料和统计数据输出，`blog` 模块同时覆盖：

- 公开博客接口
- 后台管理接口

这意味着“业务模块”按内容域组织，而不是按权限侧拆成完全独立服务。

### 3.2 数据模块

- `lib/database.ts`: 建库、建表、连接单例
- `data/bootstrap.ts`: 首次启动种子数据写入
- `data/seed.ts`: 默认分类、标签、站点资料
- `data/repository.ts`: 仓储访问与核心业务规则

## 4. 接口设计

### 4.1 统一响应格式

所有接口都返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败响应通过 `fail()` 返回统一结构，便于前端统一处理。

### 4.2 公开接口

- `GET /api/site/profile`
- `GET /api/articles`
- `GET /api/articles/:slug`
- `GET /api/categories`
- `GET /api/categories/:slug/articles`
- `GET /api/tags`
- `GET /api/tags/:slug/articles`
- `GET /api/archive`
- `GET /api/search`

### 4.3 后台接口

- `GET /api/admin/articles`
- `GET /api/admin/articles/:id`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/:id`
- `PATCH /api/admin/articles/:id/status`
- `DELETE /api/admin/articles/:id`
- `POST /api/admin/tags`

### 4.4 校验策略

路由层使用 Zod 做参数和请求体校验，包括：

- 分页参数
- 分类、标签、搜索条件
- 文章创建/更新载荷
- 发布状态
- 标签创建载荷

Zod 抛错后由全局错误处理器统一转为 `400`。

## 5. 仓储层设计

`backend/src/data/repository.ts` 是当前后端的核心。

### 5.1 承担的职责

- SQL 查询和结果映射
- 文章、分类、标签领域对象组装
- 文章 slug 唯一性校验
- 分类存在性校验
- 标签存在性校验
- 标签 slug 生成
- 阅读时长估算
- 浏览量累加
- 归档聚合和搜索过滤

### 5.2 当前风格

这里采用“仓储 + 轻业务规则”的做法，而不是：

- Controller -> Service -> Repository 三层

好处是实现快，MVP 成本低；代价是仓储文件会逐步变大，复杂业务扩展时边界会变模糊。

### 5.3 查询策略

当前文章列表、搜索、归档等查询流程大致是：

1. 从 SQLite 取出文章及分类。
2. 再为文章批量查询标签。
3. 在 Node 进程内做过滤、搜索和分页。

这种策略在小数据量下足够简单，但并不适合大量文章：

- 分页不是数据库级分页
- 搜索不是数据库级全文搜索
- 筛选主要依赖内存遍历

## 6. 数据模型设计

数据库由 `backend/src/lib/database.ts` 初始化。

### 6.1 表结构

- `categories`: 分类
- `tags`: 标签
- `articles`: 文章主体
- `article_tags`: 文章和标签多对多关系
- `site_configs`: 站点配置
- `social_links`: 社交链接

### 6.2 关键约束

- `categories.slug` 唯一
- `tags.slug` 唯一
- `articles.slug` 唯一
- `articles.status` 限制为 `published` 或 `draft`
- `article_tags` 联合主键防止重复关联
- 多个外键开启级联删除或引用校验

### 6.3 索引

当前已建索引：

- `idx_articles_status_created_at`
- `idx_articles_category_id`
- `idx_article_tags_tag_id`
- `idx_social_links_site_config_id`

这些索引主要服务于：

- 按状态和时间排序文章
- 分类维度查询
- 标签关联查询
- 站点社交链接查询

## 7. 业务规则

### 7.1 文章

- 新建和更新文章时会校验 slug 唯一性
- 分类必须存在
- 标签必须存在，或由前端先调用创建标签接口
- 阅读时长会根据英文单词数和 CJK 字符数估算
- 读取已发布文章详情时会自动增加 `views`

### 7.2 标签

- 标签按名称去重，不区分大小写
- 支持自动生成 slug
- 如果 slug 已被占用，会自动追加后缀

### 7.3 站点信息

- 站点基础资料和社交链接来自 `site_configs` 与 `social_links`
- 文章数、分类数、标签数通过仓储层聚合后返回给前端

## 8. 错误处理设计

后端有两类明确错误通道：

- `ZodError`: 输入校验失败，返回 `400`
- `RepositoryHttpError`: 仓储层显式业务错误，返回自定义状态码

其余错误统一作为 `500 Internal server error` 返回。

这种处理方式对当前体量够用，而且前端可以稳定消费错误消息。

## 9. 种子与初始化设计

首次启动时：

1. 建立 SQLite 文件和表结构。
2. 检查分类、标签、文章、站点配置是否为空。
3. 仅在为空时写入种子数据。

当前默认数据包含：

- 若干分类
- 若干标签
- 站点资料和社交链接
- 文章数组目前默认是空

这种设计让项目开箱可运行，但也意味着当前内容管理几乎完全依赖后台人工录入。

## 10. 当前后端实现的优点与风险

### 优点

- 启动简单，无额外数据库服务依赖
- 模块数量少，排障路径短
- Zod + TypeScript 保证了较好的输入和类型一致性
- SQLite 适合个人博客 MVP、本地开发和低成本部署

### 风险和不足

- 没有鉴权和权限校验
- 仓储层文件职责偏重
- 搜索、筛选、分页没有充分利用 SQL
- 没有测试覆盖
- 没有上传、媒体、评论、RSS、SEO 衍生内容等扩展能力

## 11. 后端演进建议

- 为后台接口加鉴权
- 把复杂业务从 repository 拆到 service 层
- 将分页、搜索、筛选尽量下推到 SQL
- 为文章搜索引入 SQLite FTS 或外部搜索方案
- 增加接口测试、仓储层测试和数据迁移机制
