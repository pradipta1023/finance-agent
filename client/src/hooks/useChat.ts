import { useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Message, Persona, HitlState } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', content: 'Hello! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const [activePersona, setActivePersona] = useState<Persona>({ id: 'generalChat', uiLabel: 'General Assistant' });
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [hitlState, setHitlState] = useState<HitlState | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

  const streamChat = async (messageContent: string | null, currentThreadId: string | null) => {
    setIsStreaming(true);
    
    // Create an empty agent message to hold the stream chunks
    setMessages((prev) => [...prev, { role: 'agent', content: '' }]);

    try {
      await fetchEventSource('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: currentThreadId, message: messageContent }),
        onopen: async (res) => {
          if (!res.ok) throw new Error('Network response was not ok');
        },
        onmessage: (event) => {
          if (!event.data) return;
          const data = JSON.parse(event.data);

          switch (event.event) {
            case 'thread_id':
              setThreadId(data.threadId);
              break;
            case 'persona_switch':
              setActivePersona({ id: data.agentId, uiLabel: data.uiLabel });
              break;
            case 'tool_start':
              setActiveTool(data.uiLabel);
              break;
            case 'message':
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (lastIdx >= 0) {
                  newMessages[lastIdx] = {
                    ...newMessages[lastIdx],
                    content: newMessages[lastIdx].content + data.chunk
                  };
                }
                return newMessages;
              });
              break;
            case 'control':
              setHitlState({ pendingTool: data.pendingTool, uiLabel: data.uiLabel });
              break;
            case 'error':
              console.error('Stream error:', data.error);
              break;
            case 'done':
              setActiveTool(null);
              break;
          }
        },
        onclose: () => {
          setActiveTool(null);
          setIsStreaming(false);
        },
        onerror: (err) => {
          console.error('EventSource failed:', err);
          setActiveTool(null);
          setIsStreaming(false);
          throw err;
        }
      });
    } catch (err) {
      console.error(err);
      setIsStreaming(false);
      setActiveTool(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || hitlState) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    
    await streamChat(userMessage, threadId);
  };

  const handleResume = async (action: 'approve' | 'reject') => {
    setHitlState(null);
    
    if (!threadId) return;

    try {
      const res = await fetch(`http://localhost:3000/api/resume/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: rejectionReason }),
      });
      
      setRejectionReason('');

      if (res.ok) {
        await streamChat(null, threadId);
      }
    } catch (err) {
      console.error('Failed to resume:', err);
    }
  };

  return {
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
  };
};
