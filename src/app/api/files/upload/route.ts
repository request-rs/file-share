import { NextRequest, NextResponse } from 'next/server';
import { addFile } from '@/lib/api/file-store';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    );
  }

  const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '500', 10) * 1024 * 1024;
  const maxSizeMB = Math.round(maxSize / 1024 / 1024);

  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const cl = parseInt(contentLength, 10);
    if (cl > maxSize * 2) {
      return NextResponse.json(
        { success: false, error: 'FILE_TOO_LARGE', message: `请求体超过限制 (最大 ${maxSizeMB} MB)` },
        { status: 413 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const expiresAtRaw = formData.get('expiresAt') as string | null;

    let expireDays: number | null = null;
    if (expiresAtRaw && expiresAtRaw !== 'permanent') {
      const target = new Date(expiresAtRaw);
      const diffMs = target.getTime() - Date.now();
      expireDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'FILE_TOO_LARGE', message: `文件 "${file.name}" 超过 ${maxSizeMB} MB 限制` },
          { status: 413 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const item = await addFile(file.name, buffer, file.type, expireDays);
      uploadedFiles.push(item);
    }

    return NextResponse.json({ success: true, files: uploadedFiles });
  } catch {
    return NextResponse.json(
      { success: false, message: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
