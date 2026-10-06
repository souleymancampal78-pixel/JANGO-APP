/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Camera, 
  Calculator, 
  PenTool, 
  Volume2, 
  VolumeX, 
  Zap,
  Sun,
  Moon,
  FileDown,
  Calendar,
  WifiOff,
  BookOpen,
  Maximize2,
  Minimize2,
  FileText,
  Menu,
  Settings
} from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { InputBar } from './components/InputBar';
import { CameraModal } from './components/CameraModal';
import { SampleModal } from './components/SampleModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { StudyPlanModal } from './components/StudyPlanModal';
import { QuizModal } from './components/QuizModal';
import { DictionaryModal } from './components/DictionaryModal';
import { SettingsModal } from './components/SettingsModal';
import { SampleExercise } from './data/sampleExercises';
import { ChatMessage, ChatSession, SubjectMode, AcademicLevel, ChatAttachment, ThemeMode, MathDetailLevel } from './types';
import { parseShareUrlHash } from './utils/share';
import { exportSessionToPdf } from './utils/exportPdf';
import { saveSessionsToIDB, getSessionsFromIDB, clearSessionsFromIDB } from './utils/indexedDBStorage';

const INITIAL_AI_GREETING: ChatMessage = {
  id: 'welcome-msg',
  role: 'ai',
  text: "Salut ! Je suis JANGO, ton IA Tout-Terrain. Études, business, tech, conseils de grand frère, culture ou vie quotidienne : quel sujet veux-tu qu'on explore ensemble aujourd'hui ?",
  timestamp: Date.now(),
};

export default function App() {
  // Splash screen state (shown initially as in user's mockup)
  const [showSplash, setShowSplash] = useState(true);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme state: 'dark' (default/current) or 'light'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('jangoia_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
    }
    return 'dark';
  });

  // Math detail level state: 'summary' | 'standard' | 'ultra'
  const [mathDetailLevel, setMathDetailLevel] = useState<MathDetailLevel>(() => {
    try {
      const saved = localStorage.getItem('jangoia_math_detail');
      if (saved === 'summary' || saved === 'standard' || saved === 'ultra') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load mathDetailLevel:', e);
    }
    return 'standard';
  });

  const handleSelectMathDetail = (lvl: MathDetailLevel) => {
    setMathDetailLevel(lvl);
    try {
      localStorage.setItem('jangoia_math_detail', lvl);
    } catch (e) {
      console.error('Failed to save mathDetailLevel:', e);
    }
  };

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isStudyPlanOpen, setIsStudyPlanOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'compte' | 'theme' | 'general'>('compte');
  const userEmail = 'fatimadieye186@gmail.com';
  const userName = 'Fatima Dieye';
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const root = document.documentElement as any;
      const isCurrentlyFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

      if (!isCurrentlyFullscreen) {
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if (root.webkitRequestFullscreen) {
          await root.webkitRequestFullscreen();
        } else if (root.mozRequestFullScreen) {
          await root.mozRequestFullScreen();
        } else if (root.msRequestFullscreen) {
          await root.msRequestFullscreen();
        }
        setIsFullscreen(true);
        if (isSidebarOpen && window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      // In case iframe restricts native fullscreen, fallback gracefully to in-app immersive reading mode
      setIsFullscreen((prev) => {
        const next = !prev;
        if (next && isSidebarOpen) setIsSidebarOpen(false);
        return next;
      });
    }
  };

  // Network online/offline status
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Screen touch swipe gesture recognition
  const [screenTouchStart, setScreenTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleScreenTouchStart = (e: React.TouchEvent) => {
    setScreenTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleScreenTouchEnd = (e: React.TouchEvent) => {
    if (!screenTouchStart) return;
    const deltaX = e.changedTouches[0].clientX - screenTouchStart.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - screenTouchStart.y);

    // Check if the gesture is predominantly horizontal
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
      // Frotter le doigt vers la droite (deltaX > 35) -> Ouvrir le menu !
      if (deltaX > 35 && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
      // Frotter le doigt vers la gauche (deltaX < -35) -> Fermer le menu si ouvert
      else if (deltaX < -35 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }
    setScreenTouchStart(null);
  };

  // Staged image attachment before sending
  const [stagedAttachment, setStagedAttachment] = useState<ChatAttachment | null>(null);

  // Sessions and Active Chat state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('jangoia_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }

    const defaultSession: ChatSession = {
      id: 'session-default',
      title: 'Mon premier cours',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [INITIAL_AI_GREETING],
      mode: 'general',
      level: 'lycee',
    };
    return [defaultSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session-default';
  });

  const [mode, setMode] = useState<SubjectMode>('general');
  const [level, setLevel] = useState<AcademicLevel>('lycee');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    return localStorage.getItem('jangoia_auto_speak') === 'true';
  });

  // Loading and Speech states
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [sharedToast, setSharedToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check incoming shared discussion URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('#share=')) {
      const payload = parseShareUrlHash(hash);
      if (payload) {
        const sharedSessionId = `shared-${Date.now()}`;
        const newSharedSession: ChatSession = {
          id: sharedSessionId,
          title: payload.question.slice(0, 25) || 'Exercice partagé',
          createdAt: payload.timestamp || Date.now(),
          updatedAt: Date.now(),
          messages: [
            INITIAL_AI_GREETING,
            {
              id: `shared-q-${Date.now()}`,
              role: 'user',
              text: payload.question,
              timestamp: (payload.timestamp || Date.now()) - 2000,
            },
            {
              id: `shared-a-${Date.now()}`,
              role: 'ai',
              text: payload.answer,
              timestamp: payload.timestamp || Date.now(),
            },
          ],
          mode: 'general',
          level: 'lycee',
        };

        setSessions((prev) => [newSharedSession, ...prev]);
        setCurrentSessionId(sharedSessionId);
        setShowSplash(false);
        setSharedToast('Discussion partagée chargée avec succès !');
        setTimeout(() => setSharedToast(null), 4000);

        try {
          history.replaceState(null, '', window.location.pathname);
        } catch (e) {}
      }
    }
  }, []);

  // Sync theme with HTML root class and localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jangoia_theme', theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  // Listen to network status (online / offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSharedToast('Connexion internet rétablie ! Synchronisation active.');
      setTimeout(() => setSharedToast(null), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSharedToast("Mode hors-ligne : consultation active des cours sauvegardés dans IndexedDB.");
      setTimeout(() => setSharedToast(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hydrate sessions from IndexedDB on startup (offline cache)
  useEffect(() => {
    getSessionsFromIDB()
      .then((cached) => {
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setSessions(cached);
        } else if (sessions.length > 0) {
          // Initialize IndexedDB with existing sessions
          saveSessionsToIDB(sessions);
        }
      })
      .catch((err) => console.warn('Erreur initialisation IndexedDB:', err));
  }, []);

  // Persist sessions to both localStorage and IndexedDB
  useEffect(() => {
    try {
      localStorage.setItem('jangoia_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage:', e);
    }

    // Cache in IndexedDB for reliable offline history browsing
    saveSessionsToIDB(sessions).catch((err) => {
      console.warn('Erreur sauvegarde IndexedDB:', err);
    });
  }, [sessions]);

  // Persist auto speak
  useEffect(() => {
    localStorage.setItem('jangoia_auto_speak', String(autoSpeak));
  }, [autoSpeak]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isLoading]);

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || sessions[0];

  // Helper to open app from splash
  const handleOpenApp = () => {
    setShowSplash(false);
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  };

  // Helper for new chat
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Nouveau devoir',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [INITIAL_AI_GREETING],
      mode: mode,
      level: level,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setStagedAttachment(null);
  };

  // Helper to delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: `session-${Date.now()}`,
          title: 'Nouvelle discussion',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [INITIAL_AI_GREETING],
          mode: 'general',
          level: 'lycee',
        };
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Helper to clear all history after confirmation
  const handleClearAllHistory = () => {
    try {
      localStorage.removeItem('jangoia_sessions');
    } catch (e) {
      console.error('Failed to clear sessions from storage:', e);
    }

    clearSessionsFromIDB().catch((err) => {
      console.warn('Erreur suppression IndexedDB:', err);
    });

    const freshSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Mon premier cours',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [INITIAL_AI_GREETING],
      mode: 'general',
      level: 'lycee',
    };

    setSessions([freshSession]);
    setCurrentSessionId(freshSession.id);
    setStagedAttachment(null);
    setSharedToast('Historique complet effacé avec succès.');
    setTimeout(() => setSharedToast(null), 4000);
  };

  // Helper to export current session to PDF
  const handleExportPdf = () => {
    exportSessionToPdf(currentSession);
    setSharedToast('Téléchargement du document PDF de cours...');
    setTimeout(() => setSharedToast(null), 3500);
  };

  // Speech synthesis in French
  const speakText = (text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not available');
      return;
    }

    window.speechSynthesis.cancel();

    const cleanSpeech = text
      .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
      .replace(/\$([^\$\n]+?)\$/g, '$1')
      .replace(/\$/g, '')
      .replace(/[*#`_~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/📌|💡|📝|✅|▶️|•/g, '')
      .slice(0, 1500);

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(
      (v) =>
        v.lang.startsWith('fr') &&
        (v.name.includes('Google') ||
          v.name.includes('Thomas') ||
          v.name.includes('Amelie') ||
          v.name.includes('Natural'))
    );
    if (frVoice) {
      utterance.voice = frVoice;
    }

    if (msgId) {
      setSpeakingMessageId(msgId);
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  };

  // Send message to backend Gemini API
  const handleSendMessage = async (
    text: string,
    attachment?: ChatAttachment | null,
    isVoice = false
  ) => {
    if (!text.trim() && !attachment) return;

    if (!isOnline) {
      setSharedToast(
        "Mode hors-ligne : consultation des cours sauvegardés dans IndexedDB disponible. Reconnecte-toi à internet pour poser une nouvelle question."
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text:
        text.trim() ||
        "Voici la photo de mon devoir. Peux-tu l'analyser et le résoudre étape par étape ?",
      timestamp: Date.now(),
      attachment: attachment || undefined,
      isVoiceInput: isVoice,
    };

    let newTitle = currentSession.title;
    if (currentSession.messages.length <= 1) {
      newTitle = text.slice(0, 30) || (attachment ? 'Exercice photo' : 'Devoir');
    }

    const updatedMessages = [...currentSession.messages, userMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : s
      )
    );

    setIsLoading(true);

    try {
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          image: attachment
            ? {
                mimeType: attachment.mimeType,
                base64: attachment.base64,
              }
            : null,
          mode: mode,
          level: level,
          mathDetailLevel: mathDetailLevel,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      const aiReplyText =
        data.text ||
        "J'ai bien analysé ton devoir mais je n'ai pas pu générer l'explication.";

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: aiReplyText,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...s.messages, aiMessage],
              }
            : s
        )
      );

      if (autoSpeak) {
        speakText(aiReplyText, aiMessage.id);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'ai',
        text: `⚠️ **Oups, un problème est survenu** : ${
          err.message || 'Impossible de joindre le serveur'
        }\n\nVérifie ta connexion et réessaie. Tout tes messages précédents sont sauvegardés.`,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                messages: [...s.messages, errorMessage],
              }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for sample exercise selection
  const handleSelectSample = (sample: SampleExercise) => {
    const base64Data = sample.imageDataUrl.split(',')[1];
    const attachment: ChatAttachment = {
      name: `${sample.title}.svg`,
      mimeType: 'image/svg+xml',
      base64: base64Data,
      previewUrl: sample.imageDataUrl,
    };

    setStagedAttachment(attachment);
    handleSendMessage(sample.question, attachment);
  };

  const handleMessageFeedback = (messageId: string, feedback: 'up' | 'down' | null) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: s.messages.map((m) =>
              m.id === messageId ? { ...m, feedback } : m
            ),
          };
        }
        return s;
      })
    );
  };

  const handleGenerateSummary = () => {
    if (isLoading) return;
    if (currentSession.messages.length <= 1) {
      setSharedToast("Pose d'abord une question ou commence un devoir pour générer une synthèse de révision !");
      return;
    }

    const summaryPrompt = 
      "📋 **Instruction Spécifique** : Analyse l'ensemble des échanges, calculs et devoirs de notre session courante et génère une **Fiche de Révision & Synthèse Complète et Structurée** adaptée à mon niveau scolaire.\n\n" +
      "La fiche doit être claire et comporter les sections suivantes :\n" +
      "• 📌 **Résumé des notions abordées** : Synthèse concise de l'essentiel à retenir.\n" +
      "• 🔑 **Définitions clés & Vocabulaire** : Les termes et notions indispensables avec explications claires.\n" +
      "• 📐 **Formules, règles ou théorèmes majeurs** : Formules mathématiques ou règles de français avec méthodologie pas à pas.\n" +
      "• ⚠️ **Erreurs fréquentes et pièges classiques à éviter** lors d'un contrôle ou examen.\n" +
      "• 💡 **Astuce mnémotechnique / Mémo express** : Pour retenir facilement et sans confusion.\n\n" +
      "Présente le résultat avec des puces (bullet points), des sections aérées et une mise en page impeccable.";

    handleSendMessage(summaryPrompt);
  };

  const handleCopyContent = () => {
    const lastAiMessage = [...currentSession.messages].reverse().find((m) => m.role === 'ai');
    const textToCopy = lastAiMessage ? lastAiMessage.text : "Bienvenue sur JANGO IA";
    navigator.clipboard.writeText(textToCopy);
    setSharedToast("Dernière réponse copiée dans le presse-papier !");
    setTimeout(() => setSharedToast(null), 3000);
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'JANGO IA - Tuteur Scolaire',
        text: 'Réviser et résoudre mes devoirs avec JANGO IA',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSharedToast("Lien de l'application copié dans le presse-papier !");
      setTimeout(() => setSharedToast(null), 3000);
    }
  };

  return (
    <div 
      onTouchStart={handleScreenTouchStart}
      onTouchEnd={handleScreenTouchEnd}
      className="relative w-screen h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex overflow-hidden font-sans select-none transition-colors duration-200"
    >
      {/* 1. Splash Screen Overlay */}
      {showSplash && <SplashScreen onOpenApp={handleOpenApp} />}

      {/* 2. Slide-out Sidebar with Theme Switcher */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSession.id}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllHistory={handleClearAllHistory}
        onExportPdf={handleExportPdf}
        onOpenStudyPlan={() => setIsStudyPlanOpen(true)}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onGenerateSummary={handleGenerateSummary}
        mode={mode}
        onSelectMode={(m) => setMode(m)}
        level={level}
        onSelectLevel={(l) => setLevel(l)}
        mathDetailLevel={mathDetailLevel}
        onSelectMathDetail={handleSelectMathDetail}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak((prev) => !prev)}
        theme={theme}
        onSelectTheme={setTheme}
        onReturnToSplash={() => setShowSplash(true)}
        onPresetPrompt={(prompt) => handleSendMessage(prompt)}
        onOpenSettings={() => {
          setSettingsDefaultTab('general');
          setIsSettingsOpen(true);
        }}
        onOpenAccount={() => {
          setSettingsDefaultTab('compte');
          setIsSettingsOpen(true);
        }}
        userEmail={userEmail}
        userName={userName}
      />

      {/* 3. Main Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[var(--bg-primary)]">
        {/* Top Navbar */}
        <header className="h-14 sm:h-16 px-4 bg-[var(--bg-header)] border-b border-[var(--border-subtle)] flex items-center justify-between z-20 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-1.5 -ml-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
              title="Ouvrir le menu et l'historique"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setShowSplash(true)}
              className="flex items-center gap-2 cursor-pointer group"
              title="Accueil JANGO"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center text-white font-black text-xs shadow-[0_0_12px_#0A84FF] group-hover:scale-105 transition-transform">
                J
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-widest text-[#0A84FF] group-hover:text-[#00D4FF] transition-colors drop-shadow-sm">
                JANGO
              </h1>
            </div>
          </div>

          {/* Right Header Area: Profil de la personne inscrite au fond + Offline indicator */}
          <div className="flex items-center gap-2.5">
            {!isOnline && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-semibold shadow-xs animate-pulse"
                title="Vous êtes actuellement hors-ligne. Vos cours sauvegardés dans IndexedDB restent consultables sans connexion."
              >
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Hors-ligne</span>
              </div>
            )}

            {/* Profil de la personne inscrite au fond en haut */}
            <button
              onClick={() => {
                setSettingsDefaultTab('compte');
                setIsSettingsOpen(true);
              }}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] border border-[var(--border-subtle)] transition-all cursor-pointer group shadow-xs"
              title={`Profil de l'élève : ${userName} (${userEmail})`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-xs group-hover:scale-105 transition-transform">
                FD
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
                <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[#0A84FF] transition-colors truncate max-w-[100px]">
                  {userName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[130px] font-mono">
                  {userEmail}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Messages Scroll Area */}
        <div id="messages" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className={`${isFullscreen ? 'max-w-5xl' : 'max-w-4xl'} mx-auto flex flex-col justify-end min-h-full transition-all duration-300`}>
            {/* Fullscreen Immersion Active indicator badge */}
            {isFullscreen && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0A84FF]/15 to-[#00D4FF]/10 border border-[#0A84FF]/30 flex items-center justify-between text-xs text-[#0A84FF] dark:text-[#00D4FF] shadow-xs animate-in fade-in duration-200">
                <span className="flex items-center gap-2 font-medium">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Mode Plein Écran Immersif actif • Lecture optimale des calculs & explications</span>
                </span>
                <button
                  onClick={toggleFullscreen}
                  className="px-2.5 py-1 rounded-lg bg-[var(--card-hover)] hover:bg-[#0A84FF]/20 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Quitter le plein écran (Échap)
                </button>
              </div>
            )}

            {/* Show clean welcome screen when session only has initial greeting */}
            {currentSession.messages.length <= 1 && (
              <div className="my-auto py-12 flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
                {/* Logo JANGO */}
                <div 
                  onClick={() => setShowSplash(true)}
                  className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-300 mb-6"
                  title="Revenir à l'accueil"
                >
                  <div className="absolute -inset-3 bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] rounded-3xl flex items-center justify-center text-white text-6xl sm:text-7xl font-black shadow-[0_0_50px_#0A84FF]">
                    <span className="drop-shadow-lg tracking-tight">J</span>
                  </div>
                </div>

                {/* Petit message en dessous : salut à la personne qui s'est inscrite, que puis-je faire pour vous */}
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight max-w-lg">
                  Salut à Fatima, que puis-je faire pour vous ?
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mt-2 font-medium">
                  Études, business, tech, conseils de grand frère, culture ou quotidien : parle au micro ou écris ton message.
                </p>
              </div>
            )}

            {/* Shared toast notification banner */}
            {sharedToast && (
              <div className="mb-4 p-3 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/40 text-[#0A84FF] dark:text-[#00D4FF] text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping" />
                  {sharedToast}
                </span>
                <button
                  onClick={() => setSharedToast(null)}
                  className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Messages list */}
            {currentSession.messages.map((message, idx) => {
              const previousUserMsg = message.role === 'ai'
                ? currentSession.messages.slice(0, idx).reverse().find((m) => m.role === 'user')?.text
                : undefined;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  previousQuestion={previousUserMsg}
                  onSpeak={(t) => speakText(t, message.id)}
                  isSpeaking={speakingMessageId === message.id}
                  onStopSpeak={stopSpeaking}
                  onPreviewImage={(url) => setPreviewImageUrl(url)}
                  onExportPdf={handleExportPdf}
                  onLookupWord={(word) => setLookupWord(word)}
                  onFeedback={handleMessageFeedback}
                />
              );
            })}

            {/* Thinking / Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 mb-4 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_#0A84FF]">
                  J
                </div>
                <div className="bg-[var(--bubble-ai)] text-[var(--text-secondary)] p-3.5 rounded-2xl rounded-tl-xs border border-[var(--bubble-ai-border)] flex items-center gap-2 text-xs shadow-xs">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="ml-1 text-[var(--text-muted)]">JANGO résout ton exercice pas à pas...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <InputBar
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenLiveCamera={() => setIsCameraOpen(true)}
          onOpenSampleModal={() => setIsSampleModalOpen(true)}
          stagedAttachment={stagedAttachment}
          onSetStagedAttachment={setStagedAttachment}
          autoSpeak={autoSpeak}
          onCopyContent={handleCopyContent}
          onShareContent={handleShareApp}
        />
      </main>

      {/* Live Camera Snapshot Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(attachment) => setStagedAttachment(attachment)}
      />

      {/* Preset Sample Homework Modal */}
      <SampleModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      {/* Full-size Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* AI Study Plan Modal */}
      <StudyPlanModal
        isOpen={isStudyPlanOpen}
        onClose={() => setIsStudyPlanOpen(false)}
        sessions={sessions}
        currentLevel={level}
      />

      {/* AI Quick Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        sessions={sessions}
        currentLevel={level}
        onAskJangoia={(q) => handleSendMessage(q)}
      />

      {/* Dictionary & Vocabulary Popup Modal 📖 */}
      <DictionaryModal
        isOpen={isDictionaryOpen || !!lookupWord}
        initialWord={lookupWord}
        onClose={() => {
          setIsDictionaryOpen(false);
          setLookupWord(null);
        }}
        isOnline={isOnline}
      />

      {/* App Settings Modal ⚙️ */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onSelectTheme={setTheme}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak((prev) => !prev)}
        defaultTab={settingsDefaultTab}
        userName={userName}
        mathDetailLevel={mathDetailLevel}
        onSelectMathDetail={handleSelectMathDetail}
      />
    </div>
  );
}
