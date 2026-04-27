import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  userAvatar?: string;
  userName?: string;
  botName?: string;
  placeholder?: string;
}

const mockResponses = [
  "I'm a Senior Software Engineer with 10+ years of experience in full-stack development. I specialize in AI/ML systems, cloud architecture, and distributed systems. I've led the development of platforms serving millions of users.",
  "I've worked extensively with React, Node.js, Python, and TypeScript. I'm particularly skilled in building scalable microservices architectures using Kubernetes and Docker.",
  "One of my key projects is RepCue, a comprehensive healthcare SaaS platform that includes video consultations, appointment scheduling, and AI-powered symptom checking.",
  "I hold AWS Certified Solutions Architect - Professional and Google Cloud Professional Cloud Architect certifications. I have deep expertise in cloud infrastructure and DevOps practices.",
  "I've successfully mentored 15+ junior engineers and established engineering best practices across multiple teams. I'm passionate about knowledge sharing and technical documentation.",
];

export function ChatInterface({
  userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Recruiter',
  userName = 'Recruiter',
  botName = 'Akram AI',
  placeholder = 'Ask me anything about my experience, skills, or projects...',
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: `Hello! I'm ${botName}, an AI representation of Akram's professional profile. I can answer questions about his experience, skills, projects, and qualifications. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              {message.role === 'assistant' ? (
                <>
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Akram" />
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <div
              className={`flex flex-col gap-1 max-w-[80%] ${
                message.role === 'user' ? 'items-end' : ''
              }`}
            >
              <span className="text-xs text-muted-foreground">
                {message.role === 'assistant' ? botName : userName}
              </span>
              <Card
                className={`p-3 ${
                  message.role === 'assistant'
                    ? 'bg-card'
                    : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </Card>
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Akram" />
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="p-3 bg-card">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/40 p-4 bg-background/95 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
