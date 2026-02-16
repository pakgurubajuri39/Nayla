
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* Logo Simbol Huruf N yang Distilir */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200 border-2 border-white ring-1 ring-rose-100">
            <span className="text-xl font-black tracking-tighter select-none drop-shadow-sm">N</span>
          </div>
          {/* Status Online Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-none">Nayla</h1>
          <p className="text-[10px] text-rose-500 font-semibold tracking-wide uppercase mt-1">Asisten Pak Guru Luky</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-rose-50 px-3 py-1 rounded-full border border-rose-100 flex items-center gap-1.5 shadow-sm">
           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
           <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">Virtual Assistant</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
