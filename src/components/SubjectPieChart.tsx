import React, { useState, useMemo } from 'react';
import { PieChart as PieChartIcon, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { ChatSession } from '../types';

interface SubjectPieChartProps {
  sessions: ChatSession[];
}

interface SubjectStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

export const SubjectPieChart: React.FC<SubjectPieChartProps> = ({ sessions }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  // Compute distribution from session modes and message contents
  const stats = useMemo(() => {
    let mathCount = 0;
    let frenchCount = 0;
    let voiceCount = 0;
    let generalCount = 0;

    sessions.forEach((s) => {
      if (s.mode === 'math') {
        mathCount++;
        return;
      }
      if (s.mode === 'french') {
        frenchCount++;
        return;
      }
      if (s.mode === 'voice') {
        voiceCount++;
        return;
      }

      // If mode is 'general', inspect text and title
      const allText = (s.title + ' ' + s.messages.map((m) => m.text).join(' ')).toLowerCase();
      const mathKeywords = ['math', 'équation', 'calcul', 'pythagore', 'thalès', 'dérivée', 'intégrale', 'géométrie', 'fonction', 'triangle', 'racine', 'x²', 'cosinus'];
      const frenchKeywords = ['français', 'texte', 'métaphore', 'comparaison', 'grammaire', 'dissertation', 'figure de style', 'conjugaison', 'verbe', 'poème', 'littérature'];

      const hasMath = mathKeywords.some((k) => allText.includes(k));
      const hasFrench = frenchKeywords.some((k) => allText.includes(k));

      if (hasMath && !hasFrench) {
        mathCount++;
      } else if (hasFrench && !hasMath) {
        frenchCount++;
      } else {
        generalCount++;
      }
    });

    const total = sessions.length || 1;

    // Build categories list (only those with > 0, or fallback if 0)
    const list: SubjectStat[] = [];
    if (mathCount > 0) {
      list.push({
        name: 'Maths & Sciences',
        count: mathCount,
        percentage: Math.round((mathCount / total) * 100),
        color: '#0A84FF', // Blue
        icon: '📐',
      });
    }
    if (frenchCount > 0) {
      list.push({
        name: 'Français & Lettres',
        count: frenchCount,
        percentage: Math.round((frenchCount / total) * 100),
        color: '#8B5CF6', // Purple
        icon: '✍️',
      });
    }
    if (voiceCount > 0) {
      list.push({
        name: 'Oral & Vocal',
        count: voiceCount,
        percentage: Math.round((voiceCount / total) * 100),
        color: '#EC4899', // Pink
        icon: '🎙️',
      });
    }
    if (generalCount > 0 || list.length === 0) {
      list.push({
        name: 'Devoirs Généraux',
        count: generalCount || 1,
        percentage: Math.round(((generalCount || 1) / total) * 100),
        color: '#10B981', // Emerald
        icon: '📚',
      });
    }

    return {
      list,
      total: sessions.length,
    };
  }, [sessions]);

  // SVG Donut metrics
  const radius = 28;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius; // ~175.93

  let accumulatedPercent = 0;

  return (
    <div className="mx-3 mt-2 mb-1 p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-card)] shadow-xs transition-all">
      {/* Header with collapse toggle */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-1.5">
          <PieChartIcon className="w-3.5 h-3.5 text-[#0A84FF] dark:text-[#00D4FF]" />
          <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[#0A84FF] transition-colors">
            Répartition des matières
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            {stats.total} session{stats.total > 1 ? 's' : ''}
          </span>
          <button 
            className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors p-0.5"
            aria-label={isCollapsed ? 'Déplier la visualisation' : 'Replier la visualisation'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Pie Chart & Legend Content */}
      {!isCollapsed && (
        <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            {/* SVG Pie Donut */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg 
                className="w-20 h-20 -rotate-90 transform" 
                viewBox="0 0 80 80"
              >
                {/* Background Track */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth={strokeWidth}
                />

                {/* Slices */}
                {stats.list.map((item, idx) => {
                  const dashLength = (item.percentage / 100) * circumference;
                  const dashOffset = (accumulatedPercent / 100) * circumference;
                  accumulatedPercent += item.percentage;

                  const isHovered = hoveredSubject === item.name;

                  return (
                    <circle
                      key={idx}
                      cx="40"
                      cy="40"
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={-dashOffset}
                      strokeLinecap="round"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredSubject(item.name)}
                      onMouseLeave={() => setHoveredSubject(null)}
                    />
                  );
                })}
              </svg>

              {/* Center hole info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs font-black text-[var(--text-primary)] leading-none">
                  {stats.total}
                </span>
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase leading-none mt-0.5">
                  cours
                </span>
              </div>
            </div>

            {/* Subject List / Legend */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {stats.list.map((item, idx) => {
                const isHovered = hoveredSubject === item.name;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredSubject(item.name)}
                    onMouseLeave={() => setHoveredSubject(null)}
                    className={`flex items-center justify-between text-[11px] p-1 rounded-md transition-colors cursor-pointer ${
                      isHovered ? 'bg-[var(--card-hover)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-[var(--text-secondary)] font-medium">
                        {item.name}
                      </span>
                    </div>

                    <span 
                      className="font-mono text-[10px] font-bold shrink-0 ml-1.5"
                      style={{ color: item.color }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick encouragement footer */}
          <div className="mt-2 pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#0A84FF]" />
              Matière principale :
            </span>
            <span className="font-bold text-[var(--text-primary)] truncate max-w-[130px]">
              {stats.list[0]?.name || 'Général'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
