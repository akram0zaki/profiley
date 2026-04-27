import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Send, Bot, User } from 'lucide-react';
import { api, ApiError } from '../../lib/api';

interface Citation { chunkId: string; documentId?: string | null; similarity?: number }

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

interface ChatInterfaceProps {
  userAvatar?: string;
  userName?: string;
  botName?: string;
  placeholder?: string;
  /** When provided, calls public chat-persona endpoint. */
  profileSlug?: string;
  /** When true (and no profileSlug), uses authenticated test-persona-chat preview. */
  ownerMode?: boolean;
}

export function ChatInterface({
  userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Recruiter',
  userName = 'Recruiter',
  botName = 'Profiley AI',
  placeholder = 'Ask me anything about my experience, skills, or projects...',
  profileSlug,
  ownerMode,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: `Hello! I'm ${botName}, an AI persona. Ask me about experience, skills, projects, or qualifications.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSec, setCooldownSec] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!cooldownSec) return;
    const t = setInterval(() => setCooldownSec((s) => (s && s > 1 ? s - 1 : null)), 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = { message: text, conversationId };
      let res;
      if (profileSlug) {
        res = await api.chatPersona({ ...payload, slug: profileSlug });
      } else if (ownerMode) {
        res = await api.testPersonaChat(payload);
      } else {
        throw new Error('chat-interface: profileSlug or ownerMode required');
      }
      setConversationId(res.conversationId ?? null);
      const botMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: res.message,
        timestamp: new Date(),
        citations: res.citations,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 429) {
        setCooldownSec(60);
        setError('Too many messages — please wait a minute before sending again.');
      } else {
        setError(err.message ?? 'Failed to get a response');
      }
    } finally {
      setIsTyping(false);
    }
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
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.citations.map((c, i) => (
                      <span
                        key={c.chunkId}
                        title={`chunk ${c.chunkId}`}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        ref #{i + 1}
                      </span>
                    ))}
                  </div>
                )}
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
        {error && (
          <div className="mb-2 text-xs text-destructive">{error}</div>
        )}
        {cooldownSec && (
          <div className="mb-2 text-xs text-amber-500">Cooldown: {cooldownSec}s</div>
        )}
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
            disabled={!!cooldownSec}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping || !!cooldownSec}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
