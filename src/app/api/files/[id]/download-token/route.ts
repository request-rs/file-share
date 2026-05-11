import { NextRequest, NextResponse } from 'next/server';
import { getFileRecord } from '@/lib/api/file-store';
import { createDownloadToken } from '@/lib/api/download-token';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

  const token = createDownloadToken(params.id);
  const url = `/api/files/${params.id}/download?token=${token}`;

  return NextResponse.json({ token, url });
}
