'use client';

import Sidebar from '@/components/Sidebar';
import ImageGenerator from '@/components/ImageGenerator';

export default function GeneratePage() {
  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative h-full">
        <ImageGenerator />
      </main>
    </div>
  );
}
