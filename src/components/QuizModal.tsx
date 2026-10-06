import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Lightbulb, 
  Zap,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChatSession, QuizData, AcademicLevel } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentLevel: AcademicLevel;
  onAskJangoia?: (questionText: string) => void;
}

const PRESET_TOPICS: { label: string; icon: string; level: AcademicLevel }[] = [
  { label: 'Équations du 2nd degré & Discriminant', icon: '📐', level: 'lycee' },
  { label: 'Figures de style (Métaphore, Comparaison)', icon: '✍️', level: 'college' },
  { label: 'Théorème de Pythagore & Trigonométrie', icon: '📏', level: 'college' },
  { label: 'Fonctions dérivées & Variations', icon: '📈', level: 'lycee' },
  { label: 'Accord du participe passé', icon: '📖', level: 'college' },
  { label: 'Lois de Newton & Mécanique', icon: '⚡', level: 'lycee' },
  { label: 'Fractions et pourcentages', icon: '🔢', level: 'primaire' },
];

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  sessions,
  currentLevel,
  onAskJangoia,
}) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [quizLevel, setQuizLevel] = useState<AcademicLevel>(currentLevel);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active quiz state
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answersHistory, setAnswersHistory] = useState<{
    questionIndex: number;
    userAnswer: number;
    isCorrect: boolean;
  }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Extract detected topics from student's chat history
  const historyTopics = sessions
    .filter((s) => s.title && s.title !== 'Mon premier cours' && s.title !== 'Nouvelle conversation')
    .map((s) => s.title)
    .slice(0, 6);

  const handleStartQuiz = async (topicToUse?: string) => {
    const topic = (topicToUse || selectedTopic).trim();
    if (!topic) {
      setError('Veuillez entrer ou sélectionner un sujet pour le quiz.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedOptionIndex(null);
    setCurrentIndex(0);
    setScore(0);
    setAnswersHistory([]);
    setIsFinished(false);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          level: quizLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur serveur (${res.status})`);
      }

      const data: QuizData = await res.json();
      setQuizData(data);
    } catch (err: any) {
      console.error('Quiz start error:', err);
      setError(err.message || 'Impossible de charger le quiz. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    if (selectedOptionIndex !== null || !quizData) return; // already answered

    setSelectedOptionIndex(index);
    const currentQ = quizData.questions[currentIndex];
    const isCorrect = index === currentQ.correctAnswerIndex;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswersHistory((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        userAnswer: index,
        isCorrect,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (!quizData) return;

    if (currentIndex + 1 < quizData.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
    } else {
      setIsFinished(true);
      // Trigger celebrate confetti if score >= 4
      if (score >= 3) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }
      }
    }
  };

  const handleReset = () => {
    setQuizData(null);
    setSelectedTopic('');
    setSelectedOptionIndex(null);
    setCurrentIndex(0);
    setScore(0);
    setAnswersHistory([]);
    setIsFinished(false);
    setError(null);
  };

  if (!isOpen) return null;

  const currentQ = quizData?.questions[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-header)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span>Quiz Rapide IA</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  5 QUESTIONS • CORRECTION IMMÉDIATE
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Entraîne-toi en 3 minutes et vérifie tes réflexes avec JANGO
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[var(--bg-primary)]">
          {/* STATE 1: Loading */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_35px_#f59e0b] animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  JANGO rédige 5 questions d'entraînement...
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm">
                  Génération des options de réponse, pièges classiques et explications pédagogiques étape par étape.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: Topic Selection (if no quiz active) */}
          {!isLoading && !quizData && (
            <div className="space-y-5">
              {/* Level Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  1. Choix du niveau scolaire :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['primaire', 'college', 'lycee', 'superieur'] as AcademicLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setQuizLevel(lvl)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center capitalize ${
                        quizLevel === lvl
                          ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-sm'
                          : 'bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] border-[var(--border-card)]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detected topics from past sessions */}
              {historyTopics.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0A84FF]" />
                    <span>Sujets travaillés dans tes sessions précédentes :</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {historyTopics.map((top, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedTopic(top);
                          handleStartQuiz(top);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--card-bg)] hover:bg-[#0A84FF]/10 text-[var(--text-secondary)] hover:text-[#0A84FF] border border-[var(--border-card)] hover:border-[#0A84FF]/40 transition-all text-left flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{top}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Ou choisis un sujet classique :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_TOPICS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedTopic(p.label);
                        setQuizLevel(p.level);
                        handleStartQuiz(p.label);
                      }}
                      className="p-2.5 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border border-[var(--border-card)] hover:border-[#0A84FF]/40 transition-all text-left flex items-center gap-2.5 cursor-pointer group shadow-xs active:scale-[0.98]"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">
                        {p.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold block truncate">
                          {p.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">
                          Niveau {p.level}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Ou écris ton propre thème d'examen ou devoir :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStartQuiz();
                    }}
                    placeholder="Ex: Loi d'Ohm, La Première Guerre Mondiale, Trigonométrie..."
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#0A84FF] transition-colors"
                  />
                  <button
                    onClick={() => handleStartQuiz()}
                    disabled={!selectedTopic.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                  >
                    <span>Lancer le Quiz</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: Active Question Flow (1 to 5) */}
          {!isLoading && quizData && !isFinished && currentQ && (
            <div className="space-y-5">
              {/* Progress and Score Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
                  <span className="font-bold text-[#0A84FF] dark:text-[#00D4FF]">
                    Question {currentIndex + 1} sur {quizData.questions.length}
                  </span>
                  <span>
                    Score actuel : <strong className="text-amber-500 font-bold">{score}</strong> / {currentIndex + (selectedOptionIndex !== null ? 1 : 0)}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentIndex + 1) / quizData.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Question Statement */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-card)] shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Sujet : {quizData.topic}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-relaxed select-text">
                  {currentQ.question}
                </h3>
              </div>

              {/* 4 Answer Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  const isCorrectAnswer = idx === currentQ.correctAnswerIndex;
                  const isAnswered = selectedOptionIndex !== null;

                  let optionStyle = 'bg-[var(--card-bg)] hover:bg-[var(--card-hover)] border-[var(--border-card)] text-[var(--text-primary)]';

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      // Correct option is always green
                      optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs';
                    } else if (isSelected) {
                      // Wrong selected option is red
                      optionStyle = 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 font-bold';
                    } else {
                      optionStyle = 'bg-[var(--card-bg)] opacity-40 border-[var(--border-subtle)] text-[var(--text-muted)]';
                    }
                  }

                  const letter = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        !isAnswered ? 'hover:scale-[1.01] active:scale-[0.99]' : ''
                      } ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center font-mono text-xs font-bold text-[var(--text-secondary)] shrink-0 border border-[var(--border-subtle)]">
                          {letter}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAnswered && (
                        <div>
                          {isCorrectAnswer && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}
                          {isSelected && !isCorrectAnswer && (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Immediate Correction Box (Correction Immédiate) */}
              {selectedOptionIndex !== null && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      selectedOptionIndex === currentQ.correctAnswerIndex
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {selectedOptionIndex === currentQ.correctAnswerIndex ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-1">
                      <span className="text-xs font-bold block">
                        {selectedOptionIndex === currentQ.correctAnswerIndex
                          ? '🎉 Excellente réponse !'
                          : `❌ Pas tout à fait. La bonne réponse est : ${currentQ.options[currentQ.correctAnswerIndex]}`}
                      </span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed select-text">
                        <strong className="text-[var(--text-primary)]">💡 Explication JANGO :</strong>{' '}
                        {currentQ.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleNextQuestion}
                      className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>
                        {currentIndex + 1 < quizData.questions.length
                          ? 'Question suivante'
                          : 'Voir mes résultats 🏆'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 4: Final Results Screen */}
          {!isLoading && isFinished && quizData && (
            <div className="space-y-6 py-2">
              {/* Score Trophy Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--card-bg)] to-[var(--bg-tertiary)] border border-[var(--border-card)] text-center space-y-3 shadow-md">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-3xl shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                  <Award className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest block">
                    Bilan du Quiz Rapide
                  </span>
                  <h3 className="text-2xl font-black text-[var(--text-primary)] mt-1">
                    {score} / {quizData.questions.length} bonnes réponses
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {score === 5 && '🏆 Félicitations ! Score parfait, tu maîtrises le sujet !'}
                    {score === 4 && '👏 Très bon travail ! Presque un sans-faute.'}
                    {score === 3 && '👍 Bon niveau, encore un petit effort de révision !'}
                    {score < 3 && '💪 Continue tes entraînements, JANGO est là pour t\'aider.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleStartQuiz(quizData.topic)}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recommencer ce quiz</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="py-2 px-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border border-[var(--border-card)] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>Choisir un autre sujet</span>
                  </button>
                </div>
              </div>

              {/* Review of all 5 questions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                  Correction détaillée de vos 5 questions :
                </h4>

                <div className="space-y-2.5">
                  {quizData.questions.map((q, idx) => {
                    const ans = answersHistory.find((a) => a.questionIndex === idx);
                    const isCorrect = ans ? ans.isCorrect : false;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                          isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-red-500/5 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-[var(--text-primary)] flex items-start gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] shrink-0">
                              Q{idx + 1}
                            </span>
                            <span>{q.question}</span>
                          </div>

                          {isCorrect ? (
                            <span className="text-[10px] font-bold text-emerald-500 shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-500 shrink-0 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Erreur</span>
                            </span>
                          )}
                        </div>

                        <div className="pl-6 space-y-1 text-[var(--text-secondary)]">
                          <div>
                            <span className="text-[var(--text-muted)]">Réponse exacte : </span>
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {q.options[q.correctAnswerIndex]}
                            </strong>
                          </div>

                          <div className="text-[11px] text-[var(--text-muted)]">
                            <span className="font-semibold text-[#0A84FF]">Astuce : </span>
                            {q.explanation}
                          </div>

                          {/* Ask Jangoia button */}
                          {!isCorrect && onAskJangoia && (
                            <button
                              onClick={() => {
                                onAskJangoia(`Explique-moi en détail comment résoudre cette question de cours : "${q.question}"`);
                                onClose();
                              }}
                              className="text-[10px] font-semibold text-[#0A84FF] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                            >
                              <span>Demander une explication complète à JANGO 💬</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[var(--bg-header)] border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0">
          <span>JANGO Tuteur Intelligent • Rétroaction immédiate pour mémoriser</span>
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
