'use client';

import Sidebar from '@/components/Sidebar';
import AdminPanel from '@/components/AdminPanel';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/chat');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-navy-950">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative h-full">
        <AdminPanel />
      </main>
    </div>
  );
}
