import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { SAMPLE_EXERCISES, SampleExercise } from '../data/sampleExercises';

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleExercise) => void;
}

export const SampleModal: React.FC<SampleModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-header)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/20 text-[#0A84FF] dark:text-[#00D4FF] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-sm sm:text-base">
                Exemples d'exercices à tester
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Choisis un devoir type pour tester instantanément la résolution photo par JANGO.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exercises Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 bg-[var(--bg-primary)]">
          {SAMPLE_EXERCISES.map((sample) => (
            <div
              key={sample.id}
              className="p-3.5 sm:p-4 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] border border-[var(--border-card)] hover:border-[#0A84FF]/40 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group shadow-sm"
            >
              <div className="flex gap-3 items-start sm:items-center min-w-0">
                <img
                  src={sample.imageDataUrl}
                  alt={sample.title}
                  className="w-20 sm:w-28 h-16 rounded-lg object-cover bg-black border border-[var(--border-card)] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0A84FF]/15 text-[#0A84FF] dark:text-[#00D4FF]">
                      {sample.subject}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {sample.level}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[#0A84FF] dark:group-hover:text-[#00D4FF] transition-colors truncate">
                    {sample.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                    {sample.question}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectSample(sample);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070e0] text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span>Résoudre</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
