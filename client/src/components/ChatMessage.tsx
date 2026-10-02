import { User, Bot } from 'lucide-react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
          isUser 
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
            : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
        }`}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
        <div className={`p-4 rounded-2xl ${
          isUser
            ? 'bg-blue-600/20 border border-blue-500/20 text-blue-50 rounded-tr-sm'
            : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
        }`}>
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
};
