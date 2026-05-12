'use client';

import Sidebar from '@/components/Sidebar';
import Gallery from '@/components/Gallery';

export default function GalleryPage() {
  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative h-full">
        <Gallery />
      </main>
    </div>
  );
}
