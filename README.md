# 文件分享中心

简易文件分享平台，支持密码登录、拖拽上传、文件列表和下载。

## 技术栈

- Next.js 13.5 App Router + TypeScript
- Prisma ORM + SQLite（支持切换 PostgreSQL）
- Tailwind CSS

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 修改密码和路径

# 初始化数据库
npx prisma migrate deploy

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm start
```

启动后访问 http://localhost:3000

**默认访问密码:** `share123`（可通过 `ACCESS_PASSWORD` 环境变量修改）

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ACCESS_PASSWORD` | 访问密码 | `share123` |
| `DATABASE_URL` | 数据库连接字符串 | `file:./prisma/dev.db` |
| `UPLOAD_DIR` | 文件存储目录 | `./uploads` |
| `MAX_UPLOAD_SIZE_MB` | 单文件最大上传大小 (MB) | `500` |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | `文件分享中心` |

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务 |
| `npm run lint` | 代码检查 |
| `npm run cleanup` | 清理过期文件（删除磁盘文件 + 数据库记录） |
| `npm run db:migrate` | 创建数据库迁移（开发环境） |
| `npm run db:migrate:deploy` | 应用数据库迁移（生产环境） |
| `npm run db:generate` | 生成 Prisma Client |

## 项目结构

```
src/
├── app/                      # Next.js App Router 页面和 API
│   ├── api/                  # API 路由
│   │   ├── auth/login/       # POST /api/auth/login
│   │   └── files/            # GET/POST 文件接口
│   ├── dashboard/            # 文件列表页
│   ├── page.tsx              # 登录页
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式 (Tailwind)
├── components/               # React 组件
│   ├── AuthGuard.tsx         # 登录守卫
│   ├── LoginForm.tsx         # 登录表单
│   ├── Header.tsx            # 顶部导航
│   ├── FileUpload.tsx        # 文件上传 (拖拽+点击)
│   ├── FileList.tsx          # 文件列表 (含空/加载/错误态)
│   └── FileItem.tsx          # 单个文件项 (含下载)
├── config/                   # 项目配置
│   └── index.ts
├── lib/                      # 工具库
│   ├── api/                  # API 抽象层
│   │   ├── client.ts         # 统一请求客户端
│   │   ├── auth.ts           # 认证 API
│   │   ├── files.ts          # 文件 API
│   │   └── file-store.ts     # Prisma 文件存储
│   └── db/
│       └── prisma.ts         # Prisma 客户端单例
├── types/                    # TypeScript 类型
│   └── file.ts
└── utils/                    # 工具函数
    └── format.ts
prisma/
  └── schema.prisma           # 数据库模型定义
scripts/
  └── cleanup.ts              # 过期文件清理脚本
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 密码登录 |
| GET | `/api/files` | 获取文件列表 |
| POST | `/api/files/upload` | 上传文件（multipart） |
| GET | `/api/files/:id/download` | 下载文件 |

## 功能特性

- 密码登录保护
- 拖拽 + 点击上传文件（多文件支持）
- 上传进度条
- 文件持久化存储（磁盘 + 数据库）
- 文件列表（名称、大小、上传时间、到期时间、状态）
- 过期文件自动禁下载
- 空状态 / 加载态 / 错误态处理
- 响应式布局（桌面 + 移动端）
- 定时清理过期文件脚本

## 部署

详细部署说明请参考 [DEPLOY.md](./DEPLOY.md)
