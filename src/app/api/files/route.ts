import { NextRequest, NextResponse } from 'next/server';
import { getFiles } from '@/lib/api/file-store';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: '未授权访问' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const filter = url.searchParams.get('filter') || undefined;
  const sort = url.searchParams.get('sort') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const files = await getFiles({ filter, sort, search });

  return NextResponse.json({ files });
}
