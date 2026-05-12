'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, X, Bot, User, Copy, Check } from 'lucide-react';
import Image from 'next/image';
import ModelSelector from './ModelSelector';

type Model = 'gpt-4o' | 'gpt-4o-mini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  generatedImage?: string;
}

interface ChatWindowProps {
  conversationId?: string;
  initialMessages?: Message[];
  onConversationCreated?: (id: string) => void;
}

export default function ChatWindow({ conversationId, initialMessages = [], onConversationCreated }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [model, setModel] = useState<Model>('gpt-4o-mini');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ url: string; file: File } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.url;
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() && !attachedImage) return;
    if (isStreaming) return;

    let imageUrl: string | undefined;

    if (attachedImage) {
      try {
        imageUrl = await uploadImage(attachedImage.file);
      } catch {
        alert('Error al subir la imagen. Inténtalo de nuevo.');
        return;
      }
    }

    const userMessage: Message = { role: 'user', content: input.trim(), imageUrl };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachedImage(null);
    setIsStreaming(true);

    // Placeholder para la respuesta de la IA
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          model,
          conversationId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Error en la respuesta');

      // Verificar si la respuesta es JSON (Imagen generada) o Stream (Texto)
      const contentType = res.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await res.json();
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { 
            role: 'assistant', 
            content: data.content, 
            generatedImage: data.generatedImage 
          };
          return updated;
        });
      } else {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let aiContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const { text } = JSON.parse(data);
              aiContent += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: aiContent };
                return updated;
              });
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: '⚠️ Error al obtener respuesta. Inténtalo de nuevo.' };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, attachedImage, isStreaming, messages, model, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachedImage({ url, file });
    e.target.value = '';
  };

  const copyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-accent-600/20 border border-accent-500/30 flex items-center justify-center">
              <Bot className="w-8 h-8 text-accent-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">¿En qué puedo ayudarte?</h2>
              <p className="text-navy-400 text-sm">Escribe tu mensaje o adjunta una imagen</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md w-full mt-4">
              {['Explícame un concepto', 'Analiza esta imagen', 'Escríbeme un texto', 'Ayúdame a programar'].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="card-hover p-3 text-sm text-navy-300 hover:text-white text-left transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-accent-600' : 'bg-navy-800 border border-navy-700'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-accent-400" />}
            </div>

            {/* Bubble */}
            <div className={`group relative max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {msg.imageUrl && (
                <div className={`rounded-xl overflow-hidden ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                  <Image src={msg.imageUrl} alt="Imagen adjunta" width={300} height={200} className="object-cover rounded-xl" />
                </div>
              )}
              {msg.generatedImage && (
                <div className="rounded-2xl overflow-hidden border-2 border-accent-500/30 shadow-lg shadow-accent-500/10 animate-fade-in mb-2">
                  <a href={msg.generatedImage} target="_blank" rel="noopener noreferrer">
                    <Image 
                      src={msg.generatedImage} 
                      alt="Imagen generada" 
                      width={512} 
                      height={512} 
                      className="object-cover w-full h-auto cursor-zoom-in hover:scale-[1.02] transition-transform" 
                    />
                  </a>
                </div>
              )}
              {msg.content && (
                <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                  {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                    <div className="flex gap-1.5 py-1">
                      <span className="w-2 h-2 bg-accent-400 rounded-full dot-flashing" />
                      <span className="w-2 h-2 bg-accent-400 rounded-full dot-flashing" />
                      <span className="w-2 h-2 bg-accent-400 rounded-full dot-flashing" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  )}
                </div>
              )}
              {msg.role === 'assistant' && msg.content && (
                <button
                  onClick={() => copyMessage(msg.content, idx)}
                  className="opacity-0 group-hover:opacity-100 text-navy-500 hover:text-navy-300 transition-all self-start"
                >
                  {copiedId === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-navy-800/80 p-4 bg-navy-950/60 backdrop-blur">
        {/* Attached image preview */}
        {attachedImage && (
          <div className="mb-3 flex items-start gap-3">
            <div className="relative">
              <Image src={attachedImage.url} alt="Adjunto" width={80} height={60} className="rounded-xl object-cover border border-navy-700" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Model selector */}
          <ModelSelector value={model} onChange={setModel} disabled={isStreaming} />

          {/* Text area */}
          <div className="flex-1 flex items-end gap-2 bg-navy-900/60 border border-navy-700 rounded-2xl px-4 py-3 focus-within:border-accent-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje... (Enter para enviar)"
              disabled={isStreaming}
              rows={1}
              className="flex-1 bg-transparent text-navy-50 placeholder:text-navy-500 text-sm resize-none outline-none max-h-40 overflow-y-auto leading-relaxed"
              style={{ height: 'auto' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 160) + 'px';
              }}
            />

            {/* Attach file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="text-navy-400 hover:text-accent-400 transition-colors flex-shrink-0"
              title="Adjuntar imagen"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={isStreaming || (!input.trim() && !attachedImage)}
            className="btn-primary px-4 py-3 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
