# SSP Blog Docs

本文档目录基于当前代码实现整理，面向后续开发、重构和交接。

## 文档索引

- [项目架构](./architecture.md)
- [前端设计](./frontend-design.md)
- [后端设计](./backend-design.md)

## 当前项目概览

`SSP Blog` 采用 npm workspace 管理的前后端分离结构：

- `frontend/`: Vue 3 + Vite + TypeScript 单页应用
- `backend/`: Fastify + TypeScript API 服务
- `backend/storage/blog.sqlite`: SQLite 持久化文件，首次启动自动创建

开发模式下：

- 前端运行在 `http://localhost:5173`
- 后端运行在 `http://localhost:3000`
- 前端通过 Vite 代理把 `/api` 请求转发到后端

## 适用范围

这些文档描述的是“当前实现”，不是目标蓝图。文档里的模块划分、数据流和约束均以现有代码为准。
