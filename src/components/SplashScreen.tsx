import React from 'react';

interface SplashScreenProps {
  onOpenApp: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onOpenApp }) => {
  return (
    <div 
      onClick={onOpenApp}
      className="fixed inset-0 z-50 bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 select-none cursor-pointer transition-colors duration-200"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0A84FF]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Center: Seulement le logo et l'instruction en dessous */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo JANGO */}
        <div className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-300">
          {/* Outer glow ring */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[#0A84FF] to-[#00D4FF] rounded-[36px] blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
          
          {/* Main Logo Square */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-gradient-to-br from-[#0A84FF] to-[#00D4FF] rounded-[32px] flex items-center justify-center text-white text-7xl sm:text-8xl font-black shadow-[0_0_60px_#0A84FF] group-hover:shadow-[0_0_90px_#00D4FF] transition-all">
            <span className="drop-shadow-lg tracking-tight">J</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-8 text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0A84FF] via-[#00D4FF] to-[#60A5FA] tracking-[10px] pl-[10px] drop-shadow-sm">
          JANGO
        </h1>

        {/* L'instruction en dessous */}
        <p className="mt-6 text-sm sm:text-base text-[var(--text-secondary)] font-medium animate-pulse tracking-wide">
          Toucher sur le logo pour entrer
        </p>
      </div>
    </div>
  );
};
