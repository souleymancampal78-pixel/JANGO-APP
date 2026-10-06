import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Volume2, 
  Sparkles, 
  Compass, 
  Lightbulb, 
  Copy, 
  Check, 
  WifiOff,
  AlertCircle,
  Search
} from 'lucide-react';
import { DictionaryEntry } from '../types';
import { getCachedDictionaryWord, cacheDictionaryWord } from '../utils/indexedDBStorage';

interface DictionaryModalProps {
  isOpen: boolean;
  initialWord?: string | null;
  onClose: () => void;
  isOnline: boolean;
}

const SUGGESTED_WORDS = [
  'Théorème',
  'Oxymore',
  'Mitochondrie',
  'Algorithme',
  'Équation',
  'Photosynthèse',
  'Allitération'
];

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  isOpen,
  initialWord = null,
  onClose,
  isOnline,
}) => {
  const [activeWord, setActiveWord] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [data, setData] = useState<DictionaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync initialWord when opened or changed
  useEffect(() => {
    if (isOpen) {
      const initial = initialWord ? initialWord.trim() : 'Théorème';
      setActiveWord(initial);
      setSearchInput(initial);
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, initialWord]);

  // Fetch definition whenever activeWord changes
  useEffect(() => {
    if (!isOpen || !activeWord.trim()) {
      setData(null);
      return;
    }

    let isMounted = true;
    const cleanWord = activeWord.trim().toLowerCase();

    const fetchDefinition = async () => {
      setIsLoading(true);
      setError(null);

      // 1. First check IndexedDB cache (instant offline access!)
      try {
        const cached = await getCachedDictionaryWord(cleanWord);
        if (cached && isMounted) {
          setData(cached);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Erreur lecture cache IndexedDB:', err);
      }

      // If not in IndexedDB and offline, warn student
      if (!isOnline) {
        if (isMounted) {
          setError(
            "Tu es actuellement hors-ligne. Ce mot n'a pas encore été mis en cache dans IndexedDB. Reconnecte-toi pour charger sa définition."
          );
          setIsLoading(false);
        }
        return;
      }

      // 2. Fetch from backend /api/dictionary
      try {
        const res = await fetch(`/api/dictionary?word=${encodeURIComponent(cleanWord)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur dictionnaire (${res.status})`);
        }
        const entry: DictionaryEntry = await res.json();
        if (isMounted) {
          setData(entry);
          cacheDictionaryWord(entry).catch((e) => console.warn(e));
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Impossible de récupérer la définition.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDefinition();

    return () => {
      isMounted = false;
    };
  }, [activeWord, isOpen, isOnline]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveWord(searchInput.trim());
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !activeWord) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeWord);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (!data) return;
    const textToCopy = `${data.word} (${data.category || ''}) :\n${data.definition}\n\nÉtymologie : ${data.etymology}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[var(--modal-bg)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] transition-colors"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-header)] shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] text-white flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.4)] shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                    Dictionnaire & Vocabulaire 📖
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Définitions précises, étymologie et exemples scolaires
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Chercher un mot ou un concept (ex: théorème, oxymore...)"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#0A84FF] transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070e0] text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            >
              Définir
            </button>
          </form>

          {/* Suggested quick chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar">
            <span className="text-[10px] text-[var(--text-muted)] shrink-0 font-medium">Exemples :</span>
            {SUGGESTED_WORDS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setSearchInput(w);
                  setActiveWord(w);
                }}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                  activeWord.toLowerCase() === w.toLowerCase()
                    ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[#0A84FF] hover:border-[#0A84FF]/40'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[var(--bg-primary)]">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center text-white shadow-md animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Recherche de la définition et de l'étymologie...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-start gap-3">
              {isOnline ? (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-xs font-bold">Impossible de charger la définition</p>
                <p className="text-xs leading-relaxed opacity-90">{error}</p>
              </div>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Word Header with Audio & Copy */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[var(--text-primary)] capitalize">
                      {data.word}
                    </h3>
                    {data.category && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] dark:text-[#00D4FF] border border-[#0A84FF]/30 font-semibold">
                        {data.category}
                      </span>
                    )}
                  </div>
                  {data.phonetic && (
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      {data.phonetic}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSpeak}
                    className={`p-2 rounded-xl text-[var(--text-secondary)] hover:text-[#0A84FF] hover:bg-[var(--card-hover)] transition-all cursor-pointer ${
                      isSpeaking ? 'text-[#0A84FF] scale-110' : ''
                    }`}
                    title="Écouter la prononciation"
                    aria-label="Prononcer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[#0A84FF] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                    title="Copier la définition"
                    aria-label="Copier"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Definition */}
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Définition</span>
                </span>
                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                  {data.definition}
                </p>
              </div>

              {/* Example */}
              {data.example && (
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    Exemple d'usage
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] italic pl-3 border-l-2 border-[#0A84FF]/50">
                    « {data.example} »
                  </p>
                </div>
              )}

              {/* Pedagogical Tip */}
              {data.pedagogicalTip && (
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Conseil mnémotechnique & astuce</span>
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {data.pedagogicalTip}
                  </p>
                </div>
              )}

              {/* Etymology */}
              {data.etymology && (
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Origine & Étymologie</span>
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {data.etymology}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
