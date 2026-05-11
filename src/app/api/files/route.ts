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

  const files = await getFiles();

  return NextResponse.json({ files });
}
