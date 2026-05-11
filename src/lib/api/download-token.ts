import { appConfig } from '@/config';
import { createHmac } from 'crypto';

export interface DownloadTokenPayload {
  fileId: string;
  exp: number;
}

export function createDownloadToken(fileId: string): string {
  const payload: DownloadTokenPayload = {
    fileId,
    exp: Date.now() + appConfig.downloadTokenExpiry,
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', appConfig.appSecret)
    .update(payloadStr)
    .digest('base64url');
  return `${payloadStr}.${signature}`;
}

export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  try {
    const [payloadStr, signature] = token.split('.');
    if (!payloadStr || !signature) return null;

    const expectedSig = createHmac('sha256', appConfig.appSecret)
      .update(payloadStr)
      .digest('base64url');

    if (!timingSafeEqual(signature, expectedSig)) return null;

    const payload: DownloadTokenPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString()
    );

    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    a += '';
    b += '';
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}
