import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  ArrowRight,
  Clock,
  Settings,
  User,
  CheckCircle2
} from 'lucide-react';
import { ChatSession, SubjectMode, AcademicLevel, ThemeMode, MathDetailLevel } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions?: ChatSession[];
  currentSessionId?: string;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteSession?: (id: string, e: React.MouseEvent) => void;
  onClearAllHistory?: () => void;
  onExportPdf?: () => void;
  onOpenStudyPlan?: () => void;
  onOpenDictionary?: () => void;
  onOpenQuiz?: () => void;
  onGenerateSummary?: () => void;
  onOpenSettings?: () => void;
  onOpenAccount?: () => void;
  userEmail?: string;
  userName?: string;
  mode?: SubjectMode;
  onSelectMode?: (mode: SubjectMode) => void;
  level?: AcademicLevel;
  onSelectLevel?: (level: AcademicLevel) => void;
  mathDetailLevel?: MathDetailLevel;
  onSelectMathDetail?: (level: MathDetailLevel) => void;
  autoSpeak?: boolean;
  onToggleAutoSpeak?: () => void;
  theme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  onReturnToSplash?: () => void;
  onPresetPrompt?: (prompt: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onClearAllHistory,
  onOpenStudyPlan,
  onOpenDictionary,
  onOpenQuiz,
  onGenerateSummary,
  onOpenSettings,
  onOpenAccount,
  userEmail = 'fatimadieye186@gmail.com',
  userName = 'Fatima Dieye',
  onReturnToSplash,
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX;
    if (delta < 0) {
      setTouchDeltaX(delta);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null && touchDeltaX < -40) {
      onClose();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isOpen && touchDeltaX < 0 ? `translateX(${touchDeltaX}px)` : undefined,
          transition: touchDeltaX < 0 ? 'none' : undefined,
        }}
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:overflow-hidden md:border-r-0'
        }`}
      >
        {/* Top Header with Logo and Close */}
        <div className="p-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-header)] flex items-center justify-between shrink-0">
          <div 
            onClick={() => {
              if (onReturnToSplash) onReturnToSplash();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            title="Accueil JANGO"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center text-white font-black text-xs shadow-[0_0_12px_#0A84FF] group-hover:scale-105 transition-transform">
              J
            </div>
            <h2 className="text-[#0A84FF] font-black text-base tracking-widest group-hover:text-[#00D4FF] transition-colors">
              JANGO
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {/* 1. Les 4 options principales ordonnées avec leurs symboles */}
          <div className="space-y-1">
            {/* Planning 📅 */}
            {onOpenStudyPlan && (
              <button
                onClick={() => {
                  onOpenStudyPlan();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium text-[var(--text-primary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <span>Planning</span>
                <span className="text-base select-none">📅</span>
              </button>
            )}

            {/* Le dictionnaire 📖 (placé sous le planning) */}
            {onOpenDictionary && (
              <button
                onClick={() => {
                  onOpenDictionary();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium text-[var(--text-primary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <span>Le dictionnaire</span>
                <span className="text-base select-none">📖</span>
              </button>
            )}

            {/* Le quiz ⚡️ */}
            {onOpenQuiz && (
              <button
                onClick={() => {
                  onOpenQuiz();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium text-[var(--text-primary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <span>Le quiz</span>
                <span className="text-base select-none">⚡️</span>
              </button>
            )}

            {/* La Synthèse 📝 */}
            {onGenerateSummary && (
              <button
                onClick={() => {
                  onGenerateSummary();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium text-[var(--text-primary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <span>La Synthèse</span>
                <span className="text-base select-none">📝</span>
              </button>
            )}
          </div>

          {/* Ligne horizontale de séparation */}
          <div className="h-px bg-[var(--border-subtle)] my-3" />

          {/* 2. Historique des échanges & devoirs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF]" />
                <span>Historique des devoirs</span>
              </span>
              {sessions.length > 0 && onClearAllHistory && (
                <button
                  onClick={onClearAllHistory}
                  className="text-[10px] text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                  title="Effacer l'historique"
                >
                  Effacer
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] italic px-2 py-2">
                Aucun devoir enregistré pour le moment
              </p>
            ) : (
              <div className="space-y-1">
                {sessions.map((sess) => {
                  const isSelected = sess.id === currentSessionId;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => {
                        if (onSelectSession) onSelectSession(sess.id);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-[#0A84FF]/15 text-[#0A84FF] dark:text-[#00D4FF] border-[#0A84FF]/30 font-medium'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] border-[var(--border-card)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <MessageSquare className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />
                        <span className="truncate">{sess.title || 'Devoir résolu'}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1 opacity-70" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Footer du Menu : Bouton Personne inscrite ET Bouton Paramètres distincts */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-header)] shrink-0 space-y-2">
          {/* Bouton de la personne qui s'est inscrite */}
          <button
            onClick={() => {
              if (onOpenAccount) onOpenAccount();
              else if (onOpenSettings) onOpenSettings();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] border border-[var(--border-card)] text-left transition-all cursor-pointer group flex items-center justify-between"
            title="Profil de la personne inscrite"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                FD
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5 truncate">
                  <span>{userName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-500 font-normal">
                    Inscrit
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                  {userEmail}
                </div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[#0A84FF] dark:group-hover:text-[#00D4FF] transition-colors shrink-0 ml-1" />
          </button>

          {/* Bouton de Paramètres ⚙️ */}
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] border border-[var(--border-card)] text-left transition-all cursor-pointer group flex items-center justify-between"
            title="Ouvrir les paramètres"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/15 text-[#0A84FF] dark:text-[#00D4FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                <span>Paramètres</span>
                <span className="text-xs">⚙️</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[#0A84FF] dark:group-hover:text-[#00D4FF] transition-colors shrink-0 ml-1" />
          </button>
        </div>
      </aside>
    </>
  );
};
