"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  User,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Sparkles,
  BookOpen,
  Users,
  FileText,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import {
  type AIConversation,
  type AIMessage,
  createConversation,
  deleteConversation,
} from "@/lib/actions/ai-assistant";
import { CONTEXT_TYPES } from "@/lib/constants/ai-context-types";

interface AIChatInterfaceProps {
  initialConversations: AIConversation[];
  initialMessages: AIMessage[];
  initialConversationId: string | null;
  userRole: "tutor" | "student";
}

const CONTEXT_ICONS: Record<string, React.ReactNode> = {
  general: <Sparkles className="h-4 w-4" />,
  lesson_prep: <BookOpen className="h-4 w-4" />,
  student_feedback: <Users className="h-4 w-4" />,
  content_creation: <FileText className="h-4 w-4" />,
  scheduling: <Calendar className="h-4 w-4" />,
};

export function AIChatInterface({
  initialConversations,
  initialMessages,
  initialConversationId,
  userRole,
}: AIChatInterfaceProps) {
  const [conversations, setConversations] = useState<AIConversation[]>(initialConversations);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [contextType, setContextType] = useState<string>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleNewConversation() {
    setIsCreating(true);
    const result = await createConversation({
      contextType: contextType as AIConversation["context_type"],
      userRole,
    });

    if (result.conversationId) {
      const newConversation: AIConversation = {
        id: result.conversationId,
        user_id: "",
        user_role: userRole,
        title: "New Conversation",
        context_type: contextType as AIConversation["context_type"],
        is_active: true,
        message_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations([newConversation, ...conversations]);
      setCurrentConversationId(result.conversationId);
      setMessages([]);
    }
    setIsCreating(false);
  }

  async function handleSelectConversation(conversationId: string) {
    setCurrentConversationId(conversationId);

    // Fetch messages for this conversation
    const response = await fetch(`/api/ai/conversation?id=${conversationId}`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages || []);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    const result = await deleteConversation(conversationId);
    if (!result.error) {
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || !currentConversationId || isLoading) return;

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      conversation_id: currentConversationId,
      role: "user",
      content: inputValue,
      metadata: {},
      tokens_used: null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConversationId,
          message: inputValue,
          contextType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
        const assistantMessage: AIMessage = {
          id: crypto.randomUUID(),
          conversation_id: currentConversationId,
          role: "assistant",
          content: data.response,
          metadata: {},
          tokens_used: data.tokensUsed,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update conversation in list
        setConversations(prev =>
          prev.map(c =>
            c.id === currentConversationId
              ? {
                  ...c,
                  message_count: c.message_count + 2,
                  updated_at: new Date().toISOString(),
                  title: c.message_count === 0 ? inputValue.slice(0, 50) : c.title,
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <Button
              size="sm"
              onClick={handleNewConversation}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Select value={contextType} onValueChange={setContextType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select context" />
            </SelectTrigger>
            <SelectContent>
              {CONTEXT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {CONTEXT_ICONS[type.value]}
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Start a new one above</p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      currentConversationId === conv.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {conv.title || "New Conversation"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {conv.context_type || "general"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conv.updated_at), "MMM d")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>AI Assistant</CardTitle>
            {currentConversationId && (
              <Badge variant="outline" className="ml-auto">
                {CONTEXT_TYPES.find(t => t.value === contextType)?.label || "General"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {!currentConversationId ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground max-w-md px-4">
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Welcome to AI Assistant</h3>
                <p className="text-sm mb-4">
                  I can help you with lesson preparation, student feedback, content creation,
                  scheduling, and general tutoring questions.
                </p>
                <div className="grid grid-cols-2 gap-2 text-left">
                  {CONTEXT_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className="p-3 rounded-lg border bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {CONTEXT_ICONS[type.value]}
                        {type.label}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  ))}
                </div>
                <Button className="mt-6" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100%-60px)] p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Start the conversation by sending a message</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </CardContent>

        {/* Input Area */}
        {currentConversationId && (
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={!inputValue.trim() || isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
