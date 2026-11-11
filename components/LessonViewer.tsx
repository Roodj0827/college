'use client';

import { FileText } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { markProgress } from '@/app/actions/student';

export default function LessonViewer({
  moduleId, title, videoUrl, pdfUrl, completed,
}: { moduleId: string; title: string; videoUrl: string | null; pdfUrl: string | null; completed: boolean }) {
  return (
    <div className="space-y-5">
      {(videoUrl || !pdfUrl) && (
        <VideoPlayer key={moduleId} title={title} videoUrl={videoUrl} initialCompleted={completed} onProgressChange={(c) => markProgress(moduleId, c)} />
      )}
      {pdfUrl && (
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-brand" aria-hidden /> Support de cours (PDF)</p>
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn btn-ghost py-1 text-xs">Ouvrir dans un onglet</a>
          </div>
          <iframe src={pdfUrl} title={`PDF : ${title}`} className="h-[70vh] w-full" />
        </div>
      )}
    </div>
  );
}
