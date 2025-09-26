import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  User, 
  Send, 
  HelpCircle, 
  Zap,
  CheckCircle,
  XCircle,
  Info,
  Terminal
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DataFormatter } from "./DataFormatter";

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  success?: boolean;
  data?: any;
  actions?: string[];
}

interface AgentInterface {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentInterface({ isOpen, onClose }: AgentInterface) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: "👋 Hi! I'm eziiAI, your intelligent assistant for expense management. I can help you query data and execute actions. Try commands like 'show pending claims' or 'approve all under 5000'. Type 'help' for available commands.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get available commands
  const { data: commandsData } = useQuery({
    queryKey: ["/api/agent/commands"],
    enabled: isOpen
  });

  // Command processing mutation
  const commandMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await apiRequest("/api/agent/command", {
        method: "POST",
        body: { command }
      });
      
      if (!response.ok) {
        // Handle HTTP errors with user-friendly messages
        const errorText = await response.text();
        let errorMessage = "Sorry, I couldn't process that command right now.";
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            // Convert technical error messages to user-friendly ones
            if (errorData.message.includes("authentication required") || errorData.message.includes("Unauthorized")) {
              errorMessage = "Please log in to use the AI assistant.";
            } else if (errorData.message.includes("permission")) {
              errorMessage = "You don't have permission to do that. Contact your administrator for access.";
            } else if (errorData.message.includes("not found")) {
              errorMessage = "I couldn't find what you're looking for. Try rephrasing your request.";
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch {
          // If JSON parsing fails, use the HTTP status for a friendly message
          if (response.status === 401) {
            errorMessage = "Please log in to use the AI assistant.";
          } else if (response.status === 403) {
            errorMessage = "You don't have permission to do that.";
          } else if (response.status === 404) {
            errorMessage = "I couldn't find what you're looking for.";
          } else if (response.status >= 500) {
            errorMessage = "Something went wrong on our end. Please try again in a moment.";
          }
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    onSuccess: (data, command) => {
      const agentMessage: Message = {
        id: Date.now().toString(),
        type: 'agent',
        content: data.message,
        timestamp: new Date(),
        success: data.success,
        data: data.data,
        actions: data.actions
      };
      setMessages(prev => [...prev, agentMessage]);
    },
    onError: (error: any) => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'agent',
        content: error.message || 'Something went wrong. Please try again.',
        timestamp: new Date(),
        success: false
      };
      setMessages(prev => [...prev, errorMessage]);
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Process command
    setIsProcessing(true);
    commandMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleQuickCommand = (command: string) => {
    setInputValue(command);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const quickCommands = [
    "show pending claims",
    "petty cashbox balance", 
    "show vendor onboarding",
    "explain why restriction 1000",
    "show validation rules",
    "help"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2" data-testid="agent-interface">
      <Card className="w-full max-w-4xl h-[90vh] max-h-[600px] flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>
                    <span className="text-blue-600 font-bold">ezii</span>
                    <span className="text-orange-500 font-bold">AI</span>
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {(commandsData as any)?.role || 'employee'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Expense Management Assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-agent">
              ✕
            </Button>
          </div>
        </CardHeader>

        <Separator />

        {/* Quick Commands */}
        <div className="p-3 border-b flex-shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Quick Commands:</p>
          <div className="flex flex-wrap gap-1">
            {quickCommands.map((cmd) => (
              <Button
                key={cmd}
                variant="outline"
                size="sm"
                className="text-xs h-6"
                onClick={() => handleQuickCommand(cmd)}
                data-testid={`quick-command-${cmd.replace(/\s+/g, '-')}`}
              >
                <Terminal className="w-3 h-3 mr-1" />
                {cmd}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <CardContent className="flex-1 p-0 min-h-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.type}-${message.id}`}
                >
                  {message.type === 'agent' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] min-w-0 flex-1 ${message.type === 'user' ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-lg px-3 py-2 overflow-hidden ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.success === false
                          ? 'bg-red-50 border border-red-200 text-red-800'
                          : 'bg-gray-50 border text-gray-800'
                      }`}
                    >
                      {message.type === 'agent' && message.success !== undefined && (
                        <div className="flex items-center gap-1 mb-1">
                          {message.success ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span className="text-xs font-medium">
                            {message.success ? 'Success' : 'Error'}
                          </span>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium mb-1">Actions performed:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.actions.map((action, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                <Zap className="w-2 h-2 mr-1" />
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {message.data && (
                        <div className="mt-2 pt-2 border-t border-gray-200 overflow-hidden">
                          <p className="text-xs font-medium mb-2">Data:</p>
                          <div className="max-h-[300px] overflow-y-auto">
                            <DataFormatter data={message.data} />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 order-1">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-gray-50 border rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-600">Processing your command...</p>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>

        <Separator />

        {/* Input */}
        <div className="p-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your command... (e.g., 'show pending claims', 'approve all under 5000')"
              disabled={isProcessing}
              className="flex-1"
              data-testid="input-agent-command"
            />
            <Button 
              type="submit" 
              disabled={isProcessing || !inputValue.trim()}
              data-testid="button-send-command"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleQuickCommand("help")}
              data-testid="button-help"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </form>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>Use natural language commands. Try 'help' for available actions.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}