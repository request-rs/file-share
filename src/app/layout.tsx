import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '文件分享中心',
  description: '简易文件分享平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
