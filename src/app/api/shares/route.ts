import { NextRequest, NextResponse } from 'next/server';
import { getShares, createShareLink } from '@/lib/api/share-store';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    );
  }

  const shares = await getShares();
  return NextResponse.json({ shares });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { fileIds, expiresAt, title } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { success: false, message: '请至少选择一个文件' },
        { status: 400 }
      );
    }

    const share = await createShareLink({ fileIds, expiresAt, title });
    if (!share) {
      return NextResponse.json(
        { success: false, message: '所选文件不存在' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, share });
  } catch {
    return NextResponse.json(
      { success: false, message: '创建分享链接失败' },
      { status: 500 }
    );
  }
}
