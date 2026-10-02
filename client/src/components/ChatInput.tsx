import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  isStreaming: boolean;
  isHitlActive: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatInput = ({ input, setInput, isStreaming, isHitlActive, onSubmit }: ChatInputProps) => {
  return (
    <div className="p-4 border-t border-white/10 bg-white/5 shrink-0">
      <form onSubmit={onSubmit} className="flex gap-3 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming || isHitlActive}
          placeholder={isHitlActive ? "Waiting for action..." : "Type your message..."}
          className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || isHitlActive}
          className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl transition-colors cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
