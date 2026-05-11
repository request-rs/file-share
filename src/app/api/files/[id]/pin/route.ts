import { NextRequest, NextResponse } from 'next/server';
import { setFilePinned } from '@/lib/api/file-store';

export async function PATCH(
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

  try {
    const body = await request.json();
    const { isPinned } = body;

    if (typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isPinned must be boolean' },
        { status: 400 }
      );
    }

    const file = await setFilePinned(params.id, isPinned);
    if (!file) {
      return NextResponse.json(
        { success: false, message: '文件不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, file });
  } catch {
    return NextResponse.json(
      { success: false, message: '操作失败' },
      { status: 500 }
    );
  }
}
