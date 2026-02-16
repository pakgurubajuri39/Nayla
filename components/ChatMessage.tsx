
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isNayla = message.role === 'model';

  return (
    <div className={`flex w-full mb-6 ${isNayla ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isNayla ? 'flex-row' : 'flex-row-reverse'}`}>
        {isNayla && (
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-black border-2 border-white shadow-sm ring-1 ring-rose-100">
              N
            </div>
          </div>
        )}
        <div className={`flex flex-col ${isNayla ? 'items-start' : 'items-end'}`}>
          <div
            className={`px-5 py-3 rounded-3xl shadow-sm text-sm md:text-base leading-relaxed ${
              isNayla
                ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                : 'bg-rose-500 text-white rounded-tr-none'
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              className="prose prose-slate max-w-none prose-sm md:prose-base"
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                code: ({ children }) => <code className="bg-slate-100 px-1 rounded text-rose-600">{children}</code>,
                pre: ({ children }) => (
                  <pre className="bg-slate-800 text-white p-3 rounded-lg my-2 overflow-x-auto">
                    {children}
                  </pre>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
          <span className="mt-1 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
