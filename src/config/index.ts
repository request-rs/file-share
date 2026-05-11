export const appConfig = {
  get defaultPassword(): string {
    return process.env.ACCESS_PASSWORD || 'share123';
  },
  defaultExpireDays: 7,
  get maxFileSize(): number {
    const mb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '500', 10);
    return (isNaN(mb) ? 500 : mb) * 1024 * 1024;
  },
  get appName(): string {
    return process.env.NEXT_PUBLIC_APP_NAME || '文件分享中心';
  },
  tokenStorageKey: 'auth_token',
};
