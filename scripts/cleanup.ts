import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';

const prisma = new PrismaClient();

async function cleanup() {
  const now = new Date();

  const expiredFiles = await prisma.file.findMany({
    where: { expiresAt: { lt: now } },
  });

  console.log(`找到 ${expiredFiles.length} 个过期文件`);

  let deletedDisk = 0;
  let deletedDb = 0;
  let errors = 0;

  for (const file of expiredFiles) {
    try {
      await fs.unlink(file.storagePath);
      deletedDisk++;
    } catch {
      // File may already be deleted from disk
    }

    try {
      await prisma.file.delete({ where: { id: file.id } });
      deletedDb++;
    } catch {
      errors++;
      console.error(`删除数据库记录失败: ${file.id}`);
    }
  }

  console.log('--- 清理完成 ---');
  console.log(`磁盘文件删除: ${deletedDisk} 个`);
  console.log(`数据库记录删除: ${deletedDb} 个`);
  if (errors > 0) {
    console.log(`失败: ${errors} 个`);
  }

  await prisma.$disconnect();
}

cleanup().catch((e) => {
  console.error('清理失败:', e);
  process.exit(1);
});
