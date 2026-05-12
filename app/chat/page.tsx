'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';

export default function ChatPage() {
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0); // Para forzar reset del ChatWindow

  const handleNewChat = () => {
    setActiveConvId(undefined);
    setChatKey(prev => prev + 1);
  };

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setChatKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      <Sidebar 
        onNewChat={handleNewChat} 
        activeConvId={activeConvId} 
        onSelectConv={handleSelectConv}
      />
      <main className="flex-1 flex flex-col relative h-full">
        <ChatWindow 
          key={chatKey}
          conversationId={activeConvId}
        />
      </main>
    </div>
  );
}
