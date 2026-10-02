import { Bot, Loader2 } from 'lucide-react';
import type { Persona } from '../types';

interface HeaderProps {
  activePersona: Persona;
  activeTool: string | null;
}

export const Header = ({ activePersona, activeTool }: HeaderProps) => {
  return (
    <header className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <Bot className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-wide text-white">{activePersona.uiLabel}</h1>
          <p className="text-xs text-indigo-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </p>
        </div>
      </div>
      
      {activeTool && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{activeTool}</span>
        </div>
      )}
    </header>
  );
};
