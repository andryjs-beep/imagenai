'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Trash2, Download, GalleryHorizontal, X, ZoomIn, Calendar } from 'lucide-react';

interface GeneratedImage {
  _id: string;
  prompt: string;
  cloudinaryUrl: string;
  size: string;
  createdAt: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch('/api/images');
      const data = await res.json();
      setImages(data.images || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const deleteImage = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      await fetch('/api/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      setImages(prev => prev.filter(img => img._id !== imageId));
      if (lightboxImage?._id === imageId) setLightboxImage(null);
    } finally {
      setDeletingId(null);
    }
  };

  const downloadImage = (url: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-navy-800/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-navy-800/60 border border-navy-700 flex items-center justify-center">
          <GalleryHorizontal className="w-8 h-8 text-navy-600" />
        </div>
        <div className="text-center">
          <p className="text-navy-300 font-medium">Tu galería está vacía</p>
          <p className="text-navy-500 text-sm mt-1">Las imágenes que generes aparecerán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Mi Galería</h2>
            <p className="text-navy-400 text-sm mt-0.5">{images.length} imagen{images.length !== 1 ? 'es' : ''} generada{images.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(img => (
            <div key={img._id} className="group relative rounded-2xl overflow-hidden card aspect-square cursor-pointer">
              <Image
                src={img.cloudinaryUrl}
                alt={img.prompt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onClick={() => setLightboxImage(img)}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/60 transition-all duration-300 flex items-end">
                <div className="w-full p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs line-clamp-2 mb-2">{img.prompt}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxImage(img); }}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      <ZoomIn className="w-3 h-3" /> Ver
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadImage(img.cloudinaryUrl, img.prompt); }}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs p-1.5 rounded-lg transition-all"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteImage(img._id); }}
                      disabled={deletingId === img._id}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs p-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-navy-900/60 rounded-xl p-2 transition-all">
            <X className="w-5 h-5" />
          </button>

          <div
            className="max-w-4xl w-full bg-navy-950 rounded-2xl overflow-hidden border border-navy-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-square max-h-[70vh]">
              <Image
                src={lightboxImage.cloudinaryUrl}
                alt={lightboxImage.prompt}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-4 space-y-3">
              <p className="text-navy-200 text-sm">{lightboxImage.prompt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-navy-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(lightboxImage.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadImage(lightboxImage.cloudinaryUrl, lightboxImage.prompt)} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </button>
                  <button onClick={() => deleteImage(lightboxImage._id)} disabled={deletingId === lightboxImage._id} className="btn-danger text-sm py-1.5 px-3 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
