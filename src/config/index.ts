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
    const mb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '500', 10);
    return (isNaN(mb) ? 500 : mb) * 1024 * 1024;
  },
  get maxFileSizeMB(): number {
    return Math.round(this.maxFileSize / 1024 / 1024);
  },
  get publicMaxFileSizeMB(): number {
    const mb = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || process.env.MAX_UPLOAD_SIZE_MB || '500', 10);
    return isNaN(mb) ? 500 : mb;
  },
  get appName(): string {
    return process.env.NEXT_PUBLIC_APP_NAME || '文件分享中心';
  },
  tokenStorageKey: 'auth_token',
};
