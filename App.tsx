
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Message } from './types';
import { naylaService } from './services/gemini';
import { SUGGESTED_PROMPTS, NAYLA_SYSTEM_INSTRUCTION } from './constants.tsx';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import NaylaAvatar from './components/NaylaAvatar';

// Audio Helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'Halo! Aku Nayla, asisten virtual Pak Guru Luky. ✨ Senang sekali bisa menemanimu hari ini. Ada yang bisa aku bantu? Entah itu soal pelajaran, lagi butuh teman cerita, atau sekadar cari motivasi, aku di sini buat kamu. Yuk, kita mulai!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Live API State Refs
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const stopLiveSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextsRef.current) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.output.close();
      audioContextsRef.current = null;
    }
    activeSourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();
    setIsLive(false);
    setIsSpeaking(false);
  }, []);

  const startLiveSession = useCallback(async () => {
    if (isLive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(err => console.error("Error sending input:", err));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsLive(true);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextsRef.current) {
              setIsSpeaking(true);
              const ctx = audioContextsRef.current.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                }
              };
            }

            // Handle Interrupt
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => {
            console.error("Live Error Details:", e);
            stopLiveSession();
          },
          onclose: () => {
            stopLiveSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: NAYLA_SYSTEM_INSTRUCTION,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Failed to start Live API:", error);
      alert("Maaf, gagal memulai sesi suara. Pastikan mikrofon diizinkan dan coba lagi.");
    }
  }, [isLive, stopLiveSession]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const stream = await naylaService.sendMessageStream(text);
      
      let naylaResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '', timestamp: new Date() }]);

      for await (const chunk of stream) {
        naylaResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = { ...newMessages[lastIndex], text: naylaResponse };
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'Maaf ya, ada sedikit gangguan teknis. Coba lagi sebentar lagi?',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white md:shadow-2xl md:my-4 md:rounded-[2rem] overflow-hidden border border-slate-100 relative">
      <Header />
      
      {/* Dynamic Avatar Section */}
      <NaylaAvatar isLive={isLive} isSpeaking={isSpeaking || isLoading} />

      <main 
        className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#fdfaf6] relative -mt-6 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)]"
        ref={scrollRef}
      >
        <div className="flex flex-col space-y-2 pb-10">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1].role === 'user' && (
            <div className="flex justify-start mb-6">
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-black border-2 border-white shadow-sm ring-1 ring-rose-100 animate-pulse">
                  N
                </div>
              </div>
              <div className="bg-white border border-slate-100 px-5 py-3 rounded-3xl rounded-tl-none shadow-sm flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Suggested Prompts Overlay */}
      {!isLive && messages.length < 5 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-[#fdfaf6]">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.text)}
              className="flex-shrink-0 px-4 py-2 rounded-full border border-rose-200 bg-white text-xs font-medium text-slate-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm"
            >
              {prompt.text}
            </button>
          ))}
        </div>
      )}

      {/* Live Mode Controls Overlay */}
      {isLive && (
        <div className="absolute top-[30%] left-0 right-0 z-40 flex flex-col items-center justify-center text-white pointer-events-none">
          <div className="bg-rose-500/80 backdrop-blur-md px-6 py-2 rounded-full animate-pulse border border-white/20 shadow-xl">
             <span className="text-sm font-bold tracking-widest uppercase">Mendengarkan...</span>
          </div>
        </div>
      )}

      <footer className="p-4 bg-white border-t border-rose-50 relative z-50">
        <form onSubmit={onFormSubmit} className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={isLive ? stopLiveSession : startLiveSession}
            className={`flex-shrink-0 w-14 h-14 rounded-2xl transition-all shadow-md flex items-center justify-center ${
              isLive ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-rose-100 text-rose-500 hover:bg-rose-200'
            }`}
            title="Mulai Sesi Suara"
          >
            {isLive ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
               </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isLive ? "Bicara sekarang..." : "Ketik sesuatu di sini..."}
              className="w-full py-4 pl-5 pr-14 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all text-sm md:text-base bg-slate-50/50"
              disabled={isLoading || isLive}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || isLive}
              className="absolute right-2 top-2 p-2.5 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 disabled:bg-slate-300 disabled:shadow-none transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-3">
          Nayla adalah AI yang bisa membantu, tapi jangan lupa verifikasi info penting ya. Stay happy! 🌸
        </p>
      </footer>
    </div>
  );
};

export default App;
