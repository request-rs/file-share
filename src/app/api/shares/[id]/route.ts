import { NextRequest, NextResponse } from 'next/server';
import { deleteShareLink } from '@/lib/api/share-store';

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

  const deleted = await deleteShareLink(params.id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, message: '分享链接不存在' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
