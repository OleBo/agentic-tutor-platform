import React, { useState, useRef } from 'react';
import { Message, AgentAction } from '../../shared/types';

interface AgentChatProps {
  sessionId: string;
}

export const AgentChat: React.FC<AgentChatProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content, timestamp: new Date() };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content, 
          sessionId,
          history: messages 
        }),
      });

      const data = await response.json();
      
      if (data.agentActions) {
        // Display agent actions to user
        data.agentActions.forEach((action: AgentAction) => {
          setMessages(prev => [...prev, {
            role: 'system',
            content: `🤖 Agent Action: ${action.type}`,
            timestamp: new Date(),
            metadata: action
          }]);
        });
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}>
            <div className={`inline-block p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) sendMessage(input);
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutoring question..."
            className="w-full p-3 border rounded-lg"
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  );
};
