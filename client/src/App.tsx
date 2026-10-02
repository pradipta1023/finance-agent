import { useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { HitlControl } from './components/HitlControl';
import { ChatInput } from './components/ChatInput';
import { useChat } from './hooks/useChat';

const App = () => {
  const {
    messages,
    input,
    setInput,
    isStreaming,
    activePersona,
    activeTool,
    hitlState,
    rejectionReason,
    setRejectionReason,
    handleSubmit,
    handleResume,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-4xl h-[85vh] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        <Header activePersona={activePersona} activeTool={activeTool} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {hitlState && (
          <HitlControl 
            hitlState={hitlState}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            onResume={handleResume}
          />
        )}

        <ChatInput 
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          isHitlActive={!!hitlState}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default App;
