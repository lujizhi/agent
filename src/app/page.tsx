import type { Metadata } from 'next';
import EditorPage from './editor-page';

export const metadata: Metadata = {
  title: 'AI Agent 智能BI创作编辑器',
  description: 'AI驱动的智能BI大屏创作编辑器，支持自然语言生成数据大屏',
};

export default function Home() {
  return <EditorPage />;
}
