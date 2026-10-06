import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  User, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Palette, 
  Moon, 
  Sun, 
  Laptop, 
  Globe, 
  Volume2, 
  Search, 
  Check, 
  Lock, 
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calculator
} from 'lucide-react';
import { ThemeMode, MathDetailLevel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  defaultTab?: 'compte' | 'theme' | 'general';
  userName?: string;
  mathDetailLevel?: MathDetailLevel;
  onSelectMathDetail?: (lvl: MathDetailLevel) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  autoSpeak,
  onToggleAutoSpeak,
  defaultTab = 'compte',
  userName = 'Fatima Dieye',
  mathDetailLevel = 'standard',
  onSelectMathDetail,
}) => {
  // Navigation active tab arranged strictly vertically: 'compte' | 'theme' | 'general'
  const [activeTab, setActiveTab] = useState<'compte' | 'theme' | 'general'>(defaultTab);

  // Compte: Parental Control state
  const [parentalControlEnabled, setParentalControlEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jangoia_parental_control') === 'true';
    } catch {
      return false;
    }
  });
  const [parentalPin, setParentalPin] = useState<string>(() => {
    try {
      return localStorage.getItem('jangoia_parental_pin') || '1234';
    } catch {
      return '1234';
    }
  });

  // Compte: Usage Limit state
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jangoia_daily_limit');
      return saved ? Number(saved) : 90;
    } catch {
      return 90;
    }
  });

  // Compte: Email address state
  const [emailAddress, setEmailAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('jangoia_user_email') || 'fatimadieye186@gmail.com';
    } catch {
      return 'fatimadieye186@gmail.com';
    }
  });
  const [emailSavedToast, setEmailSavedToast] = useState(false);

  // Thème state: 'dark' | 'light' | 'system'
  const [selectedThemeMode, setSelectedThemeMode] = useState<'dark' | 'light' | 'system'>(() => {
    try {
      return (localStorage.getItem('jangoia_theme_preference') as any) || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Général: Language state
  const [language, setLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('jangoia_language') || 'fr';
    } catch {
      return 'fr';
    }
  });

  // Général: Auto-usage & Web search
  const [autoPhotoSolve, setAutoPhotoSolve] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jangoia_auto_photosolve') !== 'false';
    } catch {
      return true;
    }
  });

  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('jangoia_web_search') !== 'false';
    } catch {
      return true;
    }
  });

  // Apply theme mode changes
  const handleThemeChange = (mode: 'dark' | 'light' | 'system') => {
    setSelectedThemeMode(mode);
    try {
      localStorage.setItem('jangoia_theme_preference', mode);
    } catch (e) {
      console.error(e);
    }

    if (mode === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      onSelectTheme(prefersDark ? 'dark' : 'light');
    } else {
      onSelectTheme(mode);
    }
  };

  const handleSaveEmail = () => {
    try {
      localStorage.setItem('jangoia_user_email', emailAddress);
      setEmailSavedToast(true);
      setTimeout(() => setEmailSavedToast(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleParental = () => {
    const next = !parentalControlEnabled;
    setParentalControlEnabled(next);
    try {
      localStorage.setItem('jangoia_parental_control', String(next));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLimitChange = (mins: number) => {
    setDailyLimitMinutes(mins);
    try {
      localStorage.setItem('jangoia_daily_limit', String(mins));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    try {
      localStorage.setItem('jangoia_language', lang);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleWebSearch = () => {
    const next = !webSearchEnabled;
    setWebSearchEnabled(next);
    try {
      localStorage.setItem('jangoia_web_search', String(next));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAutoPhoto = () => {
    const next = !autoPhotoSolve;
    setAutoPhotoSolve(next);
    try {
      localStorage.setItem('jangoia_auto_photosolve', String(next));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[var(--modal-bg)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 text-[var(--text-primary)]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-header)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] flex items-center justify-center text-white shadow-[0_0_12px_#0A84FF]">
              <Settings className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                Paramètres
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Organisation verticale : Compte, Thème et Général
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
            aria-label="Fermer les paramètres"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout with Vertical Navigation: Compte, Thème, Général arranged vertically */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Vertical Menu Column on the Left / Top */}
          <div className="w-full sm:w-48 bg-[var(--bg-tertiary)] border-b sm:border-b-0 sm:border-r border-[var(--border-subtle)] p-2 sm:p-3 flex sm:flex-col gap-1.5 shrink-0 overflow-x-auto sm:overflow-x-visible">
            {/* 1. Compte */}
            <button
              onClick={() => setActiveTab('compte')}
              className={`flex-1 sm:flex-initial py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-start gap-2.5 transition-all cursor-pointer ${
                activeTab === 'compte'
                  ? 'bg-[#0A84FF] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">Compte</span>
            </button>

            {/* 2. Thème */}
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 sm:flex-initial py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-start gap-2.5 transition-all cursor-pointer ${
                activeTab === 'theme'
                  ? 'bg-[#0A84FF] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span className="truncate">Thème</span>
            </button>

            {/* 3. Général */}
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 sm:flex-initial py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-start gap-2.5 transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-[#0A84FF] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span className="truncate">Général</span>
            </button>
          </div>

          {/* Scrollable Content Body for Selected Category */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* ======================================================== */}
            {/* 1. SECTION COMPTE */}
            {/* ======================================================== */}
            {activeTab === 'compte' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Profil de la personne inscrite */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2 text-[var(--text-primary)]">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] text-white flex items-center justify-center font-bold text-[10px]">
                        FD
                      </div>
                      <span>Profil de l'élève inscrit</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Actif</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-[var(--text-primary)]">{userName}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{emailAddress}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-[#0A84FF] dark:text-[#00D4FF] bg-[#0A84FF]/10 px-2 py-1 rounded-md">
                      Élève vérifié
                    </span>
                  </div>
                </div>

                {/* Adresse e-mail */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[var(--text-primary)]">
                      <Mail className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF]" />
                      <span>Adresse e-mail</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="nom@exemple.com"
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#0A84FF]"
                    />
                    <button
                      onClick={handleSaveEmail}
                      className="px-3.5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070e0] text-white font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      Enregistrer
                    </button>
                  </div>
                  {emailSavedToast && (
                    <p className="text-[11px] text-emerald-500 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Adresse e-mail mise à jour avec succès !</span>
                    </p>
                  )}
                </div>

                {/* Contrôle parental */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <div>
                        <h4 className="font-bold text-[var(--text-primary)]">Contrôle parental</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Filtrage strict, protection des mineurs et validation des devoirs
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleParental}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                        parentalControlEnabled ? 'bg-emerald-500' : 'bg-[var(--border-card)]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          parentalControlEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {parentalControlEnabled && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Code PIN de déverrouillage</span>
                        </span>
                        <input
                          type="password"
                          maxLength={4}
                          value={parentalPin}
                          onChange={(e) => {
                            setParentalPin(e.target.value);
                            try {
                              localStorage.setItem('jangoia_parental_pin', e.target.value);
                            } catch {}
                          }}
                          className="w-16 px-2 py-1 text-center font-mono text-xs rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Le code PIN protège la modification des paramètres et l'accès hors révision.
                      </p>
                    </div>
                  )}
                </div>

                {/* Utilisation et limite */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <div>
                        <h4 className="font-bold text-[var(--text-primary)]">Utilisation et limite</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Gestion du temps d'écran et des sessions quotidiennes
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#0A84FF] dark:text-[#00D4FF]">
                      {dailyLimitMinutes === 0 ? 'Illimité' : `${dailyLimitMinutes} min / jour`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { label: '45 min', val: 45 },
                      { label: '60 min', val: 60 },
                      { label: '90 min', val: 90 },
                      { label: 'Illimité', val: 0 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => handleLimitChange(opt.val)}
                        className={`py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                          dailyLimitMinutes === opt.val
                            ? 'bg-[#0A84FF] text-white shadow-xs'
                            : 'bg-[var(--bg-sidebar)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. SECTION THÈME */}
            {/* ======================================================== */}
            {activeTab === 'theme' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-3">
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF]" />
                      <span>Thème d'affichage</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Sélectionnez votre style visuel : sombre, lumineux ou par défaut.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Sombre */}
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                        selectedThemeMode === 'dark'
                          ? 'bg-[#0A84FF]/15 border-[#0A84FF] text-[#0A84FF] dark:text-[#00D4FF] shadow-xs'
                          : 'bg-[var(--bg-sidebar)] border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-[#00D4FF]">
                          <Moon className="w-4 h-4" />
                        </div>
                        {selectedThemeMode === 'dark' && <Check className="w-4 h-4 text-[#0A84FF]" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[var(--text-primary)]">Sombre</h5>
                        <p className="text-[10px] text-[var(--text-muted)]">Contraste néon sombre</p>
                      </div>
                    </button>

                    {/* Lumineux */}
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                        selectedThemeMode === 'light'
                          ? 'bg-[#0A84FF]/15 border-[#0A84FF] text-[#0A84FF] dark:text-[#00D4FF] shadow-xs'
                          : 'bg-[var(--bg-sidebar)] border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-amber-500">
                          <Sun className="w-4 h-4" />
                        </div>
                        {selectedThemeMode === 'light' && <Check className="w-4 h-4 text-[#0A84FF]" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[var(--text-primary)]">Lumineux</h5>
                        <p className="text-[10px] text-[var(--text-muted)]">Light épuré et clair</p>
                      </div>
                    </button>

                    {/* Par défaut */}
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                        selectedThemeMode === 'system'
                          ? 'bg-[#0A84FF]/15 border-[#0A84FF] text-[#0A84FF] dark:text-[#00D4FF] shadow-xs'
                          : 'bg-[var(--bg-sidebar)] border-[var(--border-subtle)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-gray-900 to-gray-200 border border-gray-400 flex items-center justify-center text-white">
                          <Laptop className="w-4 h-4 text-blue-400" />
                        </div>
                        {selectedThemeMode === 'system' && <Check className="w-4 h-4 text-[#0A84FF]" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-[var(--text-primary)]">Par défaut</h5>
                        <p className="text-[10px] text-[var(--text-muted)]">Suit le système de l'appareil</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. SECTION GÉNÉRAL */}
            {/* ======================================================== */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Langage */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[var(--text-primary)]">
                      <Globe className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF]" />
                      <span>Langage</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-sidebar)] text-[var(--text-muted)]">
                      {language === 'fr' ? 'Français' : language === 'en' ? 'English' : language === 'es' ? 'Español' : 'Arabe'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'fr', label: 'Français 🇫🇷' },
                      { id: 'en', label: 'English 🇬🇧' },
                      { id: 'es', label: 'Español 🇪🇸' },
                      { id: 'ar', label: 'العربية 🇸🇦' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleLanguageChange(item.id)}
                        className={`py-2 px-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                          language === item.id
                            ? 'bg-[#0A84FF] text-white shadow-xs'
                            : 'bg-[var(--bg-sidebar)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Utilisation automatique */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-3">
                  <h4 className="font-bold text-[var(--text-primary)]">Utilisation automatique</h4>

                  <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-[#00D4FF]" />
                      <div>
                        <p className="font-semibold text-xs text-[var(--text-primary)]">Lecture vocale automatique</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Lit à voix haute chaque réponse générée</p>
                      </div>
                    </div>
                    <button
                      onClick={onToggleAutoSpeak}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                        autoSpeak ? 'bg-[#0A84FF]' : 'bg-[var(--border-card)]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          autoSpeak ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="font-semibold text-xs text-[var(--text-primary)]">Résolution photo automatique</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Lance l'analyse dès la capture d'un devoir</p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleAutoPhoto}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                        autoPhotoSolve ? 'bg-[#0A84FF]' : 'bg-[var(--border-card)]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          autoPhotoSolve ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Recherche sur le WEB */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF]" />
                      <div>
                        <h4 className="font-bold text-[var(--text-primary)]">Recherche sur le WEB</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Accès aux sources éducatives, annales du bac & brevets
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleWebSearch}
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                        webSearchEnabled ? 'bg-[#0A84FF]' : 'bg-[var(--border-card)]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          webSearchEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Niveau de détails mathématiques */}
                {onSelectMathDetail && (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-card)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-[var(--text-primary)]">
                        <Calculator className="w-4 h-4 text-[#0A84FF]" />
                        <span>Détail des calculs mathématiques</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'summary', label: 'Résumé', desc: 'Concis & formules clés' },
                        { id: 'standard', label: 'Standard', desc: 'Pas à pas équilibré' },
                        { id: 'ultra', label: 'Ultra-détaillé', desc: 'Toutes les étapes' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => onSelectMathDetail(lvl.id as MathDetailLevel)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            mathDetailLevel === lvl.id
                              ? 'bg-[#0A84FF]/15 border-[#0A84FF] text-[#0A84FF] dark:text-[#00D4FF]'
                              : 'bg-[var(--bg-sidebar)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                          }`}
                        >
                          <p className="font-bold text-xs">{lvl.label}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{lvl.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
