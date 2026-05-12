'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, Loader2, Download, Info, ChevronDown, ChevronUp, Wand2, Paperclip, X } from 'lucide-react';

type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';
type Quality = 'standard' | 'hd';

interface GenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [quality, setQuality] = useState<Quality>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState('');
  const [showRevised, setShowRevised] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ url: string; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    'Un gato astronauta flotando en el espacio, estilo acuarela',
    'Paisaje futurista de ciudad bajo el océano, arte digital',
    'Retrato de una mujer guerrera fantástica con armadura de dragón',
    'Casa en el árbol mágica en un bosque encantado al atardecer',
    'Robot cocinero en una cocina moderna y elegante',
    'Ciudad cyberpunk en la lluvia con luces de neón',
  ];

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.url;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachedImage({ url, file });
    e.target.value = '';
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setResult(null);

    let imageUrl: string | undefined;

    try {
      if (attachedImage) {
        imageUrl = await uploadImage(attachedImage.file);
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, quality, imageUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ imageUrl: data.imageUrl, revisedPrompt: data.revisedPrompt });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar la imagen');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!result?.imageUrl) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `ai-image-${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-accent-600/20 border border-accent-500/30 rounded-full px-4 py-1.5">
          <Sparkles className="w-4 h-4 text-accent-400" />
          <span className="text-sm text-accent-300 font-medium">DALL-E 3</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Generador de Imágenes</h1>
        <p className="text-navy-400 text-sm">Describe la imagen que quieres crear o sube una para usarla de guía</p>
      </div>

      {/* Main Card */}
      <div className="card p-6 space-y-5">
        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-navy-300">Descripción de la imagen</label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Adjuntar imagen guía
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {attachedImage && (
            <div className="relative inline-block mt-2">
              <Image src={attachedImage.url} alt="Guía" width={100} height={100} className="rounded-xl border border-accent-500/30 object-cover h-24 w-24" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ej: Aplica el estilo Patchwork extremo a esta imagen con hilos gruesos 3D..."
            disabled={isGenerating}
            rows={4}
            className="input-field resize-none mt-2"
          />
          <p className="text-xs text-navy-500">{prompt.length}/4000 caracteres</p>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy-300">Tamaño</label>
            <select
              value={size}
              onChange={e => setSize(e.target.value as ImageSize)}
              disabled={isGenerating}
              className="input-field"
            >
              <option value="1024x1024">Cuadrado (1024×1024)</option>
              <option value="1792x1024">Panorámico (1792×1024)</option>
              <option value="1024x1792">Vertical (1024×1792)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy-300">Calidad</label>
            <select
              value={quality}
              onChange={e => setQuality(e.target.value as Quality)}
              disabled={isGenerating}
              className="input-field"
            >
              <option value="standard">Estándar</option>
              <option value="hd">HD (más detalle)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={isGenerating || !prompt.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generando imagen...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generar Imagen</span>
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {!result && !isGenerating && (
        <div className="space-y-3">
          <p className="text-sm text-navy-400 font-medium">💡 Ideas para empezar</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="card-hover p-3 text-sm text-navy-300 hover:text-white text-left transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generating skeleton */}
      {isGenerating && (
        <div className="card p-4">
          <div className="aspect-square max-w-lg mx-auto bg-navy-800/50 rounded-xl animate-pulse flex items-center justify-center">
            <div className="text-center space-y-3">
              <Sparkles className="w-10 h-10 text-navy-600 mx-auto animate-spin-slow" />
              <p className="text-navy-500 text-sm">DALL-E 3 está creando tu imagen...</p>
              <p className="text-navy-600 text-xs">Puede tardar 10-20 segundos</p>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !isGenerating && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src={result.imageUrl}
              alt={prompt}
              width={1024}
              height={1024}
              className="w-full h-auto rounded-xl"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={downloadImage} className="btn-secondary flex items-center gap-2 flex-1 justify-center">
              <Download className="w-4 h-4" />
              Descargar
            </button>
            <button onClick={generate} disabled={isGenerating} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Sparkles className="w-4 h-4" />
              Regenerar
            </button>
          </div>

          {result.revisedPrompt && (
            <div className="space-y-2">
              <button
                onClick={() => setShowRevised(!showRevised)}
                className="flex items-center gap-2 text-xs text-navy-400 hover:text-navy-200 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                Prompt mejorado por IA
                {showRevised ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showRevised && (
                <p className="text-xs text-navy-400 bg-navy-900/60 rounded-xl p-3 border border-navy-700/50">
                  {result.revisedPrompt}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
