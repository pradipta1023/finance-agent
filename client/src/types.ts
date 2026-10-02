export interface Message {
  role: 'user' | 'agent';
  content: string;
}

export interface Persona {
  id: string;
  uiLabel: string;
}

export interface HitlState {
  pendingTool: string;
  uiLabel: string;
}
