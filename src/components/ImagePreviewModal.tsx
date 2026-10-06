import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative max-w-4xl max-h-[90vh] bg-[var(--modal-bg)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-2xl flex flex-col"
      >
        <div className="p-3 bg-[var(--bg-header)] flex items-center justify-between border-b border-[var(--border-subtle)]">
          <span className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF]" />
            Photo de l'exercice
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto p-2 flex items-center justify-center bg-black/10 dark:bg-black">
          <img
            src={imageUrl}
            alt="Exercice agrandi"
            className="max-h-[80vh] w-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
