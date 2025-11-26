export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface AgentAction {
  type: string;
  input: any;
  output: any;
  timestamp: Date;
}

export interface LearningSession {
  id: string;
  studentId: string;
  topic: string;
  startTime: Date;
  currentState: 'assessing' | 'explaining' | 'practicing' | 'reviewing';
  knowledgeGaps: string[];
  masteryLevel: number;
}

export interface PracticeProblem {
  id: string;
  question: string;
  type: string;
  difficulty: string;
  hints: string[];
  solution?: string;
}
