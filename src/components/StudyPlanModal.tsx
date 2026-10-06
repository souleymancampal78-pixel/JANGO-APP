import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  X, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Circle, 
  RefreshCw, 
  FileDown, 
  BookOpen, 
  Lightbulb, 
  AlertCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import { ChatSession, StudyPlan } from '../types';
import { exportStudyPlanToPdf } from '../utils/exportPdf';

interface StudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentLevel: string;
}

export const StudyPlanModal: React.FC<StudyPlanModalProps> = ({
  isOpen,
  onClose,
  sessions,
  currentLevel,
}) => {
  const [plan, setPlan] = useState<StudyPlan | null>(() => {
    try {
      const saved = localStorage.getItem('jangoia_study_plan');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load study plan:', e);
    }
    return null;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Save plan in storage
  useEffect(() => {
    if (plan) {
      try {
        localStorage.setItem('jangoia_study_plan', JSON.stringify(plan));
      } catch (e) {
        console.error('Failed to save study plan:', e);
      }
    }
  }, [plan]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build summary of previous session topics
      const sessionSummaries = sessions.map((s) => {
        const userQuestions = s.messages
          .filter((m) => m.role === 'user')
          .map((m) => m.text.slice(0, 100));

        return {
          title: s.title,
          mode: s.mode,
          level: s.level,
          topics: userQuestions,
        };
      });

      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessions: sessionSummaries,
          currentLevel: currentLevel,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur serveur (${res.status})`);
      }

      const newPlan: StudyPlan = await res.json();
      setPlan(newPlan);
      showToast('Nouveau planning généré avec succès !');
    } catch (err: any) {
      console.error('Failed to generate study plan:', err);
      setError(err.message || 'Impossible de générer le planning de révision.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = (dayIndex: number, taskId: string) => {
    if (!plan) return;

    const updatedDays = plan.days.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;

      const updatedTasks = day.tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, completed: !task.completed };
        }
        return task;
      });

      return { ...day, tasks: updatedTasks };
    });

    setPlan({ ...plan, days: updatedDays });
  };

  const handleExportPdf = () => {
    if (!plan) return;
    exportStudyPlanToPdf(plan);
    showToast('Document PDF du planning téléchargé !');
  };

  // Compute total progress
  let totalTasks = 0;
  let completedTasks = 0;
  if (plan && plan.days) {
    plan.days.forEach((d) => {
      d.tasks.forEach((t) => {
        totalTasks++;
        if (t.completed) completedTasks++;
      });
    });
  }
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Extract detected topics names
  const detectedTopics = sessions
    .filter((s) => s.title && s.title !== 'Mon premier cours')
    .map((s) => s.title)
    .slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[var(--modal-bg)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-header)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] text-white flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.4)] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>Planning de Révision IA</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] dark:text-[#00D4FF] border border-[#0A84FF]/30">
                  {currentLevel.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Programme d'étude optimisé par JANGO selon les devoirs et exercices traités
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

        {/* Toast alert */}
        {toast && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[var(--bg-primary)]">
          {/* Loading Animation State */}
          {isGenerating ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center text-white font-black text-2xl shadow-[0_0_35px_#0A84FF] animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  JANGO élabore ton planning de révision...
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm">
                  Analyse de tes sessions passées, répartition équilibrée des notions et génération de micro-objectifs ciblés.
                </p>
              </div>
            </div>
          ) : !plan ? (
            /* Empty state: prompt to generate */
            <div className="py-8 flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#0A84FF]/15 text-[#0A84FF] dark:text-[#00D4FF] flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Aucun planning actif pour le moment
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  JANGO peut analyser les sujets abordés dans tes {sessions.length} session{sessions.length > 1 ? 's' : ''} pour te créer un programme hebdomadaire pas à pas.
                </p>
              </div>

              {/* Detected topics pills */}
              {detectedTopics.length > 0 && (
                <div className="w-full text-left p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-card)] space-y-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                    Notions détectées dans tes sessions :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedTopics.map((top, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] truncate max-w-xs"
                      >
                        📌 {top}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGeneratePlan}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] hover:from-[#0070e0] hover:to-[#00b8e6] text-white font-bold text-sm shadow-[0_0_25px_rgba(10,132,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Générer mon planning de révision IA</span>
              </button>
            </div>
          ) : (
            /* Active Study Plan Display */
            <div className="space-y-4">
              {/* Summary and Progress Card */}
              <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-card)] shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#0A84FF] dark:text-[#00D4FF] uppercase tracking-wider">
                      Synthèse du programme
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                      {plan.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportPdf}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] border border-[var(--border-card)] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Télécharger la fiche de révision en PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF]" />
                      <span>Export PDF</span>
                    </button>
                    <button
                      onClick={handleGeneratePlan}
                      className="px-3 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070e0] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                      title="Régénérer le planning avec l'IA"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Régénérer</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0A84FF]" />
                      Progression : {completedTasks} / {totalTasks} tâches complétées
                    </span>
                    <span className="font-bold text-[#0A84FF] dark:text-[#00D4FF]">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden border border-[var(--border-subtle)]">
                    <div
                      className="h-full bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Weekly Key Goals */}
                {plan.goals && plan.goals.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <Target className="w-3.5 h-3.5 text-[#0A84FF]" />
                      <span>Objectifs de révision :</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[var(--text-secondary)]">
                      {plan.goals.map((g, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF] shrink-0" />
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Schedule Cards */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block px-1">
                  Calendrier détaillé jour par jour :
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {plan.days.map((day, dIdx) => {
                    const priorityColors = {
                      Haute: 'bg-red-500/10 text-red-500 border-red-500/30',
                      Moyenne: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                      Normale: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                    }[day.priority] || 'bg-blue-500/10 text-blue-500 border-blue-500/30';

                    return (
                      <div
                        key={dIdx}
                        className="p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-card)] hover:border-[#0A84FF]/30 transition-all shadow-xs space-y-2.5"
                      >
                        {/* Day Card Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#0A84FF] text-white">
                              {day.dayName}
                            </span>
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                              {day.focus}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-mono text-[10px] border border-[var(--border-subtle)]">
                              <Clock className="w-3 h-3 text-[#0A84FF]" />
                              {day.durationMinutes} min
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${priorityColors}`}>
                              {day.priority}
                            </span>
                          </div>
                        </div>

                        {/* Tasks Checklist */}
                        <div className="space-y-1.5 pl-1">
                          {day.tasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => toggleTask(dIdx, task.id)}
                              className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                                task.completed
                                  ? 'bg-[var(--bg-tertiary)]/50 opacity-60'
                                  : 'hover:bg-[var(--card-hover)]'
                              }`}
                            >
                              <button
                                className="mt-0.5 shrink-0 focus:outline-none"
                                aria-label="Valider la tâche"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-[var(--text-muted)]" />
                                )}
                              </button>
                              <span
                                className={`text-xs leading-relaxed select-text ${
                                  task.completed
                                    ? 'line-through text-[var(--text-muted)]'
                                    : 'text-[var(--text-secondary)]'
                                }`}
                              >
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Tip */}
                        {day.tip && (
                          <div className="p-2 rounded-lg bg-[#0A84FF]/10 border border-[#0A84FF]/20 text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF] shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-[var(--text-primary)]">Astuce JANGO :</strong>{' '}
                              {day.tip}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Methodology Advice Card */}
              {plan.advice && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0A84FF]/15 to-[#00D4FF]/10 border border-[#0A84FF]/30 text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block mb-0.5">
                      Conseil méthodologique de JANGO
                    </span>
                    <p className="leading-relaxed">{plan.advice}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[var(--bg-header)] border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
          <span>JANGO Tuteur Intelligent • Répétition espacée & planification active</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border border-[var(--border-card)] font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
