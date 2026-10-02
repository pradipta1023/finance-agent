import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { HitlState } from '../types';

interface HitlControlProps {
  hitlState: HitlState;
  rejectionReason: string;
  setRejectionReason: (val: string) => void;
  onResume: (action: 'approve' | 'reject') => void;
}

export const HitlControl = ({ hitlState, rejectionReason, setRejectionReason, onResume }: HitlControlProps) => {
  const [error, setError] = useState('');

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setError('');
    onResume('reject');
  };

  return (
    <div className="p-4 border-t border-white/10 bg-amber-500/10 backdrop-blur-md flex flex-col gap-3 shrink-0">
      <div className="text-amber-200 text-sm font-medium flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
        Action Required: {hitlState.uiLabel}
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 items-start">
        <button 
          onClick={() => onResume('approve')}
          className="w-full md:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer"
        >
          <CheckCircle className="w-5 h-5" />
          Approve Request
        </button>
        
        <div className="w-full md:w-auto flex-1 flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (error) setError('');
              }}
              className="flex-1 bg-black/20 border border-red-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500/50"
            />
            <button 
              onClick={handleReject}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </div>
          {error && <span className="text-red-400 text-xs px-2">{error}</span>}
        </div>
      </div>
    </div>
  );
};
