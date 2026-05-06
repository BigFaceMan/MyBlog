# SSP Blog Docs

本文档基于当前代码实现整理，面向后续开发、重构和交接。

## 文档索引

- [项目架构](./architecture.md)
- [后端设计](./backend-design.md)
- [前端设计](./frontend-design.md)

## 当前项目概览

`SSP Blog` 采用 npm workspace 管理：

- `frontend/`: Vue 3 + Vite + TypeScript 单页应用
- `backend/`: Fastify + TypeScript API 服务，使用 `node:sqlite`
- `backend/storage/blog.sqlite`: SQLite 持久化文件，首次启动自动创建

开发模式下：

- 前端运行在 `http://localhost:5173`
- 后端运行在 `http://localhost:3000`
- 前端通过 Vite 代理把 `/api` 请求转发到后端

常用脚本：

- `npm run dev`
- `npm run build`
- `npm run type-check`
- `npm run hash-password -w backend -- <password>`

## 环境变量

后端会读取根目录或 `backend/` 下的 `.env` 文件。当前核心配置包括：

- `ROOT_USERNAME` / `ROOT_PASSWORD` / `ROOT_PASSWORD_HASH`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_PASSWORD_HASH` 作为兼容别名
- `SESSION_SECRET`

## 适用范围

这些文档描述的是当前实现，不是目标蓝图。模块划分、数据流和约束均以现有代码为准。
