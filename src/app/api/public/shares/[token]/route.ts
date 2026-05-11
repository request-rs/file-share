import { NextRequest, NextResponse } from 'next/server';
import { getPublicShare } from '@/lib/api/share-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const result = await getPublicShare(params.token);

  if (!result) {
    return NextResponse.json(
      { success: false, message: '分享链接不存在或已被删除' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, share: result.share, files: result.files });
}
