import { NextRequest, NextResponse } from 'next/server';
import { getFileRecord, incrementDownloadCount } from '@/lib/api/file-store';
import { verifyDownloadToken } from '@/lib/api/download-token';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const USE_X_ACCEL = process.env.USE_X_ACCEL_REDIRECT === 'true';
const X_ACCEL_PATH = process.env.X_ACCEL_REDIRECT_PATH || '/protected-downloads/';

function isStoragePathSafe(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const uploadDir = path.resolve(UPLOAD_DIR);
  return resolved.startsWith(uploadDir + path.sep) || resolved === uploadDir;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');

  let authorized = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authorized = true;
  } else if (queryToken) {
    const payload = verifyDownloadToken(queryToken);
    if (payload && payload.fileId === params.id) {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
  }

  const record = await getFileRecord(params.id);

  if (!record) {
    return NextResponse.json({ success: false, message: '文件不存在' }, { status: 404 });
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return NextResponse.json({ success: false, message: '文件已过期' }, { status: 410 });
  }

  if (!isStoragePathSafe(record.storagePath)) {
    return NextResponse.json({ success: false, message: '文件不存在' }, { status: 404 });
  }

  try {
    const fileStat = await stat(record.storagePath);
    incrementDownloadCount(record.id).catch(() => {});

    if (USE_X_ACCEL) {
      const redirectPath = `${X_ACCEL_PATH.replace(/\/$/, '')}/${path.basename(record.storagePath)}`;
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': record.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.originalName)}`,
          'Content-Length': String(fileStat.size),
          'X-Accel-Redirect': redirectPath,
        },
      });
    }

    const stream = createReadStream(record.storagePath);
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(Buffer.from(chunk)));
        });
        stream.on('end', () => { controller.close(); });
        stream.on('error', (err) => { controller.error(err); });
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': record.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.originalName)}`,
        'Content-Length': String(fileStat.size),
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: '文件不存在' }, { status: 404 });
  }
}
