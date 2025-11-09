import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, X, Send, Loader2, Bot, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CONVERSATION_STARTERS = [
  "Show me platform statistics",
  "How many leads do we have?",
  "What content is currently published?",
  "Show me recent donation stats"
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery<User>({ 
    queryKey: ['/api/auth/user'] 
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  useEffect(() => {
    if (isAdmin && sessionId) {
      fetch(`/api/admin/chatbot/history/${sessionId}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(history => {
          if (history && history.length > 0) {
            const loadedMessages: Message[] = history.map((h: any) => ({
              role: h.role,
              content: h.content,
              timestamp: new Date(h.createdAt)
            }));
            setMessages(loadedMessages);
          }
        })
        .catch(err => {
          console.error('Error loading chat history:', err);
        });
    }
  }, [isAdmin, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/admin/chatbot/message', {
        message: userMessage.content,
        sessionId
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleStarterClick = (starter: string) => {
    sendMessage(starter);
  };

  const handleClearChat = async () => {
    try {
      setIsLoading(true);
      await apiRequest('DELETE', `/api/admin/chatbot/session/${sessionId}`);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          data-testid="button-open-chatbot"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 z-50">
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-base">Admin Assistant</CardTitle>
          </div>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="gap-1"
                data-testid="button-clear-chat"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-xs">New Chat</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
              data-testid="button-close-chatbot"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh] sm:h-96 px-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
                <Bot className="h-12 w-12 text-muted-foreground mb-2" />
                <div>
                  <h3 className="font-semibold mb-2">
                    Hi{user?.firstName ? ` ${user.firstName}` : ''}! How can I help?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    I can help you troubleshoot issues, check database content, review logs, and more!
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {CONVERSATION_STARTERS.map((starter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStarterClick(starter)}
                      className="text-left justify-start hover-elevate"
                      data-testid={`button-starter-${index}`}
                    >
                      {starter}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || 'User'} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1"
              data-testid="input-chatbot-message"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={isLoading || !input.trim()}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
