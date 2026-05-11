import { NextRequest, NextResponse } from 'next/server';
import { deleteFileRecord } from '@/lib/api/file-store';

export async function DELETE(
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

  const result = await deleteFileRecord(params.id);

  if (!result) {
    return NextResponse.json(
      { success: false, message: '文件不存在' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
