import React, { useRef, useState, useEffect } from 'react';
import { 
  Paperclip, 
  Camera, 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Sparkles, 
  Loader2, 
  Volume2,
  FileText,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { ChatAttachment } from '../types';

interface InputBarProps {
  onSendMessage: (text: string, attachment?: ChatAttachment | null, isVoice?: boolean) => void;
  isLoading: boolean;
  onOpenLiveCamera: () => void;
  onOpenSampleModal: () => void;
  stagedAttachment: ChatAttachment | null;
  onSetStagedAttachment: (att: ChatAttachment | null) => void;
  autoSpeak: boolean;
  onCopyContent?: () => void;
  onShareContent?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  isLoading,
  onOpenLiveCamera,
  onOpenSampleModal,
  stagedAttachment,
  onSetStagedAttachment,
  autoSpeak,
  onCopyContent,
  onShareContent,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [copiedActionToast, setCopiedActionToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node)
      ) {
        setIsAttachmentMenuOpen(false);
      }
    };

    if (isAttachmentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachmentMenuOpen]);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Essaie sur Google Chrome ou Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Cannot start recognition:', err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      const attachment: ChatAttachment = {
        name: file.name,
        mimeType: isPdf ? 'application/pdf' : file.type || 'image/jpeg',
        base64: base64Data,
        previewUrl: isPdf ? '' : dataUrl,
      };
      onSetStagedAttachment(attachment);
      setIsAttachmentMenuOpen(false);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleActionCamera = () => {
    setIsAttachmentMenuOpen(false);
    onOpenLiveCamera();
  };

  const handleActionPdf = () => {
    setIsAttachmentMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleActionShare = () => {
    setIsAttachmentMenuOpen(false);
    if (onShareContent) {
      onShareContent();
    } else if (navigator.share) {
      navigator.share({
        title: 'JANGO IA',
        text: 'Révisions interactives et résolution de devoirs avec JANGO',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedActionToast(true);
      setTimeout(() => setCopiedActionToast(false), 2000);
    }
  };

  const handleActionCopy = () => {
    setIsAttachmentMenuOpen(false);
    if (onCopyContent) {
      onCopyContent();
    }
    setCopiedActionToast(true);
    setTimeout(() => setCopiedActionToast(false), 2000);
  };

  const handleSend = () => {
    if ((!inputText.trim() && !stagedAttachment) || isLoading) return;

    const wasVoice = isRecording;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    onSendMessage(inputText, stagedAttachment, wasVoice);
    setInputText('');
    onSetStagedAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-[var(--bg-header)] border-t border-[var(--border-subtle)] p-3 sm:p-4 select-none transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col gap-2 relative">
        {/* Toast confirmation for copy / share */}
        {copiedActionToast && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5" />
            <span>Action effectuée avec succès !</span>
          </div>
        )}

        {/* Staged Attachment Preview */}
        {stagedAttachment && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[#0A84FF]/40 max-w-sm self-start shadow-sm">
            {stagedAttachment.mimeType === 'application/pdf' ? (
              <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={stagedAttachment.previewUrl}
                alt="Aperçu exercice"
                className="w-10 h-10 rounded-lg object-cover bg-black/10 border border-[var(--border-card)]"
              />
            )}
            <div className="flex-1 min-w-0 text-xs">
              <p className="text-[var(--text-primary)] font-medium truncate">{stagedAttachment.name}</p>
              <p className="text-[10px] text-[#0A84FF] dark:text-[#00D4FF] font-medium">
                {stagedAttachment.mimeType === 'application/pdf' ? 'Document PDF prêt' : "Photo de l'exercice prête"}
              </p>
            </div>
            <button
              onClick={() => onSetStagedAttachment(null)}
              className="p-1 rounded-full hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Supprimer la pièce jointe"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Recording active banner */}
        {isRecording && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 animate-pulse">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              JANGO t'écoute... Parle au micro !
            </span>
            <button
              onClick={toggleVoiceRecording}
              className="text-[10px] font-mono uppercase underline hover:text-red-700 cursor-pointer"
            >
              Arrêter
            </button>
          </div>
        )}

        {/* Main Input Row */}
        <div className="flex items-center gap-2 relative">
          {/* File input (Hidden: supports image and PDF) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Attachment Menu Popover & Button */}
          <div className="relative" ref={attachmentMenuRef}>
            {/* Popover Menu with: Caméra, PDF, Partage, Copier */}
            {isAttachmentMenuOpen && (
              <div className="absolute bottom-14 left-0 z-40 w-56 p-1.5 rounded-2xl bg-[var(--modal-bg)] border border-[var(--border-subtle)] shadow-2xl space-y-1 animate-in zoom-in-95 duration-150 backdrop-blur-md">
                {/* 1. Caméra */}
                <button
                  onClick={handleActionCamera}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[#0A84FF]/15 hover:text-[#0A84FF] transition-all flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="leading-tight">Caméra</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-normal">Prendre une photo de devoir</p>
                  </div>
                </button>

                {/* 2. PDF */}
                <button
                  onClick={handleActionPdf}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-red-500/15 hover:text-red-500 transition-all flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="leading-tight">PDF / Document</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-normal">Importer un cours ou devoir</p>
                  </div>
                </button>

                {/* 3. Partage */}
                <button
                  onClick={handleActionShare}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-emerald-500/15 hover:text-emerald-500 transition-all flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="leading-tight">Partage</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-normal">Partager les révisions</p>
                  </div>
                </button>

                {/* 4. Copier */}
                <button
                  onClick={handleActionCopy}
                  className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-amber-500/15 hover:text-amber-500 transition-all flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Copy className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="leading-tight">Copier</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-normal">Copier le devoir / échange</p>
                  </div>
                </button>
              </div>
            )}

            {/* Paperclip button 📎 */}
            <button
              onClick={() => setIsAttachmentMenuOpen((prev) => !prev)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 border cursor-pointer ${
                isAttachmentMenuOpen
                  ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-[0_0_15px_rgba(10,132,255,0.4)]'
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] border-[var(--border-card)]'
              }`}
              title="Options : Caméra, PDF, Partage, Copier"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Camera snap shortcut button */}
          <button
            onClick={onOpenLiveCamera}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] flex items-center justify-center transition-all shrink-0 active:scale-95 border border-[var(--border-card)] hidden xs:flex cursor-pointer"
            title="Prendre en photo avec la caméra"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Sample homework modal button */}
          <button
            onClick={onOpenSampleModal}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] flex items-center justify-center transition-all shrink-0 active:scale-95 border border-[var(--border-card)] hidden sm:flex cursor-pointer"
            title="Exemples d'exercices à tester"
          >
            <Sparkles className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF]" />
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              id="textInput"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? "Dictée vocale en cours..."
                  : stagedAttachment
                  ? "Question sur le document ou la photo..."
                  : "Message JANGO, colle ton devoir ou exo..."
              }
              className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#0A84FF] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-full py-3 sm:py-3.5 pl-4 sm:pl-5 pr-10 text-sm sm:text-base outline-none transition-all shadow-xs"
              disabled={isLoading}
            />

            {autoSpeak && (
              <span 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0A84FF] dark:text-[#00D4FF] pointer-events-none opacity-80" 
                title="Lecture vocale auto activée"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Microphone button */}
          <button
            id="mic"
            onClick={toggleVoiceRecording}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer ${
              isRecording
                ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-mic-wave'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-card)]'
            }`}
            title={isRecording ? 'Arrêter le micro' : 'Parler au micro'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send button */}
          <button
            id="send"
            onClick={handleSend}
            disabled={(!inputText.trim() && !stagedAttachment) || isLoading}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0A84FF] hover:bg-[#0070e0] text-white flex items-center justify-center transition-all shrink-0 shadow-[0_0_15px_rgba(10,132,255,0.4)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            title="Envoyer le message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Send className="w-5 h-5 translate-x-[-1px] translate-y-[-1px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
