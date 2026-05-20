export const appConfig = {
  get defaultPassword(): string {
    return process.env.ACCESS_PASSWORD || 'share123';
  },
  get appSecret(): string {
    return process.env.APP_SECRET || 'file-share-secret-key-change-me';
  },
  get downloadTokenExpiry(): number {
    return 5 * 60 * 1000;
  },
  get maxFileSize(): number {
    const mb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '1024', 10);
    return (isNaN(mb) ? 1024 : mb) * 1024 * 1024;
  },
  get maxFileSizeMB(): number {
    return Math.round(this.maxFileSize / 1024 / 1024);
  },
  get publicMaxFileSizeMB(): number {
    const mb = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || process.env.MAX_UPLOAD_SIZE_MB || '1024', 10);
    return isNaN(mb) ? 1024 : mb;
  },
  get chunkSize(): number {
    const mb = parseInt(process.env.UPLOAD_CHUNK_SIZE_MB || '20', 10);
    return (isNaN(mb) ? 20 : mb) * 1024 * 1024;
  },
  get chunkConcurrency(): number {
    const n = parseInt(process.env.UPLOAD_CHUNK_CONCURRENCY || '3', 10);
    return isNaN(n) ? 3 : Math.max(1, Math.min(10, n));
  },
  get uploadDir(): string {
    return process.env.UPLOAD_DIR || './uploads';
  },
  get uploadTmpDir(): string {
    return process.env.UPLOAD_TMP_DIR || './uploads/tmp';
  },
  get useXAccelRedirect(): boolean {
    return process.env.USE_X_ACCEL_REDIRECT === 'true';
  },
  get xAccelRedirectPath(): string {
    return process.env.X_ACCEL_REDIRECT_PATH || '/protected-downloads/';
  },
  get appName(): string {
    return process.env.NEXT_PUBLIC_APP_NAME || '文件分享中心';
  },
  tokenStorageKey: 'auth_token',
};
