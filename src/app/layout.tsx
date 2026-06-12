import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Agent 智能BI创作编辑器',
  description: 'AI驱动的智能BI大屏创作编辑器',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN" className="dark">
      <body className={`antialiased overflow-hidden`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
