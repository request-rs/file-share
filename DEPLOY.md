# 部署指南

## 环境要求

- Node.js 20+（推荐使用 nvm 管理版本）
- 操作系统：Linux 或 Windows Server
- 进程管理工具：PM2（推荐）或 systemd

## 1. 创建目录结构

```bash
# 创建数据存储目录
sudo mkdir -p /data/file-share/uploads
sudo mkdir -p /data/file-share/db

# 设置权限（假设 nginx/www 用户运行服务）
sudo chown -R www:www /data/file-share
sudo chmod -R 755 /data/file-share
```

## 2. 配置环境变量

将项目推送到服务器后，复制环境变量模板：

```bash
cp .env.example .env.production
```

编辑 `.env.production`：

```env
ACCESS_PASSWORD=your_secure_password
DATABASE_URL=file:/data/file-share/db/database.sqlite
UPLOAD_DIR=/data/file-share/uploads
MAX_UPLOAD_SIZE_MB=500
NEXT_PUBLIC_APP_NAME=文件分享中心
```

生产环境下 Next.js 会自动加载 `.env.production` 文件，或通过 `.env.production.local` 覆盖（该文件不提交到 Git）。

## 3. 安装依赖

```bash
npm ci --production=false
```

> `--production=false` 确保 devDependencies（如 prisma, typescript）也被安装，这些是构建所需。

## 4. 初始化数据库

### 4.1 生成 Prisma Client

```bash
npx prisma generate
```

### 4.2 执行数据库迁移

开发环境（本地开发时创建迁移）：

```bash
npx prisma migrate dev --name init
```

生产环境（部署服务器上应用已有迁移）：

```bash
npx prisma migrate deploy
```

> `deploy` 命令只执行已有迁移文件，不创建新的迁移文件，适合 CI/CD 流程。

## 5. 构建项目

```bash
npm run build
```

## 6. 启动服务

### 6.1 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "file-share" -- start

# 查看状态
pm2 status

# 保存 PM2 进程列表（开机自启）
pm2 save

# 设置开机自启
pm2 startup
```

### 6.2 使用 systemd

创建 `/etc/systemd/system/file-share.service`：

```ini
[Unit]
Description=File Sharing Center
After=network.target

[Service]
Type=simple
User=www
WorkingDirectory=/opt/file-share
EnvironmentFile=/opt/file-share/.env.production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable file-share
sudo systemctl start file-share
```

### 6.3 直接启动（调试用）

```bash
npm start
```

默认监听 `http://localhost:3000`。

## 7. Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 500m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

注意 `client_max_body_size` 需要匹配 `MAX_UPLOAD_SIZE_MB` 的大小。

## 8. 定时清理过期文件

使用 crontab 定时执行清理脚本：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点执行清理
0 2 * * * cd /opt/file-share && npx tsx scripts/cleanup.ts >> /var/log/file-share-cleanup.log 2>&1
```

也可以手动执行：

```bash
npm run cleanup
```

## 9. 备份策略

### 9.1 备份数据库

```bash
# 停止服务
pm2 stop file-share

# 备份数据库文件
cp /data/file-share/db/database.sqlite /backup/$(date +%Y%m%d)-database.sqlite

# 启动服务
pm2 start file-share
```

或者不停止服务直接复制（SQLite 的 WAL 模式下可以安全复制）：

```bash
sqlite3 /data/file-share/db/database.sqlite ".backup /backup/$(date +%Y%m%d)-database.sqlite"
```

### 9.2 备份上传文件

```bash
tar -czf /backup/$(date +%Y%m%d)-uploads.tar.gz -C /data/file-share uploads
```

### 9.3 自动备份脚本

创建 `/opt/file-share/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/backup/file-share"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup database
sqlite3 /data/file-share/db/database.sqlite ".backup $BACKUP_DIR/$DATE-database.sqlite"

# Backup uploads
tar -czf "$BACKUP_DIR/$DATE-uploads.tar.gz" -C /data/file-share uploads

# Keep only last 7 days
find "$BACKUP_DIR" -mtime +7 -delete

echo "Backup completed: $DATE"
```

添加到 crontab 每天备份：

```bash
0 3 * * * /opt/file-share/backup.sh >> /var/log/file-share-backup.log 2>&1
```

## 10. 切换 PostgreSQL

如需切换为 PostgreSQL：

1. 修改 `.env.production` 中的 `DATABASE_URL`：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/file_share
```

2. 修改 `prisma/schema.prisma` 中的数据源：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. 重新生成 Prisma Client 并执行迁移：

```bash
npx prisma generate
npx prisma migrate deploy
```

其他代码无需修改——Prisma 自动适配数据库差异。

## 11. 故障排查

| 问题 | 检查项 |
|------|--------|
| 构建失败 | 确认 `npx prisma generate` 已执行、Node.js 版本 >= 20 |
| 500 错误 | 检查 `/data/file-share/uploads` 权限、数据库文件是否存在 |
| 文件不存在 | 检查 UPLOAD_DIR 配置是否与迁移时一致 |
| 数据库锁定 | SQLite 默认不支持高并发写入，考虑切换 PostgreSQL |
