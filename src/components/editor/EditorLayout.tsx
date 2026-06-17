'use client';

import React from 'react';
import { TopToolbar } from './TopToolbar';
import { TopNavBar } from './TopNavBar';
import { Canvas } from './Canvas';
import { RightSidebar } from './RightSidebar';
import { BottomStatusBar } from './BottomStatusBar';

export function EditorLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      <TopToolbar />
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <RightSidebar />
      </div>
      <BottomStatusBar />
    </div>
  );
}
