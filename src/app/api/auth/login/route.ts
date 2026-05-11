import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '@/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: '请输入访问密码' },
        { status: 400 }
      );
    }

    if (password !== appConfig.defaultPassword) {
      return NextResponse.json(
        { success: false, message: '密码错误，请重试' },
        { status: 401 }
      );
    }

    const token = 'mock-token-' + Date.now() + '-' + Math.random().toString(36).substring(2);

    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
