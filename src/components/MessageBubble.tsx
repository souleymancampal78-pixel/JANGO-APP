import React, { useState, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Sparkles, 
  Eye, 
  Mic, 
  Share2,
  Link2,
  X,
  ExternalLink,
  FileDown,
  BookOpen,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChatMessage } from '../types';
import { generateShareUrl } from '../utils/share';

interface MessageBubbleProps {
  message: ChatMessage;
  previousQuestion?: string;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onStopSpeak: () => void;
  onPreviewImage: (url: string) => void;
  onExportPdf?: () => void;
  onLookupWord?: (word: string) => void;
  onFeedback?: (messageId: string, feedback: 'up' | 'down' | null) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  previousQuestion,
  onSpeak,
  isSpeaking,
  onStopSpeak,
  onPreviewImage,
  onExportPdf,
  onLookupWord,
  onFeedback,
}) => {
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const isUser = message.role === 'user';

  // Helper to remove any dollar signs and convert raw LaTeX commands into clean mathematical typography
  const cleanMathFormatting = (raw: string): string => {
    if (!raw) return '';

    let cleaned = raw;

    // Convert LaTeX math blocks $$...$$ into clean text
    cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, (_, content) => content.trim());

    // Convert inline LaTeX $...$ into clean text
    cleaned = cleaned.replace(/\$([^\$\n]+?)\$/g, (_, content) => content.trim());

    // Remove any remaining stray dollar signs
    cleaned = cleaned.replace(/\$/g, '');

    // Convert common LaTeX math commands to elegant Unicode symbols
    cleaned = cleaned
      .replace(/\\times\b/g, '×')
      .replace(/\\div\b/g, '÷')
      .replace(/\\cdot\b/g, '·')
      .replace(/\\pm\b/g, '±')
      .replace(/\\leq\b/g, '≤')
      .replace(/\\geq\b/g, '≥')
      .replace(/\\neq\b/g, '≠')
      .replace(/\\approx\b/g, '≈')
      .replace(/\\infty\b/g, '∞')
      .replace(/\\pi\b/g, 'π')
      .replace(/\\Delta\b/g, 'Δ')
      .replace(/\\alpha\b/g, 'α')
      .replace(/\\beta\b/g, 'β')
      .replace(/\\theta\b/g, 'θ')
      .replace(/\\rightarrow\b/g, '→')
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\[/g, '[')
      .replace(/\\right\]/g, ']')
      .replace(/\\left\{/g, '{')
      .replace(/\\right\}/g, '}')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
      .replace(/\\mathbf\{([^}]+)\}/g, '**$1**')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
      .replace(/\^\{2\}/g, '²')
      .replace(/\^2\b/g, '²')
      .replace(/\^\{3\}/g, '³')
      .replace(/\^3\b/g, '³')
      .replace(/\^\{0\}/g, '⁰')
      .replace(/\^\{1\}/g, '¹')
      .replace(/\^\{4\}/g, '⁴')
      .replace(/\^\{5\}/g, '⁵')
      .replace(/\^\{n\}/g, 'ⁿ');

    return cleaned;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanMathFormatting(message.text));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showToast = (text: string) => {
    setShareToast(text);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleCopyTextOnly = () => {
    navigator.clipboard.writeText(cleanMathFormatting(message.text));
    showToast("Texte de la réponse copié !");
  };

  const handleCopyShareLink = () => {
    const url = generateShareUrl(previousQuestion || "Exercice résolu par JANGO", message.text, message.timestamp);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("Lien de partage copié dans le presse-papier !");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    const url = generateShareUrl(previousQuestion || "Exercice résolu par JANGO", message.text, message.timestamp);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "JANGO - Explication et solution d'exercice",
          text: previousQuestion ? `Devoir : ${previousQuestion}\n\nExplication de JANGO :` : "Explication de JANGO :",
          url: url,
        });
        showToast("Partagé avec succès !");
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        handleCopyShareLink();
      }
    } else {
      handleCopyShareLink();
    }
  };

  const triggerCelebrate = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#0A84FF', '#00D4FF', '#60A5FA', '#FFFFFF']
    });
  };

  const lastTapRef = useRef<number>(0);

  const handleWordLookup = (rawText?: string) => {
    if (isUser || !onLookupWord) return;

    let text = rawText || window.getSelection()?.toString() || '';
    text = text.trim();

    if (!text) return;

    // If multiple words were selected, take the first word
    if (text.includes(' ') || text.includes('\n')) {
      const parts = text.split(/[\s\n]+/);
      text = parts[0] || '';
    }

    // Strip out quotes, parentheses, brackets, numbers, punctuation
    let cleaned = text.replace(/^[«"'({\[\s\d.,;:!?\-—*`_~]+|[»"')}\].,;:!?\-—*`_~\s\d]+$/gu, '').trim();

    // Handle French elisions: l'hypoténuse -> hypoténuse, d'énergie -> énergie, s'effectue -> effectue, etc.
    if (/^[ldcstnmjqLDJQCSTNM]['’]/i.test(cleaned)) {
      cleaned = cleaned.replace(/^[ldcstnmjqLDJQCSTNM]['’]/i, '');
    }

    // Strip trailing/leading non-letter symbols again
    cleaned = cleaned.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '').trim();

    if (cleaned && cleaned.length >= 2) {
      onLookupWord(cleaned);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isUser || !onLookupWord) return;

    // Small timeout allows browser to finalize word selection
    setTimeout(() => {
      const sel = window.getSelection()?.toString().trim();
      if (sel) {
        handleWordLookup(sel);
        return;
      }

      // Fallback: extract word directly at caret position
      try {
        const doc = document as any;
        let range: Range | null = null;
        if (doc.caretRangeFromPoint) {
          range = doc.caretRangeFromPoint(e.clientX, e.clientY);
        } else if (doc.caretPositionFromPoint) {
          const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
          if (pos) {
            range = document.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
          }
        }
        if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
          const full = range.startContainer.textContent || '';
          const offset = range.startOffset;
          let start = offset;
          while (start > 0 && /[\p{L}\p{M}'-]/u.test(full[start - 1])) {
            start--;
          }
          let end = offset;
          while (end < full.length && /[\p{L}\p{M}'-]/u.test(full[end])) {
            end++;
          }
          const word = full.slice(start, end);
          if (word) {
            handleWordLookup(word);
          }
        }
      } catch {
        // Ignore fallback error
      }
    }, 25);
  };

  const handleTouchEnd = () => {
    if (isUser || !onLookupWord) return;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 350;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected on mobile device!
      setTimeout(() => {
        const sel = window.getSelection()?.toString().trim();
        if (sel) {
          handleWordLookup(sel);
        }
      }, 50);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Helper to format text with clean Markdown-style formatting, lists, steps, and formulas
  const renderFormattedText = (raw: string) => {
    const cleanedRaw = cleanMathFormatting(raw);
    const lines = cleanedRaw.split('\n');

    return (
      <div className="space-y-2 text-sm sm:text-[15px] leading-relaxed break-words">
        {lines.map((line, index) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={index} className="h-1.5" />;
          }

          // Step titles / Section Headers
          if (
            trimmed.startsWith('###') || 
            trimmed.startsWith('##') || 
            trimmed.startsWith('📌') || 
            trimmed.startsWith('💡') || 
            trimmed.startsWith('📝') || 
            trimmed.startsWith('🔍') || 
            trimmed.startsWith('✅')
          ) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            const isVerification = headerText.includes('🔍') || headerText.toLowerCase().includes('vérification');
            return (
              <div 
                key={index} 
                className={`mt-3 mb-1 font-bold flex items-center gap-2 text-base ${
                  isVerification
                    ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20'
                    : 'text-[#0A84FF] dark:text-[#00D4FF]'
                }`}
              >
                <span>{headerText}</span>
              </div>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const bulletText = trimmed.substring(2);
            return (
              <div key={index} className="flex items-start gap-2.5 pl-1.5 my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] dark:bg-[#00D4FF] mt-2 shrink-0" />
                <span className={isUser ? 'text-white' : 'text-[var(--text-secondary)]'}>
                  {formatInlineText(bulletText)}
                </span>
              </div>
            );
          }

          // Numbered steps (1. 2. etc)
          const numberMatch = trimmed.match(/^(\d+[\.\)])\s*(.+)/);
          if (numberMatch) {
            return (
              <div 
                key={index} 
                className="flex items-start gap-2.5 pl-2 my-1.5 bg-[var(--bg-tertiary)] p-2.5 rounded-xl border border-[var(--border-card)]"
              >
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#0A84FF]/20 text-[#0A84FF] dark:text-[#00D4FF] shrink-0 mt-0.5">
                  {numberMatch[1]}
                </span>
                <span className={isUser ? 'text-white' : 'text-[var(--text-secondary)]'}>
                  {formatInlineText(numberMatch[2])}
                </span>
              </div>
            );
          }

          // Formula or code-like block
          if (trimmed.startsWith('```') || (trimmed.startsWith('`') && trimmed.endsWith('`'))) {
            const codeContent = trimmed.replace(/^```[a-z]*|```$|^`|`$/g, '');
            return (
              <div 
                key={index} 
                className="my-2 p-3 rounded-xl bg-[var(--code-bg)] border border-[var(--code-border)] font-mono text-xs sm:text-sm text-[var(--code-text)] overflow-x-auto shadow-inner"
              >
                <code>{codeContent}</code>
              </div>
            );
          }

          // Normal paragraph
          return (
            <p key={index} className={isUser ? 'text-white' : 'text-[var(--text-secondary)]'}>
              {formatInlineText(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper for inline bold, italic, and code
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={`font-bold ${isUser ? 'text-white' : 'text-[var(--text-primary)]'} tracking-wide`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code 
            key={i} 
            className="px-1.5 py-0.5 mx-0.5 rounded bg-[var(--card-hover)] text-[#0A84FF] dark:text-[#00D4FF] border border-[var(--border-card)] font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const shareUrl = !isUser
    ? generateShareUrl(previousQuestion || "Exercice résolu", message.text, message.timestamp)
    : '';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[94%] sm:max-w-[82%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[#0A84FF] text-white flex items-center justify-center font-bold text-xs shadow-md">
              Moi
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] text-white flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(10,132,255,0.4)]">
              J
            </div>
          )}
        </div>

        {/* Bubble container */}
        <div
          className={`flex flex-col rounded-2xl p-3.5 sm:p-4 transition-all ${
            isUser
              ? 'bg-[#0A84FF] text-white rounded-tr-xs shadow-[0_4px_20px_rgba(10,132,255,0.25)]'
              : 'bg-[var(--bubble-ai)] text-[var(--bubble-ai-text)] rounded-tl-xs border border-[var(--bubble-ai-border)] shadow-[var(--shadow-subtle)]'
          }`}
        >
          {/* Attached Image (if any) */}
          {message.attachment && (
            <div className="mb-3 relative group overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]">
              <img
                src={message.attachment.previewUrl}
                alt={message.attachment.name}
                className="max-h-60 w-auto rounded-lg object-contain cursor-pointer transition-transform group-hover:scale-[1.02]"
                onClick={() => onPreviewImage(message.attachment!.previewUrl)}
              />
              <div 
                onClick={() => onPreviewImage(message.attachment!.previewUrl)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white cursor-pointer backdrop-blur-[2px]"
              >
                <Eye className="w-4 h-4" />
                <span>Agrandir l'image de l'exercice</span>
              </div>
            </div>
          )}

          {/* Voice Input Badge */}
          {message.isVoiceInput && (
            <div className="mb-1.5 flex items-center gap-1 text-[11px] font-mono text-cyan-200/90 dark:text-cyan-200/90">
              <Mic className="w-3 h-3" />
              <span>Question posée au micro</span>
            </div>
          )}

          {/* Message Content */}
          <div 
            className="overflow-hidden select-text cursor-text"
            onDoubleClick={handleDoubleClick}
            onTouchEnd={handleTouchEnd}
            title={!isUser ? "Double-clique sur un mot pour voir sa définition et son étymologie" : undefined}
          >
            {renderFormattedText(message.text)}
          </div>

          {/* Action Footer for AI messages */}
          {!isUser && (
            <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Text to Speech button */}
                <button
                  onClick={() => (isSpeaking ? onStopSpeak() : onSpeak(cleanMathFormatting(message.text)))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-[#00D4FF]/20 text-[#0A84FF] dark:text-[#00D4FF] border border-[#00D4FF]/40 font-medium'
                      : 'hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
                  }`}
                  title={isSpeaking ? 'Arrêter la lecture' : 'Écouter la réponse'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF] animate-pulse" />
                      <span>Arrêter</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Écouter</span>
                    </>
                  )}
                </button>

                {/* Quick Copy button */}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Copier le texte"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>

                {/* Share Button (Partager) */}
                <button
                  onClick={() => setIsShareOpen(!isShareOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isShareOpen
                      ? 'bg-[#0A84FF]/15 text-[#0A84FF] dark:text-[#00D4FF] font-semibold border border-[#0A84FF]/30 shadow-xs'
                      : 'hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Partager cette réponse ou la discussion"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Partager</span>
                </button>

                {/* PDF Export button */}
                {onExportPdf && (
                  <button
                    onClick={onExportPdf}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--card-hover)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] transition-colors cursor-pointer"
                    title="Télécharger cette fiche en PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                )}

                {/* Interactive Dictionary button */}
                {onLookupWord && (
                  <button
                    onClick={() => {
                      const sel = window.getSelection()?.toString().trim();
                      if (sel) {
                        handleWordLookup(sel);
                      } else {
                        const word = window.prompt("Entrez un mot pour voir sa définition et son étymologie :");
                        if (word && word.trim()) {
                          handleWordLookup(word.trim());
                        }
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--card-hover)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] transition-colors cursor-pointer"
                    title="Double-clique sur un mot du message ou clique ici pour voir sa définition et son étymologie"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF]" />
                    <span>Dictionnaire</span>
                  </button>
                )}

                {/* Dictionary Discovery Hint */}
                <div 
                  className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] select-none"
                  title="Double-cliquez sur n'importe quel mot pour afficher sa définition et son étymologie"
                >
                  <span>Double-clic sur un mot = Définition & Étymologie</span>
                </div>
              </div>

              {/* Right Action Icons: Relevance rating (Thumbs Up / Down) & Celebrate */}
              <div className="flex items-center gap-1.5 ml-auto">
                {/* Relevance rating thumbs */}
                <div 
                  className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]"
                  title="Noter la pertinence de l'explication"
                >
                  <button
                    onClick={() => {
                      const newFeedback = message.feedback === 'up' ? null : 'up';
                      if (onFeedback) {
                        onFeedback(message.id, newFeedback);
                      }
                      if (newFeedback === 'up') {
                        showToast('Explication notée pertinente ! 👍');
                      }
                    }}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      message.feedback === 'up'
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-emerald-500 hover:bg-[var(--card-hover)]'
                    }`}
                    title="Explication claire et pertinente (Pouce levé)"
                    aria-label="Pouce levé"
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${message.feedback === 'up' ? 'fill-emerald-500/30' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      const newFeedback = message.feedback === 'down' ? null : 'down';
                      if (onFeedback) {
                        onFeedback(message.id, newFeedback);
                      }
                      if (newFeedback === 'down') {
                        showToast('Merci, nous améliorons la clarté des explications ! 👎');
                      }
                    }}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      message.feedback === 'down'
                        ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--card-hover)]'
                    }`}
                    title="Explication peu claire ou à améliorer (Pouce baissé)"
                    aria-label="Pouce baissé"
                  >
                    <ThumbsDown className={`w-3.5 h-3.5 ${message.feedback === 'down' ? 'fill-rose-500/30' : ''}`} />
                  </button>
                </div>

                {/* Celebrate button */}
                <button
                  onClick={triggerCelebrate}
                  className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[#0A84FF] dark:hover:text-[#00D4FF] transition-colors cursor-pointer"
                  title="Exercice compris ! Fêter la solution 🎉"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Feedback & Action Toast Notification (if active) */}
          {shareToast && !isShareOpen && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{shareToast}</span>
              </span>
              <button
                onClick={() => setShareToast(null)}
                className="text-[10px] opacity-75 hover:opacity-100 ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Share Panel Drawer */}
          {isShareOpen && !isUser && (
            <div className="mt-3 p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF]" />
                  <span>Partager cette solution</span>
                </span>
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toast message if active */}
              {shareToast && (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-1.5 animate-pulse">
                  <Check className="w-3.5 h-3.5" />
                  <span>{shareToast}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleCopyTextOnly}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--card-hover)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <Copy className="w-4 h-4 text-[#0A84FF]" />
                  <span>Copier tout le texte</span>
                </button>

                {/* Action 2: Partage natif / direct */}
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] text-white text-xs font-bold shadow-[0_0_12px_rgba(10,132,255,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Partager l'explication</span>
                </button>

                {/* Action 3: Télécharger la fiche PDF */}
                {onExportPdf && (
                  <button
                    onClick={onExportPdf}
                    className="sm:col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--card-hover)] border border-[var(--border-card)] text-xs text-[var(--text-primary)] font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <FileDown className="w-4 h-4 text-[#0A84FF] dark:text-[#00D4FF]" />
                    <span>Télécharger la fiche de cours en PDF</span>
                  </button>
                )}
              </div>

              {/* Action 3: Lien direct partageable */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Lien partageable direct de la discussion :
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-lg py-1.5 pl-7 pr-2 text-xs font-mono select-all outline-none truncate"
                    />
                    <Link2 className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    onClick={handleCopyShareLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                      copiedLink
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#0A84FF] hover:bg-[#0070e0] text-white shadow-xs'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier lien</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  💡 Toute personne qui ouvre ce lien verra directement l'exercice et la solution étape par étape dans JANGO.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
