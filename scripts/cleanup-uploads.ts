import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_TMP_DIR = process.env.UPLOAD_TMP_DIR || './uploads/tmp';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

async function cleanup() {
  console.log(`扫描临时分片目录: ${UPLOAD_TMP_DIR}`);

  let cleaned = 0;
  try {
    await fs.mkdir(UPLOAD_TMP_DIR, { recursive: true });
    const entries = await fs.readdir(UPLOAD_TMP_DIR, { withFileTypes: true });
    const now = Date.now();

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = path.join(UPLOAD_TMP_DIR, entry.name);
      try {
        const stat = await fs.stat(dirPath);
        const age = now - stat.mtimeMs;
        if (age > MAX_AGE_MS) {
          await fs.rm(dirPath, { recursive: true, force: true });
          cleaned++;
          console.log(`已清理: ${dirPath} (已存在 ${Math.round(age / 3600000)} 小时)`);
        }
      } catch {
        // skip
      }
    }
  } catch (e) {
    console.error('清理失败:', e);
    process.exit(1);
  }

  console.log(`--- 清理完成 ---`);
  console.log(`清除临时分片目录: ${cleaned} 个`);
}

cleanup().catch((e) => {
  console.error('清理失败:', e);
  process.exit(1);
});
