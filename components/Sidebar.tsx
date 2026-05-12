'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare, Image, GalleryHorizontal, Settings, LogOut,
  Plus, ChevronLeft, ChevronRight, Trash2, ShieldCheck, Sparkles, Menu, X
} from 'lucide-react';

interface Conversation {
  _id: string;
  title: string;
  model: string;
  updatedAt: string;
}

interface SidebarProps {
  onNewChat?: () => void;
  activeConvId?: string;
  onSelectConv?: (id: string) => void;
}

export default function Sidebar({ onNewChat, activeConvId, onSelectConv }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {}
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      });
      setConversations(prev => prev.filter(c => c._id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const navItems = [
    { href: '/chat', label: 'Chat IA', icon: MessageSquare },
    { href: '/generate', label: 'Generar Imágenes', icon: Image },
    { href: '/gallery', label: 'Mi Galería', icon: GalleryHorizontal },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-navy-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-600 flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">AI Studio</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-4">
        <button
          onClick={() => { onNewChat?.(); setMobileOpen(false); }}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-accent-600/20 border border-accent-500/30 
                      text-accent-400 hover:bg-accent-600/30 transition-all duration-200 font-medium text-sm
                      ${collapsed ? 'justify-center' : ''}`}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Nuevo Chat</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`${isActive ? 'sidebar-item-active' : 'sidebar-item'} ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {session?.user?.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`${pathname === '/admin' ? 'sidebar-item-active' : 'sidebar-item'} ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Panel Admin</span>}
          </Link>
        )}
      </nav>

      {/* Conversation History */}
      {!collapsed && pathname === '/chat' && (
        <div className="flex-1 overflow-y-auto px-3 mt-4">
          <p className="text-xs text-navy-500 font-semibold uppercase tracking-wider mb-2 px-1">
            Conversaciones
          </p>
          <div className="space-y-1">
            {conversations.map(conv => (
              <div
                key={conv._id}
                onClick={() => { onSelectConv?.(conv._id); setMobileOpen(false); }}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-sm
                  ${activeConvId === conv._id
                    ? 'bg-navy-800 text-white border border-navy-600'
                    : 'text-navy-400 hover:text-navy-200 hover:bg-navy-800/50'
                  }`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(conv._id, e)}
                  disabled={deletingId === conv._id}
                  className="opacity-0 group-hover:opacity-100 text-navy-500 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-navy-600 text-center py-4">Sin conversaciones aún</p>
            )}
          </div>
        </div>
      )}

      {/* User Footer */}
      <div className="mt-auto border-t border-navy-700/50 p-3">
        <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-navy-200">
              {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-100 truncate">{session?.user?.name}</p>
              <p className={`text-xs ${session?.user?.role === 'admin' ? 'text-amber-400' : 'text-navy-400'}`}>
                {session?.user?.role === 'admin' ? '★ Admin' : 'Usuario'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-navy-500 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-navy-900 border border-navy-700 rounded-xl flex items-center justify-center text-navy-300"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full bg-navy-950 border-r border-navy-800 z-40 w-72 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col h-full bg-navy-950/80 backdrop-blur border-r border-navy-800/80 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
