import { NextRequest, NextResponse } from 'next/server';
import { getFileRecord, incrementDownloadCount } from '@/lib/api/file-store';
import { promises as fs } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !queryToken) {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    );
  }

  const record = await getFileRecord(params.id);

  if (!record) {
    return NextResponse.json(
      { success: false, message: '文件不存在' },
      { status: 404 }
    );
  }

  if (new Date(record.expiresAt) < new Date()) {
    return NextResponse.json(
      { success: false, message: '文件已过期' },
      { status: 410 }
    );
  }

  try {
    await fs.access(record.storagePath);
  } catch {
    return NextResponse.json(
      { success: false, message: '文件不存在' },
      { status: 404 }
    );
  }

  const stat = await fs.stat(record.storagePath);
  const fileBuffer = await fs.readFile(record.storagePath);

  incrementDownloadCount(record.id).catch(() => {});

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': record.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.originalName)}`,
      'Content-Length': String(stat.size),
    },
  });
}
