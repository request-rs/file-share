import { NextRequest, NextResponse } from 'next/server';
import { getShareFileRecord } from '@/lib/api/share-store';
import { incrementDownloadCount } from '@/lib/api/file-store';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

function isStoragePathSafe(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const uploadDir = path.resolve(UPLOAD_DIR);
  return resolved.startsWith(uploadDir + path.sep) || resolved === uploadDir;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; fileId: string } }
) {
  const shareFile = await getShareFileRecord(params.token, params.fileId);

  if (!shareFile) {
    return NextResponse.json(
      { success: false, message: '文件不存在或无权访问' },
      { status: 403 }
    );
  }

  const share = shareFile.shareLink;
  const file = shareFile.file;

  if (share.expiresAt && share.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, message: '分享链接已过期' },
      { status: 410 }
    );
  }

  if (!file) {
    return NextResponse.json(
      { success: false, message: '文件不存在' },
      { status: 404 }
    );
  }

  if (file.expiresAt && file.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, message: '文件已过期' },
      { status: 410 }
    );
  }

  if (!isStoragePathSafe(file.storagePath)) {
    return NextResponse.json(
      { success: false, message: '文件不存在' },
      { status: 404 }
    );
  }

  try {
    const fileStat = await stat(file.storagePath);

    incrementDownloadCount(file.id).catch(() => {});

    const stream = createReadStream(file.storagePath);
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(Buffer.from(chunk)));
        });
        stream.on('end', () => {
          controller.close();
        });
        stream.on('error', (err) => {
          controller.error(err);
        });
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
        'Content-Length': String(fileStat.size),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: '文件读取失败' },
      { status: 500 }
    );
  }
}
