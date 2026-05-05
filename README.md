<!--
 * @Author: ssp
 * @Date: 2026-05-05 18:49:17
 * @LastEditTime: 2026-05-05 19:35:36
-->
# SSP Blog MVP

Vue 3 + Vite frontend and TypeScript Fastify backend for a personal blog MVP.

The backend uses SQLite persistence through Node's built-in `node:sqlite` module. The database file is created automatically at `backend/storage/blog.sqlite` and seeded on first startup.

## Scripts

```bash
npm install
npm run dev
npm run type-check
npm run build
```

Frontend: http://localhost:5173

Backend: http://localhost:3000

Database: `backend/storage/blog.sqlite`
