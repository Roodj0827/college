'use client';

import { useEffect, useState } from 'react';
import { Play, CheckCircle, Video } from 'lucide-react';

interface VideoPlayerProps {
  title: string;
  videoUrl: string | null;
  initialCompleted?: boolean;
  onProgressChange?: (completed: boolean) => void | Promise<void>;
}

type Source = { kind: 'embed' | 'file'; src: string } | null;

function resolveSource(rawUrl: string): Source {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '');
    const yt = (id: string | null) =>
      id ? ({ kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` } as const) : null;

    if (host === 'youtu.be') return yt(url.pathname.slice(1));
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') return yt(url.searchParams.get('v'));
      if (url.pathname.startsWith('/embed/')) return { kind: 'embed', src: rawUrl };
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? { kind: 'embed', src: `https://player.vimeo.com/video/${id}` } : null;
    }
    if (host === 'player.vimeo.com') return { kind: 'embed', src: rawUrl };
    return { kind: 'file', src: rawUrl };
  } catch {
    return null;
  }
}

export default function VideoPlayer({ title, videoUrl, initialCompleted = false, onProgressChange }: VideoPlayerProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  useEffect(() => setIsCompleted(initialCompleted), [videoUrl, initialCompleted]);

  const source = videoUrl ? resolveSource(videoUrl) : null;

  if (!source) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-12 text-slate-400">
        <Video className="mb-3 h-12 w-12 opacity-50" aria-hidden />
        <p className="text-sm">{videoUrl ? 'Le lien vidéo de cette leçon est invalide.' : 'Aucune vidéo pour cette leçon.'}</p>
      </div>
    );
  }

  const update = async (next: boolean) => {
    const prev = isCompleted;
    setIsCompleted(next);
    try { await onProgressChange?.(next); } catch { setIsCompleted(prev); }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
        {source.kind === 'embed' ? (
          <iframe
            src={source.src}
            title={title}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video controls preload="metadata" onEnded={() => !isCompleted && update(true)} className="h-full w-full object-contain" controlsList="nodownload">
            <source src={source.src} />
            Votre navigateur ne supporte pas la lecture de cette vidéo.
          </video>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-white">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-200 md:text-base">
          <Play className="h-4 w-4 shrink-0 fill-indigo-400 text-indigo-400" aria-hidden />
          <span className="truncate">{title}</span>
        </h3>
        <button
          type="button"
          aria-pressed={isCompleted}
          onClick={() => update(!isCompleted)}
          className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            isCompleted ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <CheckCircle className="h-4 w-4" aria-hidden />
          {isCompleted ? 'Leçon terminée' : 'Marquer comme vu'}
        </button>
      </div>
    </div>
  );
}
