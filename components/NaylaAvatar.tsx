
import React, { useEffect, useState } from 'react';

interface NaylaAvatarProps {
  isLive: boolean;
  isSpeaking: boolean;
}

const NaylaAvatar: React.FC<NaylaAvatarProps> = ({ isLive, isSpeaking }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalisasi posisi mouse ke range -1 sampai 1
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full aspect-square md:aspect-video flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Latar belakang perpustakaan dengan efek parallax */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out scale-110"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000")',
          transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px) scale(1.15)`,
          opacity: 0.25
        }}
      ></div>

      {/* Grid Hologram interaktif */}
      <div 
        className="absolute inset-0 hologram-grid opacity-10 pointer-events-none"
        style={{ transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -8}px)` }}
      ></div>

      {/* Partikel Cahaya (Floating Dust) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-rose-200/20 blur-[1px] animate-float"
            style={{
              width: `${Math.random() * 5 + 2}px`,
              height: `${Math.random() * 5 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 6 + 4}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Aura Energi saat berbicara atau live */}
      {(isLive || isSpeaking) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[70%] h-[70%] rounded-full bg-rose-500/10 blur-[90px] animate-pulse"></div>
          <div className={`w-[60%] h-[60%] rounded-full border border-rose-400/10 animate-ping duration-1500 ${isSpeaking ? 'opacity-30' : 'opacity-0'}`}></div>
        </div>
      )}

      {/* Karakter Utama Nayla - Menggunakan Karakter Lorelei dari DiceBear */}
      <div 
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-700 ease-in-out`}
        style={{ 
          transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px) ${isLive ? 'scale(1.08) translateY(-10px)' : 'scale(1)'}`,
          filter: isSpeaking ? 'drop-shadow(0 0 20px rgba(244, 63, 94, 0.5))' : 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))'
        }}
      >
        <img 
          src={`https://api.dicebear.com/7.x/lorelei/svg?seed=Nayla&backgroundColor=f43f5e&backgroundType=gradientLinear&eyes=variant05&eyebrows=variant02&mouth=variant01&hair=variant02`} 
          alt="Nayla Avatar"
          className={`h-[85%] w-auto object-contain animate-breath transition-all duration-500 rounded-full bg-rose-500/10 p-4 border-4 border-rose-400/20 ${isSpeaking ? 'brightness-110' : 'brightness-95'}`}
        />

        {/* UI Hologram Mengambang */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Peta Dunia Mini */}
          <div 
            className="absolute top-[12%] right-[15%] w-20 h-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md animate-float flex items-center justify-center shadow-2xl"
            style={{ animationDelay: '0.7s', transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
          >
             <svg className="w-10 h-10 text-rose-300 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          
          {/* Ikon Hati/Empati */}
          <div 
            className="absolute bottom-[20%] left-[12%] w-16 h-16 bg-rose-500/20 rounded-full border border-rose-400/30 backdrop-blur-md animate-float flex items-center justify-center"
            style={{ animationDelay: '1.5s', transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }}
          >
             <div className="text-2xl animate-pulse">💖</div>
          </div>

          {/* Ikon Buku Terang */}
          <div 
            className="absolute top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border border-white/40 shadow-[0_0_40px_rgba(244,63,94,0.3)] animate-pulse"
            style={{ transform: `translate(-50%, -50%) translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)` }}
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      </div>

      {/* Overlay gradien bawah yang elegan */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-95"></div>

      {/* Status Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`}></div>
        <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase">
          {isLive ? 'Sesi Suara Aktif' : 'Nayla Online'}
        </span>
      </div>
    </div>
  );
};

export default NaylaAvatar;
